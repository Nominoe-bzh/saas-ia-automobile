// functions/api/historique.ts

import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

// Petit helper pour la réponse JSON
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

export const onRequest = async (context: {
  request: Request
  env: EnvBindings
}) => {
  const { request, env } = context

  if (request.method !== 'POST') {
    return jsonResponse(
      { ok: false, error: 'METHOD_NOT_ALLOWED' },
      405
    )
  }

  let emailRaw: unknown
  try {
    const body = await request.json()
    emailRaw = (body as any)?.email
  } catch {
    return jsonResponse(
      { ok: false, error: 'INVALID_JSON' },
      400
    )
  }

  const email =
    typeof emailRaw === 'string'
      ? emailRaw.trim().toLowerCase()
      : ''

  if (!email) {
    return jsonResponse(
      { ok: false, error: 'EMAIL_REQUIRED' },
      400
    )
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

  // Requête EXACTEMENT alignée sur ta table "analyses"
  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, email, input_raw, output_json')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('historique / analyses error:', error)
    return jsonResponse(
      { ok: false, error: 'DB_ERROR' },
      500
    )
  }

  const rows = (data ?? []) as {
    id: string
    created_at: string
    email: string | null
    input_raw: string | null
    output_json: any | null
  }[]

  const items = rows.map((row) => {
    const out = row.output_json || {}
    return {
      id: row.id,
      created_at: row.created_at,
      email: row.email,
      input_raw: row.input_raw,
      fiche: out.fiche ?? null,
      score_global: out.score_global ?? null,
      avis_acheteur: out.avis_acheteur ?? null,
      risques: out.risques ?? null,
    }
  })

  return jsonResponse({
    ok: true,
    items,
  })
}
