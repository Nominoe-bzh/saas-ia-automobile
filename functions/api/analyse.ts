import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string
}

const analyseInputSchema = z.object({
  annonce: z.string().min(10),
  email: z.string().email().nullable().optional(),
})

const MAX_DEMO = 3

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*', // autorise localhost + prod
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

// on tape le contexte "à la main" pour éviter PagesFunction
interface CFContext {
  request: Request
  env: EnvBindings
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // --- Parse JSON ---
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parsed = analyseInputSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse(
      {
        ok: false,
        error: 'INVALID_INPUT',
        details: parsed.error.flatten(),
      },
      400,
    )
  }

  const { annonce, email } = parsed.data
  const supabase = getSupabase(env)

  // --- Gestion du quota ---
  const quotaKey = email || 'no-email'
  const { data: quotaRow, error: quotaError } = await supabase
    .from('demo_quota')
    .select('*')
    .eq('email', quotaKey)
    .maybeSingle()

  if (quotaError && quotaError.code !== 'PGRST116') {
    return jsonResponse({ ok: false, error: 'QUOTA_READ_ERROR' }, 500)
  }

  const currentCount = quotaRow?.count ?? 0
  if (currentCount >= MAX_DEMO) {
    return jsonResponse(
      {
        ok: false,
        error: 'QUOTA_EXCEEDED',
        quota_count: currentCount,
        quota_limit: MAX_DEMO,
      },
      429,
    )
  }

    // Mise à jour du compteur (insert ou update selon le cas)
    let writeError = null
  
  if (!quotaRow) {
    // première fois pour cet email
    const { error } = await supabase.from('demo_quota').insert({
      email: quotaKey,
      count: currentCount + 1,
    })
    writeError = error
  } else {
    // email déjà présent → on incrémente
    const { error } = await supabase
      .from('demo_quota')
      .update({ count: currentCount + 1 })
      .eq('email', quotaKey)
    writeError = error
  }

  if (writeError) {
    return jsonResponse({ ok: false, error: 'QUOTA_WRITE_ERROR' }, 500)
  }


  // --- Stub d’analyse (Step B : pas encore de vrai appel IA) ---
    const analyseStub = {
    fiche: {
      titre: 'Exemple de rapport (démo)',
      marque: 'Véhicule d’occasion',
      modele: 'Exemple',
      finition: null,
      annee: null,
      kilometrage: null,
      energie: null,
      prix: null,
    },
    risques: [
      {
        type: 'mécanique',
        niveau: 'modéré',
        detail:
          'Démo uniquement : les risques réels seront calculés par l’IA sur la base de votre annonce.',
        recommandation:
          'La version complète évaluera l’entretien, le kilométrage et les faiblesses connues du modèle.',
      },
    ],
    score_global: {
      note_sur_100: 75,
      resume:
        "Rapport de démo. La version finale fournira un score détaillé adapté à votre annonce réelle.",
      profil_achat: 'a_negocier',
    },
    avis_acheteur: {
      resume_simple:
        'Exemple de synthèse. La version finale donnera un avis personnalisé sur votre annonce.',
      questions_a_poser: [
        'Depuis combien de temps possédez-vous le véhicule ?',
        'Pouvez-vous détailler l’entretien (factures, carnet) ?',
      ],
      points_a_verifier_essai: [
        'Comportement général du moteur et de la boîte de vitesses.',
        "Absence de bruits anormaux à l’accélération et au freinage.",
      ],
    },
  }


  // Log de l’analyse
  const { error: insertError } = await supabase.from('analyses').insert({
    email: quotaKey,
    input_raw: annonce,
    output_json: analyseStub,
    model: 'stub-stepB',
  })

  if (insertError) {
    return jsonResponse({ ok: false, error: 'ANALYSE_LOG_ERROR' }, 500)
  }

  // Réponse finale
  return jsonResponse({
    ok: true,
    message: 'analyse stepB (supabase + quota) OK',
    data: analyseStub,
    quota: {
      count: currentCount + 1,
      limit: MAX_DEMO,
    },
  })
}
