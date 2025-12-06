import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type PagesContext = {
  request: Request
  env: EnvBindings
}

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    },
  })
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return jsonResponse(400, { ok: false, error: 'MISSING_ID' })
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

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
