import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Lire le raw body
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

    // Vérifier la signature (async pour Cloudflare Workers)
    console.log('[Webhook] 🔥 USING constructEventAsync - VERSION DEPLOYED AT', new Date().toISOString())
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('[Webhook] ❌ Signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, {
        status: 400,
      })
    }

    console.log('[Webhook] Event received:', event.type, event.id)

    // Gérer l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const email = session.customer_email || session.metadata?.email
      const planType = session.metadata?.plan_type
      const sessionId = session.id
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null
      const amountTotal = session.amount_total || 0
      const currency = session.currency || 'eur'

      if (!email || !planType) {
        console.error('[Webhook] Missing email or plan_type in session metadata')
        return new Response('Missing metadata', { status: 400 })
      }

      // Calculer les crédits
      const creditsMap: Record<string, number> = {
        single: 1,
        pack5: 5,
        pack30: 30,
      }
      const credits = creditsMap[planType]

      if (!credits) {
        console.error('[Webhook] Invalid plan_type:', planType)
        return new Response('Invalid plan_type', { status: 400 })
      }

      console.log('[Webhook] Processing payment:', {
        email,
        planType,
        credits,
        sessionId,
      })

      // Initialiser Supabase
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })

      // 1. Insérer dans payments
      const { error: paymentError } = await supabase.from('payments').insert({
        email: email.trim(),
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId,
        amount: amountTotal,
        currency,
        plan_type: planType,
      })

      if (paymentError) {
        console.error('[Webhook] Error inserting payment:', paymentError)
        return new Response('Database error (payments)', { status: 500 })
      }

      // 2. Upsert dans paid_plans
      // Chercher si une entrée existe déjà pour cet email et plan_type
      const { data: existingPlan, error: fetchError } = await supabase
        .from('paid_plans')
        .select('*')
        .eq('email', email.trim())
        .eq('plan_type', planType)
        .maybeSingle()

      if (fetchError) {
        console.error('[Webhook] Error fetching paid_plans:', fetchError)
      }

      if (existingPlan) {
        // Incrémenter les crédits existants
        const newCredits = existingPlan.credits_remaining + credits
        const { error: updateError } = await supabase
          .from('paid_plans')
          .update({
            credits_remaining: newCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPlan.id)

        if (updateError) {
          console.error('[Webhook] Error updating paid_plans:', updateError)
          return new Response('Database error (update)', { status: 500 })
        }

        console.log('[Webhook] Credits updated:', {
          email,
          planType,
          oldCredits: existingPlan.credits_remaining,
          newCredits,
        })
      } else {
        // Insérer nouveau plan
        const { error: insertError } = await supabase.from('paid_plans').insert({
          email: email.trim(),
          plan_type: planType,
          credits_remaining: credits,
        })

        if (insertError) {
          console.error('[Webhook] Error inserting paid_plans:', insertError)
          return new Response('Database error (insert)', { status: 500 })
        }

        console.log('[Webhook] New plan created:', { email, planType, credits })
      }

      console.log('[Webhook] Payment processed successfully for:', email)
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

