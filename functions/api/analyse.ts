// functions/api/analyse.ts

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// ---------- ZOD SCHEMAS ----------

const AnalyseRequestSchema = z.object({
  annonce: z.string().min(20, "L'annonce est trop courte"),
  email: z.string().email().optional().nullable(),
})

// ---------- QUOTA DEMO (3 analyses gratuites) ----------

const FREE_DEMO_LIMIT = 3

async function checkAndIncrementDemoQuota(
  supabase: any,
  email?: string | null,
  ip?: string | null,
): Promise<{ allowed: boolean; count: number }> {
  // Si ni email ni IP, on laisse passer et on ne log pas de quota
  if (!email && !ip) {
    return { allowed: true, count: 0 }
  }

  const filterColumn = email ? 'email' : 'ip_hash'
  const filterValue = email ?? ip!

  const { data, error } = await supabase
    .from('demo_quota')
    .select('id, count')
    .eq(filterColumn, filterValue)
    .maybeSingle()

  if (error) {
    console.error('Error reading demo_quota', error)
    return { allowed: true, count: 0 }
  }

  // Pas encore de ligne → on crée avec count = 1
  if (!data) {
    const { error: insertError } = await supabase.from('demo_quota').insert({
      email: email ?? null,
      ip_hash: email ? null : filterValue,
      count: 1,
    })

    if (insertError) {
      console.error('Error inserting demo_quota', insertError)
    }

    return { allowed: true, count: 1 }
  }

  // Déjà au plafond
  if (data.count >= FREE_DEMO_LIMIT) {
    return { allowed: false, count: data.count }
  }

  const newCount = data.count + 1

  const { error: updateError } = await supabase
    .from('demo_quota')
    .update({
      count: newCount,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (updateError) {
    console.error('Error updating demo_quota', updateError)
  }

  return { allowed: true, count: newCount }
}

// ---------- HANDLER CLOUDLFARE PAGES ----------

export const onRequestPost = async (context: any): Promise<Response> => {
  try {
    const { env, request } = context

    // Connexion Supabase
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

    // Lecture du body JSON
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

    // Validation Zod
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

    const { annonce, email } = parsed.data

    // IP pour quota
    const ip =
      request.headers.get('CF-Connecting-IP') ??
      request.headers.get('x-forwarded-for') ??
      null

    // Quota démo
    let quotaInfo: { allowed: boolean; count: number } = {
      allowed: true,
      count: 0,
    }

    try {
      quotaInfo = await checkAndIncrementDemoQuota(supabase, email ?? null, ip)
      if (!quotaInfo.allowed) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'QUOTA_EXCEEDED',
            quota_count: quotaInfo.count,
            quota_limit: FREE_DEMO_LIMIT,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    } catch (e) {
      console.error('Quota error', e)
      // On laisse passer en cas d’erreur de quota
    }

    // Log dans analyses (sans IA pour l’instant)
    try {
      await supabase.from('analyses').insert({
        email: email ?? null,
        input_raw: annonce,
        output_json: null,
        duration_ms: 0,
        error: null,
        model: 'stub-stepB',
      })
    } catch (e) {
      console.error('Supabase insert error (analyses)', e)
    }

    // Réponse "stub" OK avec infos quota
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'analyse stepB (supabase + quota) OK',
        data: parsed.data,
        quota: {
          count: quotaInfo.count,
          limit: FREE_DEMO_LIMIT,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (e: any) {
    console.error('UNHANDLED ERROR in /api/analyse stepB', e)
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'internal_error_stepB',
        details: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
