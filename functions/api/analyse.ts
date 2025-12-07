import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
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

type CFContext = {
  request: Request
  env: EnvBindings
}

// ---------- Helper : appel OpenAI ----------

type AnalyseResult = {
  fiche: {
    titre: string
    marque: string
    modele: string
    finition: string | null
    annee: string | null
    kilometrage: string | null
    energie: string | null
    prix: string | null
  }
  risques: Array<{
    type: string
    niveau: 'faible' | 'modéré' | 'élevé'
    detail: string
    recommandation: string
  }>
  score_global: {
    note_sur_100: number
    resume: string
    profil_achat: 'acheter' | 'a_negocier' | 'a_eviter'
  }
  avis_acheteur: {
    resume_simple: string
    questions_a_poser: string[]
    points_a_verifier_essai: string[]
  }
}

async function runOpenAI(
  env: EnvBindings,
  annonce: string,
  retries = 2,
): Promise<AnalyseResult> {
  const model = env.OPENAI_MODEL || 'gpt-4o-mini'
  const timeout = 30000 // 30 secondes

  const systemPrompt = `
Tu es un expert en vehicules d'occasion et en achat automobile.
Tu DOIS toujours repondre dans un JSON strict, sans texte autour, sans markdown.

Format JSON EXACT a respecter :

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
      "niveau": "faible | modere | eleve",
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

Regles :
- Analyse uniquement l'annonce fournie (pas de donnees externes).
- Sois realiste et prudent : ne sur-note pas.
- Note sur 100 : 0 = tres risque, 100 = excellente affaire.
- Profil d'achat :
  - "acheter" si l'affaire semble saine,
  - "a_negocier" si le prix ou des incertitudes demandent une negociation,
  - "a_eviter" si les risques sont trop eleves.
`.trim()

  const userPrompt = `
Annonce a analyser :

${annonce}
`.trim()

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        const errorMsg = `OpenAI HTTP ${response.status}: ${errorText}`
        
        // Retry sur erreurs 5xx ou rate limit
        if ((response.status >= 500 || response.status === 429) && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json() as any
      const content = data?.choices?.[0]?.message?.content

      if (!content || typeof content !== 'string') {
        throw new Error('Reponse OpenAI invalide: contenu manquant')
      }

      let parsed: any
      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        throw new Error(`JSON OpenAI non parseable: ${parseError}`)
      }

      // Validation basique de la structure
      if (!parsed.fiche || !parsed.score_global || !parsed.avis_acheteur) {
        throw new Error('Structure JSON OpenAI invalide')
      }

      return parsed
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        throw new Error("Timeout lors de l'appel OpenAI")
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      throw error
    }
  }

  throw new Error('Echec apres tous les essais')
}

// ---------- Stub de secours ----------

const demoStub: AnalyseResult = {
  fiche: {
    titre: 'Exemple de rapport (demo)',
    marque: "Vehicule d'occasion",
    modele: 'Exemple',
    finition: null,
    annee: null,
    kilometrage: null,
    energie: null,
    prix: null,
  },
  risques: [
    {
      type: 'mecanique',
      niveau: 'modere',
      detail:
        "Demo uniquement : les risques reels seront calcules par l'IA sur la base de votre annonce.",
      recommandation:
        "La version complete evaluera l'entretien, le kilometrage et les faiblesses connues du modele.",
    },
  ],
  score_global: {
    note_sur_100: 75,
    resume:
      "Rapport de demo. La version finale fournira un score detaille adapte a votre annonce reelle.",
    profil_achat: 'a_negocier',
  },
  avis_acheteur: {
    resume_simple:
      'Exemple de synthese. La version finale donnera un avis personnalise sur votre annonce.',
    questions_a_poser: [
      'Depuis combien de temps possedez-vous le vehicule ?',
      "Pouvez-vous detailler l'entretien (factures, carnet) ?",
    ],
    points_a_verifier_essai: [
      'Comportement general du moteur et de la boite de vitesses.',
      "Absence de bruits anormaux a l'acceleration et au freinage.",
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

  // --- Email special sans limitation de quota ---
  const UNLIMITED_EMAIL = 'saas.ia.automobile@gmail.com'
  const isUnlimitedUser = email && email.toLowerCase().trim() === UNLIMITED_EMAIL.toLowerCase()

  // --- Gestion des crédits payants et quotas ---
  const quotaKey = email || 'no-email'
  let currentCount = 0
  let usedPaidCredit = false
  
  // Si utilisateur illimité, on skip complètement le système de quota et crédits
  if (!isUnlimitedUser && email) {
    // ÉTAPE 1 : Vérifier les crédits payants (prioritaire)
    const supabaseServiceRole = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )

    console.log('[Analyse] Checking paid credits for:', email)

    const { data: paidPlans, error: paidError } = await supabaseServiceRole
      .from('paid_plans')
      .select('*')
      .eq('email', email.trim())
      .gt('credits_remaining', 0)
      .order('created_at', { ascending: true }) // Consommer les plus anciens d'abord

    if (paidError) {
      console.error('[Analyse] Error fetching paid_plans:', paidError)
      // On continue vers le quota démo en cas d'erreur
    } else if (paidPlans && paidPlans.length > 0) {
      // Utiliser le premier plan avec des crédits
      const plan = paidPlans[0]
      
      console.log('[Analyse] Using paid credit:', {
        planId: plan.id,
        planType: plan.plan_type,
        creditsRemaining: plan.credits_remaining,
      })

      // Décrémenter le crédit
      const { error: updateError } = await supabaseServiceRole
        .from('paid_plans')
        .update({
          credits_remaining: plan.credits_remaining - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error('[Analyse] Error updating paid_plans:', updateError)
        return jsonResponse(
          { ok: false, error: 'CREDIT_UPDATE_ERROR', message: 'Erreur lors de la consommation du crédit' },
          500
        )
      }

      usedPaidCredit = true
      console.log('[Analyse] Paid credit consumed successfully')
    }
  }

  // ÉTAPE 2 : Si pas de crédit payant utilisé, vérifier le quota démo
  if (!isUnlimitedUser && !usedPaidCredit) {
    const { data: quotaRow, error: quotaError } = await supabase
      .from('demo_quota')
      .select('*')
      .eq('email', quotaKey)
      .maybeSingle()

    if (quotaError && quotaError.code !== 'PGRST116') {
      return jsonResponse({ ok: false, error: 'QUOTA_READ_ERROR' }, 500)
    }

    currentCount = quotaRow?.count ?? 0
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
  } else {
    console.log('🌟 Utilisateur illimite detecte:', email)
  }

  // --- Appel IA principal ---
  let analyse = demoStub
  let modelUsed = 'stub-demo'

  try {
    analyse = await runOpenAI(env, annonce)
    modelUsed = env.OPENAI_MODEL || 'gpt-4o-mini'
  } catch (err: any) {
    // Log de l'erreur pour debugging
    console.error('OpenAI error:', err?.message || String(err))
    // en cas d'échec, on tombe sur le stub générique
    analyse = demoStub
    modelUsed = 'stub-fallback'
  }

  // Log de l'analyse (non bloquant)
  let analysisId: string | null = null
  console.log('🔍 Tentative insertion analyse dans Supabase...')
  const { data: insertData, error: insertError } = await supabase
    .from('analyses')
    .insert({
      email: quotaKey,
      input_raw: annonce,
      output_json: analyse,
      model: modelUsed,
    })
    .select('id')

  if (insertError) {
    console.error('❌ Supabase insert error:', insertError)
    // On continue même si le log échoue, l'analyse est déjà faite
  } else if (insertData && insertData[0]) {
    analysisId = insertData[0].id
    console.log('✅ Analysis inserted with ID:', analysisId)
  } else {
    console.warn('⚠️ Insertion succeeded but no ID returned. insertData:', insertData)
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
    analysisId: analysisId,
    quota: isUnlimitedUser ? {
      count: 0,
      limit: -1, // -1 indique illimité
      unlimited: true,
    } : usedPaidCredit ? {
      source: 'paid',
      message: 'Crédit payant utilisé',
    } : {
      count: currentCount + 1,
      limit: MAX_DEMO,
      source: 'demo',
    },
    email_sent: emailSent,
  })

}
