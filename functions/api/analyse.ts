// functions/api/analyse.ts

// Squelette minimal : on lit le body et on le renvoie tel quel pour test
export async function onRequestPost(context: { request: Request }): Promise<Response> {
  const bodyText = await context.request.text()

  return new Response(
    JSON.stringify({
      ok: true,
      echo: bodyText,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
