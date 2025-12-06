// functions/api/historique.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// --- Définition minimale pour le build local Next.js ---
// Cloudflare Pages fournit le vrai type à l'exécution.
type PagesFunction<Env = unknown> = (context: {
  request: Request
  env: Env
}) => Promise<Response> | Response
// ------------------------------------------------------

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const requestSchema = z.object({
  email: z.string().email(),
})

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(init?.headers || {}),
    },
  })
}

export const onRequest: PagesFunction<EnvBindings> = async (context) => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, { status: 200 })
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      { ok: false, error: 'METHOD_NOT_ALLOWED' },
      { status: 405 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse(
      { ok: false, error: 'INVALID_JSON' },
      { status: 400 }
    )
  }

  const parse = requestSchema.safeParse(body)
  if (!parse.success) {
    return jsonResponse(
      { ok: false, error: 'INVALID_PAYLOAD', details: parse.error.flatten() },
      { status: 400 }
    )
  }

  const { email } = parse.data

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, input_raw, output_json')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return jsonResponse(
      { ok: false, error: `DB_ERROR: ${error.message}` },
      { status: 500 }
    )
  }

  const items =
    data?.map((row) => {
      const output = (row.output_json ?? {}) as any

      const fiche = output?.fiche ?? {}
      const scoreGlobal = output?.score_global ?? {}
      const avis = output?.avis_acheteur ?? output?.avis ?? {}

      const note =
        typeof scoreGlobal.note_sur_100 === 'number'
          ? scoreGlobal.note_sur_100
          : null

      const vehiculeTitle: string =
        typeof fiche.titre === 'string' && fiche.titre.trim().length > 0
          ? fiche.titre
          : 'Véhicule analysé'

      const resume: string =
        typeof avis.resume_simple === 'string' && avis.resume_simple.trim()
          ? avis.resume_simple
          : typeof avis.resume === 'string' && avis.resume.trim()
          ? avis.resume
          : 'Analyse disponible.'

      const hasRapport =
        output &&
        (typeof fiche === 'object' ||
          typeof scoreGlobal === 'object' ||
          typeof avis === 'object')

      return {
        id: row.id,
        created_at: row.created_at,
        vehicule: vehiculeTitle,
        note,
        resume,
        hasRapport: !!hasRapport,
      }
    }) ?? []

  return jsonResponse({ ok: true, items })
}
