// functions/api/analyse.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string                // ← ajouté
}

// Contexte Cloudflare Pages
type CFContext = {
  env: EnvBindings
  request: Request
}

const OPENAI_MODEL = 'gpt-4.1-mini'

// --------- Zod schemas ---------

const AnalyseInputSchema = z.object({
  annonce: z
    .string()
    .min(30, "Texte d'annonce trop court, donne l'annonce complète pour une analyse utile."),
  email: z.string().email().optional().nullable(),
})


const FicheSchema = z.object({
  titre: z.string(),
  marque: z.string().nullable().optional(),
  modele: z.string().nullable().optional(),
  motorisation: z.string().nullable().optional(),
  energie: z.string().nullable().optional(),
  annee: z.string().nullable().optional(),
  kilometrage: z.string().nullable().optional(),
  prix: z.string().nullable().optional(),
  boite: z.string().nullable().optional(),
  carrosserie: z.string().nullable().optional(),
  finition: z.string().nullable().optional(),
  puissance: z.string().nullable().optional(),
  ct: z.string().nullable().optional(),
  historique: z.string().nullable().optional(),
})

const AnalyseResultSchema = z.object({
  fiche: FicheSchema,
  risques: z
    .array(
      z.object({
        type: z.string(),           // mécanique, administratif, financier, etc.
        niveau: z.string(),         // faible, modéré, élevé, critique
        detail: z.string(),
        recommandation: z.string(),
      }),
    )
    .default([]),
  score_global: z.object({
    note_sur_100: z.number(),
    resume: z.string(),
    profil_achat: z.string(),       // ex: "a_acheter", "a_negocier", "a_eviter"
  }),
  avis_acheteur: z.object({
    resume_simple: z.string(),
    questions_a_poser: z.array(z.string()).default([]),
    points_a_verifier_essai: z.array(z.string()).default([]),
  }),
})

const SYSTEM_PROMPT = `
Tu es un expert en véhicules d’occasion, acheteur pro avec 30 ans d’expérience.
Tu aides un particulier à analyser UNE annonce de véhicule d’occasion en français.

CONTRAINTE ABSOLUE :
- Tu dois répondre UNIQUEMENT en JSON strict, sans texte avant ni après.
- Le JSON doit respecter exactement la structure suivante (noms de clés, types) :

{
  "fiche": {
    "titre": string,
    "marque": string | null,
    "modele": string | null,
    "motorisation": string | null,
    "energie": string | null,
    "annee": string | null,
    "kilometrage": string | null,
    "prix": string | null,
    "boite": string | null,
    "carrosserie": string | null,
    "finition": string | null,
    "puissance": string | null,
    "ct": string | null,
    "historique": string | null
  },
  "risques": [
    {
      "type": string,
      "niveau": string,
      "detail": string,
      "recommandation": string
    }
  ],
  "score_global": {
    "note_sur_100": number,
    "resume": string,
    "profil_achat": string
  },
  "avis_acheteur": {
    "resume_simple": string,
    "questions_a_poser": [string],
    "points_a_verifier_essai": [string]
  }
}

RÔLE :
1) Extraire les infos clées de l’annonce et remplir "fiche".
2) Lister les principaux risques dans "risques" (au moins 1, en général 2–5).
3) Donner un score global de 0 à 100 dans "score_global.note_sur_100" :
   - 80–100 : très bon dossier
   - 60–79 : bon mais à vérifier
   - 40–59 : moyen, plusieurs points de vigilance
   - 0–39 : dossier risqué
4) "score_global.profil_achat" doit être :
   - "a_acheter"     (bonne affaire, quelques vérifications)
   - "a_negocier"    (intéressant si bon prix et points vérifiés)
   - "a_eviter"      (trop risqué ou mal positionné)
5) Dans "avis_acheteur", donne :
   - un résumé simple compréhensible par un non-expert,
   - 4 à 10 questions concrètes à poser au vendeur,
   - 4 à 10 points précis à vérifier pendant l’essai routier et la visite.

Ne commente pas, ne rajoute pas de texte hors du JSON.
`

async function sendAnalyseEmail(env: EnvBindings, to: string, result: any) {
  const titre = result?.fiche?.titre ?? 'votre véhicule'
  const note = result?.score_global?.note_sur_100 ?? 0
  const resume = result?.score_global?.resume ?? ''
  const profil = result?.score_global?.profil_achat ?? ''
  const questions: string[] = result?.avis_acheteur?.questions_a_poser ?? []
  const pointsEssai: string[] = result?.avis_acheteur?.points_a_verifier_essai ?? []

  const subject = `Analyse de votre annonce : ${titre}`

  const lines: string[] = []

  lines.push(`Résumé : ${resume}`)
  lines.push(`Note globale : ${note}/100`)
  lines.push(`Profil d'achat : ${profil}`)
  lines.push('')
  if (questions.length) {
    lines.push('Questions à poser au vendeur :')
    for (const q of questions) {
      lines.push(`- ${q}`)
    }
    lines.push('')
  }
  if (pointsEssai.length) {
    lines.push('Points à vérifier lors de l’essai :')
    for (const p of pointsEssai) {
      lines.push(`- ${p}`)
    }
    lines.push('')
  }

  const text = lines.join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [to],
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '')
    console.error('Resend analyse email error', res.status, errTxt)
  }
}


// --------- Helper pour parser le JSON du modèle ---------

function extractJsonFromContent(content: string): unknown {
  const trimmed = content.trim()

  // Cas simple : déjà du JSON brut
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed)
  }

  // Cas avec ```json ... ```
  const match = /```json([\s\S]+?)```/i.exec(trimmed)
  if (match && match[1]) {
    return JSON.parse(match[1].trim())
  }

  // Fallback : tentative directe
  return JSON.parse(trimmed)
}

// --------- Cloudflare function ---------

export async function onRequestPost(context: CFContext): Promise<Response> {
  const start = Date.now()

  try {
    // 1) Lecture et validation de l'entrée
    const body = await context.request.json()
    const { annonce, email } = AnalyseInputSchema.parse(body)

    // 2) Appel OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Voici le texte complet de l'annonce de véhicule d'occasion à analyser :\n\n${annonce}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return new Response(
        JSON.stringify({
          ok: false,
          error: `openai: ${res.status} ${res.statusText} ${txt}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const data = (await res.json()) as any
    const content = data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Réponse OpenAI invalide (pas de content texte).',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 3) Parsing JSON + validation Zod
    let parsed: unknown
    try {
      parsed = extractJsonFromContent(content)
    } catch (e: any) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Erreur de parsing JSON: ${e?.message ?? String(e)}`,
          raw: content,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let result
    try {
      result = AnalyseResultSchema.parse(parsed)
    } catch (e: any) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: e?.errors ?? String(e),
          raw: parsed,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const duration = Date.now() - start

    // 4) Logging Supabase (best effort, ne bloque pas la réponse)
    try {
      const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)

      await supabase.from('analyses').insert({
        email: email ?? null,
        input_raw: annonce,
        output_json: result,
        model: OPENAI_MODEL,
        duration_ms: duration,
        error: null,
      })
    } catch (e) {
      console.error('supabase insert error', e)
    }

    // 5) Email récap si email fourni
    if (email) {
      try {
        await sendAnalyseEmail(context.env, email, result)
      } catch (e) {
        console.error('sendAnalyseEmail error', e)
      }
    }



    // 6) Réponse HTTP
    return new Response(JSON.stringify({ ok: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('analyse endpoint error', e)

    return new Response(
      JSON.stringify({
        ok: false,
        error: e?.message ?? 'erreur inconnue',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
