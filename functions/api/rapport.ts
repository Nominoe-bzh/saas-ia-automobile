import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

// En-têtes CORS réutilisables
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'Content-Type',
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

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Accepte GET et POST pour flexibilité
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id || id.trim().length === 0) {
    return jsonResponse({ ok: false, error: 'MISSING_ID', message: 'Identifiant de rapport requis' }, 400)
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  )

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('output_json')
      .eq('id', id.trim())
      .maybeSingle()

    if (error) {
      console.error('Supabase error /api/rapport:', error)
      return jsonResponse(
        {
          ok: false,
          error: 'DB_ERROR',
          message: 'Erreur lors de la récupération du rapport',
        },
        500,
      )
    }

    if (!data || !data.output_json) {
      return jsonResponse(
        {
          ok: false,
          error: 'RAPPORT_NOT_FOUND',
          message: 'Rapport introuvable pour cet identifiant',
        },
        404,
      )
    }

    let output: any
    try {
      output =
        typeof data.output_json === 'string'
          ? JSON.parse(data.output_json)
          : data.output_json
    } catch (parseError) {
      console.error('JSON parse error /api/rapport:', parseError)
      return jsonResponse(
        {
          ok: false,
          error: 'INVALID_DATA',
          message: 'Données du rapport corrompues',
        },
        500,
      )
    }

    return jsonResponse({
      ok: true,
      data: output,
    })
  } catch (e: any) {
    console.error('Unexpected error /api/rapport:', e)
    return jsonResponse(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Erreur inattendue lors de la récupération du rapport',
      },
      500,
    )
  }
}
