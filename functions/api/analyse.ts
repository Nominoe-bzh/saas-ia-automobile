// functions/api/analyse.ts
import { z } from 'zod'

const InputSchema = z.object({
  annonce: z.string().min(20, "Texte d'annonce trop court"),
  url: z.string().url().optional(),
  budget: z.number().int().positive().optional(),
})

const OutputSchema = z.object({
  fiche: z.object({
    marque: z.string().nullable(),
    modele: z.string().nullable(),
    version: z.string().nullable(),
    energie: z.string().nullable(),
    annee: z.number().int().nullable(),
    kilometrage: z.number().int().nullable(),
    prix: z.number().nullable(),
    boite: z.string().nullable(),
    puissance_ch: z.number().nullable(),
    finition: z.string().nullable(),
  }),
  risques: z.array(
    z.object({
      niveau: z.enum(['faible', 'moyen', 'eleve']),
      type: z.string(),
      detail: z.string(),
      impact_financier_estime: z.number().nullable(),
    }),
  ),
  incoherences: z.array(
    z.object({
      champ: z.string(),
      description: z.string(),
    }),
  ),
  score_global: z.number().min(0).max(100),
  avis: z.object({
    recommandation: z.enum(['acheter', 'negocier', 'eviter']),
    resume: z.string(),
    fourchette_prix_recommande: z
      .object({
        min: z.number().nullable(),
        max: z.number().nullable(),
      })
      .nullable(),
  }),
})

type CFContext = {
  request: Request
  env: {
    OPENAI_API_KEY: string
  }
}

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    const body = await context.request.json()
    const input = InputSchema.parse(body)

    let analyse

    // 1) On ESSAIE OpenAI
    try {
      const prompt = `
Tu es un expert automobile. Analyse cette annonce de voiture d'occasion et renvoie UNIQUEMENT un JSON strictement au format ci-dessous.

ANNONCE :
"""${input.annonce}"""

Structure attendue (types, champs, valeurs autorisées) :
- fiche: { marque, modele, version, energie, annee, kilometrage, prix, boite, puissance_ch, finition }
- risques: [ { niveau: "faible" | "moyen" | "eleve", type: string, detail: string, impact_financier_estime: number | null } ]
- incoherences: [ { champ: string, description: string } ]
- score_global: nombre entre 0 et 100
- avis: {
    recommandation: "acheter" | "negocier" | "eviter",
    resume: string,
    fourchette_prix_recommande: { min: number | null, max: number | null } | null
  }

Ne mets PAS de texte explicatif, renvoie uniquement le JSON.
`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'Tu es un assistant spécialisé en analyse de voitures d’occasion.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        throw new Error(`openai_http: ${response.status} ${errText}`)
      }

      const json = await response.json()
      const content = json.choices?.[0]?.message?.content ?? ''

      let raw
      try {
        raw = JSON.parse(content)
      } catch {
        throw new Error('openai_format: réponse non JSON')
      }

      analyse = OutputSchema.parse(raw)
    } catch (err: any) {
      // 2) Si OpenAI échoue (quota, modèle, format, etc.) → Fallback
      console.log('OpenAI error, fallback local:', err?.message)

      const fallback = OutputSchema.parse({
        fiche: {
          marque: null,
          modele: null,
          version: null,
          energie: null,
          annee: null,
          kilometrage: null,
          prix: null,
          boite: null,
          puissance_ch: null,
          finition: null,
        },
        risques: [
          {
            niveau: 'moyen',
            type: 'Analyse indisponible',
            detail:
              "L’IA n’a pas pu être appelée (quota ou configuration). Ceci est un résultat fictif pour tester le système sans coût.",
            impact_financier_estime: null,
          },
        ],
        incoherences: [],
        score_global: 50,
        avis: {
          recommandation: 'negocier',
          resume:
            "Analyse IA non disponible pour le moment. Résultat de démonstration uniquement. Configurez l’API OpenAI pour une analyse réelle.",
          fourchette_prix_recommande: null,
        },
      })

      analyse = fallback
    }

    return new Response(JSON.stringify({ ok: true, analyse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e?.message ?? 'Erreur inconnue',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
