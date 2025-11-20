// functions/api/analyse.ts
import { z } from 'zod'

type EnvBindings = {
  OPENAI_API_KEY: string
}

// Contexte Cloudflare Pages (similaire à join.ts)
type CFContext = {
  env: EnvBindings
  request: Request
}

const OPENAI_MODEL = 'gpt-4.1-mini'

// --- Schémas de validation Zod ---

const AnalyseInputSchema = z.object({
  annonce: z.string().min(10, "Texte d'annonce trop court"),
})

const AnalyseResultSchema = z.object({
  fiche: z.object({
    titre: z.string(),
    marque: z.string().optional(),
    modele: z.string().optional(),
    motorisation: z.string().optional(),
    energie: z.string().optional(),
    annee: z.string().optional(),
    kilometrage: z.string().optional(),
    prix: z.string().optional(),
    boite: z.string().optional(),
    carrosserie: z.string().optional(),
    finition: z.string().optional(),
    puissance: z.string().optional(),
    ct: z.string().optional(),
    historique: z.string().optional(),
  }),
  risques: z.array(z.object({
    type: z.enum(['mecanique', 'administratif', 'financier', 'arnaque', 'inconnu']),
    niveau: z.enum(['faible', 'modéré', 'élevé', 'critique']),
    detail: z.string(),
    recommandation: z.string(),
  })),
  score_global: z.object({
    note_sur_100: z.number(),
    resume: z.string(),
    profil_achat: z.enum(['bonne_opportunite', 'à_negocier', 'à_eviter']),
  }),
  avis_acheteur: z.object({
    resume_simple: z.string(),
    questions_a_poser: z.array(z.string()),
    points_a_verifier_essai: z.array(z.string()),
  }),
})

// Définition textuelle très explicite de la structure attendue
const SCHEMA_DESCRIPTION = `
{
  "fiche": {
    "titre": "string",
    "marque": "string | null",
    "modele": "string | null",
    "motorisation": "string | null",
    "energie": "string | null",
    "annee": "string | null",
    "kilometrage": "string | null",
    "prix": "string | null",
    "boite": "string | null",
    "carrosserie": "string | null",
    "finition": "string | null",
    "puissance": "string | null",
    "ct": "string | null",
    "historique": "string | null"
  },
  "risques": [
    {
      "type": "mecanique | administratif | financier | arnaque | inconnu",
      "niveau": "faible | modéré | élevé | critique",
      "detail": "string",
      "recommandation": "string"
    }
  ],
  "score_global": {
    "note_sur_100": number,
    "resume": "string",
    "profil_achat": "bonne_opportunite | à_negocier | à_eviter"
  },
  "avis_acheteur": {
    "resume_simple": "string",
    "questions_a_poser": ["string", "..."],
    "points_a_verifier_essai": ["string", "..."]
  }
}
`

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    const body = await context.request.json()
    const { annonce } = AnalyseInputSchema.parse(body)

    const apiKey = context.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'OPENAI_API_KEY manquant côté serveur' }),
        { status: 500 },
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              "Tu es un expert indépendant de l'automobile, spécialisé dans l'achat de voitures d'occasion pour des particuliers français. " +
              "Tu dois produire un avis structuré, pédagogique et prudent, sans jamais inventer des infos absentes de l'annonce.",
          },
          {
            role: 'user',
            content:
              "Analyse cette annonce de voiture d'occasion.\n\n" +
              "1/ Lis attentivement le texte.\n" +
              "2/ Déduis uniquement ce qui est explicitement mentionné ou extrêmement probable.\n" +
              "3/ Retourne UNIQUEMENT un JSON valide UTF-8, sans aucun texte avant ou après.\n" +
              "4/ Le JSON DOIT avoir exactement la structure suivante (clés et types) :\n\n" +
              SCHEMA_DESCRIPTION +
              "\n\n" +
              "Ne mets pas de commentaires, pas de texte libre, pas de balises, pas de markdown. " +
              "Si une information n'est pas présente dans l'annonce, mets null ou une chaîne courte comme \"inconnu\".\n\n" +
              `Texte de l'annonce :\n${annonce}`,
          },
        ],
      }),
    })

    if (!openaiResponse.ok) {
      const txt = await openaiResponse.text().catch(() => '')
      return new Response(
        JSON.stringify({
          ok: false,
          error: `openai: ${openaiResponse.status} ${txt}`,
        }),
        { status: 500 },
      )
    }

    const data = await openaiResponse.json()
    const content = data.choices?.[0]?.message?.content

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ ok: false, error: 'openai: réponse vide ou inattendue' }),
        { status: 500 },
      )
    }

    // 1) On parse le JSON brut
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'openai: JSON invalide',
          raw: content,
        }),
        { status: 500 },
      )
    }

    // 2) On valide avec Zod, en loggant les erreurs + le JSON si ça ne passe pas
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
        { status: 500 },
      )
    }

    return new Response(JSON.stringify({ ok: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? 'erreur inconnue' }),
      { status: 500 },
    )
  }
}
