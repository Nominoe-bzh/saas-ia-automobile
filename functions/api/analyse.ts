// functions/api/analyse.ts
import { z } from 'zod'

// 1) Schéma d'entrée : ce que le frontend enverra à l'API
const InputSchema = z.object({
  annonce: z.string().min(20, "Texte d'annonce trop court"),
  url: z.string().url().optional(),
  budget: z.number().int().positive().optional(),
})

// 2) Schéma de sortie : ce que l'API renverra (résultat de l'analyse)
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
}

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    // 1) Lecture + validation de l'entrée
    const body = await context.request.json()
    const input = InputSchema.parse(body)

    // 2) Construction d'un résultat "fake" (plus tard : remplacé par l'IA)
    const fakeResult = OutputSchema.parse({
      fiche: {
        marque: 'Peugeot',
        modele: '208',
        version: '1.2 PureTech 100',
        energie: 'Essence',
        annee: 2020,
        kilometrage: 65000,
        prix: 15900,
        boite: 'Manuelle',
        puissance_ch: 100,
        finition: 'Allure',
      },
      risques: [
        {
          niveau: 'moyen',
          type: 'Entretien',
          detail:
            "Historique entretien non complet dans l'annonce. Verifier factures et carnet a jour avant achat.",
          impact_financier_estime: 800,
        },
        {
          niveau: 'faible',
          type: 'Usure classique',
          detail:
            'Pneus et freins a controler. Prevoir un petit budget entretien la premiere annee.',
          impact_financier_estime: 300,
        },
      ],
      incoherences: [
        {
          champ: 'kilometrage',
          description:
            "Kilometrage annonce sans precision sur le type de trajet (ville / route). Manque de transparence.",
        },
      ],
      score_global: 78,
      avis: {
        recommandation: 'negocier',
        resume:
          "Annonce globalement correcte, mais quelques zones floues sur l'entretien. A envisager si le vendeur fournit les factures et si une remise est obtenue.",
        fourchette_prix_recommande: {
          min: 14500,
          max: 15200,
        },
      },
    })

    // 3) Réponse structurée
    return new Response(
      JSON.stringify({
        ok: true,
        input,       // ce que le client a envoyé (utile pour debug)
        analyse: fakeResult, // analyse structurée
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e?.message ?? 'invalid_request',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
