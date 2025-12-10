import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

/**
 * GET /api/user/overview
 * 
 * Retourne le profil complet de l'utilisateur authentifié :
 * - Crédits restants (subscriptions)
 * - Historique des analyses (analyses)
 * - Historique des paiements (payments)
 */
export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  try {
    // Récupérer le token d'authentification depuis le header Authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        { 
          ok: false, 
          error: 'UNAUTHORIZED', 
          message: 'Token d\'authentification manquant' 
        }, 
        401
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialiser Supabase avec le token utilisateur
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // 1. Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('[UserOverview] User auth error:', userError)
      return jsonResponse(
        { 
          ok: false, 
          error: 'UNAUTHORIZED', 
          message: 'Utilisateur non authentifié' 
        }, 
        401
      )
    }

    console.log('[UserOverview] Fetching data for user:', user.id, user.email)

    // 2. Récupérer l'abonnement (crédits)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      console.error('[UserOverview] Subscription fetch error:', subError)
    }

    // 3. Récupérer l'historique des analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id, email, car_model, year, created_at')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(10)

    if (analysesError) {
      console.error('[UserOverview] Analyses fetch error:', analysesError)
    }

    // 4. Récupérer l'historique des paiements
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, plan_type, amount_cents, currency, status, credits, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (paymentsError) {
      console.error('[UserOverview] Payments fetch error:', paymentsError)
    }

    // 5. Construire la réponse
    const isUnlimited = subscription?.plan_type === 'UNLIMITED' && 
                       (subscription?.valid_until === null || new Date(subscription.valid_until) > new Date())

    const response = {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      credits: {
        remaining: isUnlimited ? null : (subscription?.credits ?? 0),
        consumed: subscription?.credits_consumed ?? 0,
        planType: subscription?.plan_type ?? 'FREE',
        isUnlimited,
        validUntil: subscription?.valid_until,
        status: subscription?.status ?? 'active',
      },
      subscription: {
        id: subscription?.id,
        isValid: subscription?.status === 'active',
        stripeCustomerId: subscription?.stripe_customer_id,
        createdAt: subscription?.created_at,
        updatedAt: subscription?.updated_at,
      },
      history: {
        analyses: analyses || [],
        payments: payments || [],
      },
    }

    console.log('[UserOverview] Success:', {
      userId: user.id,
      credits: response.credits.remaining,
      planType: response.credits.planType,
      analysesCount: analyses?.length ?? 0,
      paymentsCount: payments?.length ?? 0,
    })

    return jsonResponse(response)
  } catch (error: any) {
    console.error('[UserOverview] Unexpected error:', error)
    return jsonResponse(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Erreur lors de la récupération des données utilisateur',
      },
      500
    )
  }
}

