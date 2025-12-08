import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type PagesContext = {
  request: Request
  env: EnvBindings
}

// En-têtes CORS réutilisables
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'Content-Type',
}

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  // IMPORTANT : on ne bloque plus sur la méthode
  // (on accepte GET et POST, Cloudflare ou le navigateur peuvent parfois adapter la méthode)

  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return jsonResponse(400, { ok: false, error: 'MISSING_ID' })
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
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Supabase error /api/rapport', error)
      return jsonResponse(500, {
        ok: false,
        error: 'DB_ERROR',
        detail: error.message,
      })
    }

    if (!data || !data.output_json) {
      return jsonResponse(404, {
        ok: false,
        error: 'RAPPORT_NOT_FOUND',
      })
    }

    const output =
      typeof data.output_json === 'string'
        ? JSON.parse(data.output_json)
        : data.output_json

    return jsonResponse(200, {
      ok: true,
      data: output,
    })
  } catch (e: any) {
    console.error('Unexpected /api/rapport', e)
    return jsonResponse(500, {
      ok: false,
      error: 'UNEXPECTED_ERROR',
      detail: e?.message ?? String(e),
    })
  }
}
