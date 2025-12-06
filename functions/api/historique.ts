// functions/api/historique.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const requestSchema = z.object({
  email: z.string().email('Email invalide'),
})

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

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parse = requestSchema.safeParse(body)
  if (!parse.success) {
    return jsonResponse(
      { ok: false, error: 'INVALID_PAYLOAD', details: parse.error.flatten() },
      400,
    )
  }

  const { email } = parse.data

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, input_raw, output_json')
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Supabase error /api/historique:', error)
    return jsonResponse(
      { ok: false, error: 'DB_ERROR', message: 'Erreur lors de la récupération de l\'historique' },
      500,
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
