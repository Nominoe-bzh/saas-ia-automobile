import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRICE_SINGLE: string
  STRIPE_PRICE_PACK: string
  STRIPE_PRICE_UNLIMITED: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

// Configuration des plans avec crédits et validité
type PlanConfig = {
  planType: 'SINGLE' | 'PACK' | 'UNLIMITED'
  credits: number | null // null pour UNLIMITED
  validityDays: number | null // null pour crédits sans limite de temps
}

const PLAN_CONFIGS: Record<string, PlanConfig> = {
  SINGLE: {
    planType: 'SINGLE',
    credits: 1,
    validityDays: null, // Crédits sans expiration
  },
  PACK: {
    planType: 'PACK',
    credits: 5,
    validityDays: 365, // 1 an
  },
  UNLIMITED: {
    planType: 'UNLIMITED',
    credits: null, // Pas de limite
    validityDays: 30, // Abonnement mensuel
  },
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  console.log('🚀 WEBHOOK STRIPE V3 - REFACTORED WITH SUBSCRIPTIONS TABLE')

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const rawBody = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] No stripe-signature header')
      return new Response('No signature', { status: 400 })
    }

    // Initialiser Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      // @ts-ignore
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Vérifier la signature
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
      console.error('[Webhook] ❌ Signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }

    console.log('[Webhook] Event received:', event.type, event.id)

    // Gérer l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const email = session.customer_email || session.metadata?.email
      const userId = session.metadata?.user_id
      const planTypeRaw = session.metadata?.plan_type // 'SINGLE', 'PACK', 'UNLIMITED'
      const sessionId = session.id
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null
      const amountTotal = session.amount_total || 0
      const currency = session.currency || 'eur'

      if (!email) {
        console.error('[Webhook] Missing email in session')
        return new Response('Missing email', { status: 400 })
      }

      if (!planTypeRaw || !['SINGLE', 'PACK', 'UNLIMITED'].includes(planTypeRaw)) {
        console.error('[Webhook] Invalid plan_type:', planTypeRaw)
        return new Response('Invalid plan_type', { status: 400 })
      }

      const planConfig = PLAN_CONFIGS[planTypeRaw]

      console.log('[Webhook] Processing payment:', {
        email,
        userId,
        planType: planConfig.planType,
        credits: planConfig.credits,
        validityDays: planConfig.validityDays,
        sessionId,
      })

      // Initialiser Supabase avec SERVICE_ROLE_KEY pour bypass RLS
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })

      // 1. Récupérer le user_id depuis l'email si non fourni dans metadata
      let finalUserId = userId
      if (!finalUserId) {
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', email.trim())
          .maybeSingle()

        if (userError || !userData) {
          console.error('[Webhook] User not found for email:', email, userError)
          return new Response('User not found', { status: 404 })
        }

        finalUserId = userData.id
      }

      console.log('[Webhook] User ID resolved:', finalUserId)

      // 2. Calculer la date de validité
      let validUntil: string | null = null
      if (planConfig.validityDays) {
        const now = new Date()
        now.setDate(now.getDate() + planConfig.validityDays)
        validUntil = now.toISOString()
      }

      // 3. Enregistrer le paiement
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: finalUserId,
        stripe_customer_id: session.customer,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: sessionId,
        amount_cents: amountTotal,
        currency,
        plan_type: planConfig.planType,
        credits: planConfig.credits,
        valid_until: validUntil,
        status: 'succeeded',
        raw_event: event as any,
      })

      if (paymentError) {
        console.error('[Webhook] Error inserting payment:', paymentError)
        return new Response('Database error (payments)', { status: 500 })
      }

      // 4. Mettre à jour ou créer l'abonnement
      const { data: existingSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', finalUserId)
        .maybeSingle()

      if (fetchError) {
        console.error('[Webhook] Error fetching subscription:', fetchError)
      }

      if (existingSub) {
        // Logique de mise à jour selon le type de plan

        if (planConfig.planType === 'UNLIMITED') {
          // Remplacer par un plan illimité
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              plan_type: 'UNLIMITED',
              credits: null,
              valid_until: validUntil,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription as string | null,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id)

          if (updateError) {
            console.error('[Webhook] Error updating subscription (UNLIMITED):', updateError)
            return new Response('Database error (update)', { status: 500 })
          }

          console.log('[Webhook] Subscription upgraded to UNLIMITED')
        } else {
          // Ajouter des crédits (SINGLE ou PACK)
          const currentCredits = existingSub.credits || 0
          const newCredits = currentCredits + (planConfig.credits || 0)

          // Si on achète un PACK avec validité, mettre à jour la date de validité
          const newValidUntil =
            planConfig.validityDays && validUntil
              ? validUntil
              : existingSub.valid_until // Garder l'ancienne date si pas de nouvelle

          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              plan_type: planConfig.planType,
              credits: newCredits,
              valid_until: newValidUntil,
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id)

          if (updateError) {
            console.error('[Webhook] Error updating subscription (credits):', updateError)
            return new Response('Database error (update)', { status: 500 })
          }

          console.log('[Webhook] Credits added:', {
            oldCredits: currentCredits,
            newCredits,
            validUntil: newValidUntil,
          })
        }
      } else {
        // Créer un nouvel abonnement (normalement, le trigger devrait l'avoir créé)
        const { error: insertError } = await supabase.from('subscriptions').insert({
          user_id: finalUserId,
          plan_type: planConfig.planType,
          credits: planConfig.credits,
          valid_until: validUntil,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription as string | null,
          status: 'active',
        })

        if (insertError) {
          console.error('[Webhook] Error inserting subscription:', insertError)
          return new Response('Database error (insert)', { status: 500 })
        }

        console.log('[Webhook] New subscription created')
      }

      console.log('[Webhook] ✅ Payment processed successfully for:', email)
    }

    // Toujours répondre 200 à Stripe
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[Webhook] Unexpected error:', error)
    return new Response(`Webhook error: ${error.message}`, { status: 500 })
  }
}
