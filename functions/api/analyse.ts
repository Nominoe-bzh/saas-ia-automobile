// functions/api/analyse.ts
import { z } from 'zod'

// Schéma d'entrée : ce que le frontend enverra à l'API
const InputSchema = z.object({
  // texte complet de l'annonce (titre, description, infos)
  annonce: z.string().min(20, "Texte d'annonce trop court"),
  // facultatif : URL de l'annonce (Leboncoin, La Centrale, etc.)
  url: z.string().url().optional(),
  // facultatif : budget de l'acheteur
  budget: z.number().int().positive().optional(),
})

type CFContext = {
  request: Request
}

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    // 1) Lecture du body JSON
    const body = await context.request.json()

    // 2) Validation avec Zod
    const input = InputSchema.parse(body)

    // 3) Pour l'instant on renvoie juste ce qui est valide
    return new Response(
      JSON.stringify({
        ok: true,
        data: input,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (e: any) {
    // Erreur de JSON ou de validation Zod
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
