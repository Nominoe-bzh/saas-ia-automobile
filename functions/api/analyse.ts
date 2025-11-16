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
  env: { OPENAI_API_KEY: string }
}

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    const body = await context.request.json()
    const input = InputSchema.parse(body)

    const prompt = `
Tu es un assistant expert automobile. Voici une annonce de voiture d'occasion :

ANNONCE : """${input.annonce}"""

Objectif : extraire et structurer les informations au format JSON suivant :

${OutputSchema.toString()}

Respecte exactement les noms de champ, types, structure. Les valeurs doivent être réalistes. N’invente pas ce qui n’est pas mentionné, mets "null" si inconnu.

Renvoie seulement le JSON sans explication.
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`openai: ${response.status} ${errText}`)
    }

    const res = await response.json()
    const content = res.choices?.[0]?.message?.content ?? ''

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error("openai: réponse non JSON")
    }

    const analyse = OutputSchema.parse(parsed)

    return new Response(JSON.stringify({ ok: true, analyse }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Erreur inconnue' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
