// functions/api/analyse.ts
export const onRequestPost = async (context: any): Promise<Response> => {
  try {
    const bodyText = await context.request.text().catch(() => '')

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'analyse stub OK',
        received: bodyText,
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
        error: 'internal_error_stub',
        details: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
