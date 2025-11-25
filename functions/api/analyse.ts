// functions/api/analyse.ts

import { z } from 'zod'

// ---------- ZOD SCHEMAS ----------

const AnalyseRequestSchema = z.object({
  annonce: z.string().min(20, "L'annonce est trop courte"),
  email: z.string().email().optional().nullable(),
})

// ---------- HANDLER CLOUDLFARE PAGES ----------

export const onRequestPost = async (context: any): Promise<Response> => {
  try {
    const { request } = context

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid_json' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const parsed = AnalyseRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'invalid_request',
          details: parsed.error.format(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'analyse zod OK',
        data: parsed.data,
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
        error: 'internal_error_stepA',
        details: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
