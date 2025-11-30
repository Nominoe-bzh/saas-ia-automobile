import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
}

const analyseInputSchema = z.object({
  annonce: z.string().min(10),
  email: z.string().email().nullable().optional(),
})

const MAX_DEMO = 3

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

interface CFContext {
  request: Request
  env: EnvBindings
}

// ---------- Helper : appel OpenAI ----------

async function runOpenAI(env: EnvBindings, annonce: string) {
  const model = env.OPENAI_MODEL || 'gpt-4.1-mini'

  const systemPrompt = `
Tu es un expert en véhicules d'occasion et en achat automobile.
Tu DOIS toujours répondre dans un JSON strict, sans texte autour, sans markdown.

Format JSON EXACT à respecter :

{
  "fiche": {
    "titre": "string",
    "marque": "string",
    "modele": "string",
    "finition": "string | null",
    "annee": "string | null",
    "kilometrage": "string | null",
    "energie": "string | null",
    "prix": "string | null"
  },
  "risques": [
    {
      "type": "string",
      "niveau": "faible | modéré | élevé",
      "detail": "string",
      "recommandation": "string"
    }
  ],
  "score_global": {
    "note_sur_100": 0,
    "resume": "string",
    "profil_achat": "acheter | a_negocier | a_eviter"
  },
  "avis_acheteur": {
    "resume_simple": "string",
    "questions_a_poser": ["string"],
    "points_a_verifier_essai": ["string"]
  }
}

Règles :
- Analyse uniquement l'annonce fournie (pas de données externes).
- Sois réaliste et prudent : ne sur-note pas.
- Note sur 100 : 0 = très risqué, 100 = excellente affaire.
- Profil d'achat :
  - "acheter" si l'affaire semble saine,
  - "a_negocier" si le prix ou des incertitudes demandent une négociation,
  - "a_eviter" si les risques sont trop élevés.
`.trim()

  const userPrompt = `
Annonce à analyser :

${annonce}
`.trim()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI HTTP ${response.status}`)
  }

  const data = await response.json() as any
  const content = data?.choices?.[0]?.message?.content

  if (!content || typeof content !== 'string') {
    throw new Error('Réponse OpenAI invalide')
  }

  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('JSON OpenAI non parseable')
  }

  return parsed
}

// ---------- Stub de secours ----------

const demoStub = {
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

// ---------- Handler principal ----------

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
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
      { ok: false, error: 'INVALID_INPUT', details: parsed.error.flatten() },
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

  // Insert / update du compteur
  let writeError = null
  if (!quotaRow) {
    const { error } = await supabase.from('demo_quota').insert({
      email: quotaKey,
      count: currentCount + 1,
    })
    writeError = error
  } else {
    const { error } = await supabase
      .from('demo_quota')
      .update({ count: currentCount + 1 })
      .eq('email', quotaKey)
    writeError = error
  }

  if (writeError) {
    return jsonResponse({ ok: false, error: 'QUOTA_WRITE_ERROR' }, 500)
  }

  // --- Appel IA principal ---
  let analyse = demoStub
  let modelUsed = 'stub-stepB'

  try {
    analyse = await runOpenAI(env, annonce)
    modelUsed = env.OPENAI_MODEL || 'gpt-4.1-mini'
  } catch (err) {
    // en cas d'échec, on tombe sur le stub générique
    analyse = demoStub
    modelUsed = 'stub-fallback'
  }

  // Log de l’analyse
  const { error: insertError } = await supabase.from('analyses').insert({
    email: quotaKey,
    input_raw: annonce,
    output_json: analyse,
    model: modelUsed,
  })

  if (insertError) {
    return jsonResponse({ ok: false, error: 'ANALYSE_LOG_ERROR' }, 500)
  }

  // --- Envoi email (optionnel) ---
  let emailSent = false

  if (email) {
    try {
      const fiche = (analyse as any)?.fiche || {}
      const score = (analyse as any)?.score_global || {}
      const avis = (analyse as any)?.avis_acheteur || {}

      const titre = fiche.titre || 'Votre analyse de véhicule'
      const note = typeof score.note_sur_100 === 'number' ? `${score.note_sur_100}/100` : 'N/A'
      const resume = avis.resume_simple || score.resume || 'Analyse IA de votre annonce.'

      const questions: string[] = Array.isArray(avis.questions_a_poser)
        ? avis.questions_a_poser.slice(0, 6)
        : []
      const pointsEssai: string[] = Array.isArray(avis.points_a_verifier_essai)
        ? avis.points_a_verifier_essai.slice(0, 6)
        : []

      const lignes: string[] = []

      lignes.push(`Résumé : ${resume}`)
      lignes.push('')
      lignes.push(`Note globale : ${note}`)
      lignes.push('')

      if (fiche.marque || fiche.modele || fiche.annee || fiche.kilometrage) {
        lignes.push('Fiche véhicule :')
        lignes.push(
          `- ${[fiche.marque, fiche.modele, fiche.finition].filter(Boolean).join(' ')}`
        )
        lignes.push(
          `- ${[fiche.annee, fiche.kilometrage, fiche.energie, fiche.prix]
            .filter(Boolean)
            .join(' • ')}`
        )
        lignes.push('')
      }

      if (questions.length > 0) {
        lignes.push('Questions à poser au vendeur :')
        for (const q of questions) {
          lignes.push(`- ${q}`)
        }
        lignes.push('')
      }

      if (pointsEssai.length > 0) {
        lignes.push("Points à vérifier lors de l’essai :")
        for (const p of pointsEssai) {
          lignes.push(`- ${p}`)
        }
        lignes.push('')
      }

      lignes.push(
        "Cet email est généré par l’assistant IA Check Ton Véhicule à partir des informations fournies dans l’annonce."
      )

      const bodyText = lignes.join('\n')

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.MAIL_FROM,
          to: email,
          subject: `Analyse de votre annonce : ${titre}`,
          text: bodyText,
        }),
      })

      if (resendRes.ok) {
        emailSent = true
      }
      // si non ok, on ignore : pas de throw pour ne pas casser l’API
    } catch {
      // en cas d'erreur d'email, on n'interrompt pas la réponse principale
      emailSent = false
    }
  }

  return jsonResponse({
    ok: true,
    message: 'analyse IA OK',
    data: analyse,
    quota: {
      count: currentCount + 1,
      limit: MAX_DEMO,
    },
    email_sent: emailSent,
  })

}
