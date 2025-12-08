import Stripe from 'stripe'

type EnvBindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_PRICE_SINGLE: string
  STRIPE_PRICE_PACK: string
  STRIPE_PRICE_UNLIMITED: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  try {
    const body = (await request.json()) as { email?: string; planType?: string; userId?: string }
    const { email, planType, userId } = body

    // Validation
    if (!email || !email.trim()) {
      return jsonResponse({ ok: false, error: 'MISSING_EMAIL', message: 'Email requis' }, 400)
    }

    if (!planType || !['SINGLE', 'PACK', 'UNLIMITED'].includes(planType)) {
      return jsonResponse({ ok: false, error: 'INVALID_PLAN', message: 'Plan invalide' }, 400)
    }

    // Mapper planType → Stripe Price ID
    const priceIdMap: Record<string, string> = {
      SINGLE: env.STRIPE_PRICE_SINGLE,
      PACK: env.STRIPE_PRICE_PACK,
      UNLIMITED: env.STRIPE_PRICE_UNLIMITED,
    }

    const priceId = priceIdMap[planType]
    if (!priceId) {
      return jsonResponse(
        { ok: false, error: 'PRICE_NOT_CONFIGURED', message: 'Prix Stripe non configuré' },
        500
      )
    }

    // Initialiser Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      // @ts-ignore - Stripe SDK compatible with Cloudflare Workers
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Créer la session Stripe Checkout avec metadata enrichie
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.trim(),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        email: email.trim(),
        plan_type: planType, // SINGLE, PACK ou UNLIMITED
        user_id: userId || '', // userId si disponible (pour utilisateurs authentifiés)
      },
      success_url: `https://www.checktonvehicule.fr/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.checktonvehicule.fr/billing/cancel`,
    })

    console.log('[Stripe] Session created:', session.id, 'planType:', planType)

    return jsonResponse({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('[Stripe] Error creating session:', error)
    return jsonResponse(
      {
        ok: false,
        error: 'STRIPE_ERROR',
        message: error.message || 'Erreur lors de la création de la session de paiement',
      },
      500
    )
  }
}
