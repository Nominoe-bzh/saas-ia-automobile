import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

export const onRequest = async (context: { request: Request; env: EnvBindings }) => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const emailRaw = body?.email
  if (!emailRaw || typeof emailRaw !== 'string') {
    return jsonResponse({ ok: false, error: 'EMAIL_REQUIRED' }, 400)
  }

  const email = emailRaw.trim()
  if (!email) {
    return jsonResponse({ ok: false, error: 'EMAIL_REQUIRED' }, 400)
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

  // IMPORTANT : on ne sélectionne QUE les colonnes qui existent
  const { data, error } = await supabase
    .from('analyses')
    .select(
      `
      id,
      created_at,
      email,
      input_raw
    `
    )
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    // On renvoie l’erreur mais SANS status 500
    return jsonResponse({
      ok: false,
      error: `DB_ERROR: ${error.message}`,
    })
  }

  // items = tableau d’objets avec id, created_at, email, input_raw
  return jsonResponse({
    ok: true,
    items: data ?? [],
  })
}
