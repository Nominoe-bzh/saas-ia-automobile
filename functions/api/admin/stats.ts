// Cloudflare Function pour récupérer les stats Plausible
type EnvBindings = {
  PLAUSIBLE_API_KEY: string
  PLAUSIBLE_SITE_ID?: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // Vérifier que l'API key est configurée
  if (!env.PLAUSIBLE_API_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: 'PLAUSIBLE_API_KEY not configured',
        message: 'Configurez PLAUSIBLE_API_KEY dans Cloudflare Pages',
      },
      500,
    )
  }

  const url = new URL(request.url)
  const period = url.searchParams.get('period') || '7d'
  const siteId = env.PLAUSIBLE_SITE_ID || 'checktonvehicule.fr'

  try {
    // Récupérer les stats principales
    const statsRes = await fetch(
      `https://plausible.io/api/v1/stats/aggregate?site_id=${siteId}&period=${period}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
      {
        headers: {
          Authorization: `Bearer ${env.PLAUSIBLE_API_KEY}`,
        },
      },
    )

    if (!statsRes.ok) {
      const errorText = await statsRes.text()
      throw new Error(`Plausible API error (${statsRes.status}): ${errorText}`)
    }

    const statsData = await statsRes.json()

    // Récupérer les événements personnalisés
    const eventsRes = await fetch(
      `https://plausible.io/api/v1/stats/breakdown?site_id=${siteId}&period=${period}&property=event:name&metrics=visitors,events`,
      {
        headers: {
          Authorization: `Bearer ${env.PLAUSIBLE_API_KEY}`,
        },
      },
    )

    let eventsData = []
    if (eventsRes.ok) {
      const eventsJson = await eventsRes.json()
      eventsData = eventsJson.results || []
    }

    return jsonResponse({
      ok: true,
      data: {
        stats: statsData.results,
        events: eventsData,
        period,
      },
    })
  } catch (error: any) {
    console.error('Error fetching Plausible stats:', error)
    return jsonResponse(
      {
        ok: false,
        error: 'PLAUSIBLE_FETCH_ERROR',
        message: error.message || 'Impossible de recuperer les statistiques',
      },
      500,
    )
  }
}

