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

    // Appel OpenAI REST
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
              "Tu es un expert indépendant de l'automobile spécialisée dans l'achat de voitures d'occasion pour particuliers français. " +
              "Ton rôle : analyser des annonces et produire un avis structuré, pédagogique et prudent.",
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  "Analyse cette annonce de voiture d'occasion. " +
                  "Retourne UNIQUEMENT un JSON valide qui respecte exactement ce schéma :\n\n" +
                  AnalyseResultSchema.toString() +
                  "\n\n" +
                  "N'ajoute aucun texte avant ou après le JSON. Pas de commentaires, pas de balises, rien d'autre.",
              },
              {
                type: 'text',
                text: `Texte de l'annonce :\n${annonce}`,
              },
            ],
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

    // On tente de parser le JSON renvoyé
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

    // Validation stricte avec Zod
    const result = AnalyseResultSchema.parse(parsed)

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
