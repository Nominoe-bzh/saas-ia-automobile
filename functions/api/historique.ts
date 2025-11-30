import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const inputSchema = z.object({
  email: z.string().email(),
})

const CORS_HEADERS: Record<string, string> = {
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

function getSupabase(env: EnvBindings) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
}

export const onRequest = async (context: {
  request: Request
  env: EnvBindings
}): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // Lecture JSON
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parsed = inputSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, error: 'INVALID_INPUT', details: parsed.error.flatten() },
      400,
    )
  }

  const { email } = parsed.data
  const supabase = getSupabase(env)

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, input_raw, output_json')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return jsonResponse({ ok: false, error: 'HISTORIQUE_READ_ERROR' }, 500)
  }

  const items = (data || []).map((row: any) => {
    const out = row.output_json || {}
    const fiche = out.fiche || {}
    const score = out.score_global || {}

    const note =
      typeof score.note_sur_100 === 'number' ? score.note_sur_100 : null

    return {
      id: row.id,
      created_at: row.created_at,
      input_raw: row.input_raw,
      titre: fiche.titre || null,
      marque: fiche.marque || null,
      modele: fiche.modele || null,
      annee: fiche.annee || null,
      kilometrage: fiche.kilometrage || null,
      energie: fiche.energie || null,
      prix: fiche.prix || null,
      note,
    }
  })

  return jsonResponse({
    ok: true,
    items,
  })
}
