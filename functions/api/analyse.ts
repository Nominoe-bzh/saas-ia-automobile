// functions/api/analyse.ts

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const OPENAI_MODEL = 'gpt-4.1-mini'
const FREE_DEMO_LIMIT = 3

// ---------- ZOD SCHEMAS ----------

const AnalyseRequestSchema = z.object({
  annonce: z.string().min(20, "L'annonce est trop courte"),
  email: z.string().email().optional().nullable(),
})

const AnalyseResultSchema = z.object({
  fiche: z.object({
    titre: z.string(),
    marque: z.string().nullable().optional(),
    modele: z.string().nullable().optional(),
    motorisation: z.string().nullable().optional(),
    energie: z.string().nullable().optional(),
    annee: z.string().nullable().optional(),
    kilometrage: z.string().nullable().optional(),
    prix: z.string().nullable().optional(),
    boite: z.string().nullable().optional(),
    carrosserie: z.string().nullable().optional(),
    finition: z.string().nullable().optional(),
    puissance: z.string().nullable().optional(),
    ct: z.string().nullable().optional(),
    historique: z.string().nullable().optional(),
  }),
  risques: z.array(
    z.object({
      type: z.string(),
      niveau: z.string(),
      detail: z.string(),
      recommandation: z.string(),
    }),
  ),
  score_global: z.object({
    note_sur_100: z.number(),
    resume: z.string(),
    profil_achat: z.string(),
  }),
  avis_acheteur: z.object({
    resume_simple: z.string(),
    questions_a_poser: z.array(z.string()),
    points_a_verifier_essai: z.array(z.string()),
  }),
})

type AnalyseResult = z.infer<typeof AnalyseResultSchema>

// Description JSON pour guider le modèle
const SCHEMA_DESCRIPTION = `
{
  "fiche": {
    "titre": "string",
    "marque": "string ou null",
    "modele": "string ou null",
    "motorisation": "string ou null",
    "energie": "string ou null",
    "annee": "string ou null",
    "kilometrage": "string ou null",
    "prix": "string ou null",
    "boite": "string ou null",
    "carrosserie": "string ou null",
    "finition": "string ou null",
    "puissance": "string ou null",
    "ct": "string ou null",
    "historique": "string ou null"
  },
  "risques": [
    {
      "type": "string",
      "niveau": "string",
      "detail": "string",
      "recommandation": "string"
    }
  ],
  "score_global": {
    "note_sur_100": 75,
    "resume": "string",
    "profil_achat": "string"
  },
  "avis_acheteur": {
    "resume_simple": "string",
    "questions_a_poser": ["string"],
    "points_a_verifier_essai": ["string"]
  }
}
`.trim()

// ---------- QUOTA DEMO (3 analyses gratuites) ----------

async function checkAndIncrementDemoQuota(
  supabase: any,
  email?: string | null,
  ip?: string | null,
): Promise<{ allowed: boolean; count: number }> {
  if (!email && !ip) {
    // pas d’info → on ne bloque pas
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

  // Pas de ligne → on crée avec count = 1
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

// ---------- OPENAI ----------

async function callOpenAI(env: any, annonce: string): Promise<AnalyseResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('missing_env_OPENAI_API_KEY')
  }

  const systemPrompt =
    "Tu es un expert en véhicules d'occasion. " +
    "Tu analyses une annonce auto pour un particulier français. " +
    "Tu réponds STRICTEMENT au format JSON, sans texte autour."

  const userPrompt = [
    'Analyse cette annonce de véhicule d’occasion :',
    '',
    annonce,
    '',
    'Retourne UNIQUEMENT un objet JSON respectant exactement ce schéma :',
    SCHEMA_DESCRIPTION,
  ].join('\n')

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_output_tokens: 800,
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`openai_http_${res.status}: ${txt}`)
  }

  const data: any = await res.json()

  let raw: string | null = data.output_text ?? null

  if (!raw && Array.isArray(data.output)) {
    try {
      for (const item of data.output) {
        if (!item?.content) continue
        for (const c of item.content) {
          const t = c?.text?.value ?? c?.text ?? null
          if (typeof t === 'string' && t.trim().length > 0) {
            raw = t
            break
          }
        }
        if (raw) break
      }
    } catch {
      // ignore, on gère plus bas
    }
  }

  if (!raw || typeof raw !== 'string') {
    throw new Error('openai_no_text_output')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e: any) {
    throw new Error(`openai_invalid_json: ${e?.message ?? 'parse error'}`)
  }

  const result = AnalyseResultSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      'openai_schema_mismatch: ' + JSON.stringify(result.error.format(), null, 2),
    )
  }

  return result.data
}

// ---------- EMAIL VIA RESEND ----------

async function sendAnalysisEmail(env: any, toEmail: string, result: AnalyseResult) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    console.error('Missing RESEND_API_KEY or MAIL_FROM, skip email')
    return
  }

  const { fiche, score_global, avis_acheteur } = result

  const subject = `Analyse de votre annonce : ${fiche.titre}`
  const lignes: string[] = []

  lignes.push(
    `Résumé : ${score_global.resume}`,
    `Note globale : ${score_global.note_sur_100}/100`,
    `Profil d'achat : ${score_global.profil_achat}`,
    '',
    'Questions à poser au vendeur :',
  )
  for (const q of avis_acheteur.questions_a_poser) {
    lignes.push(`- ${q}`)
  }
  lignes.push('', "Points à vérifier lors de l'essai :")
  for (const p of avis_acheteur.points_a_verifier_essai) {
    lignes.push(`- ${p}`)
  }

  const textBody = lignes.join('\n')

  const payload = {
    from: env.MAIL_FROM,
    to: [toEmail],
    subject,
    text: textBody,
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!r.ok) {
    const errTxt = await r.text().catch(() => '')
    console.error('Resend error', r.status, errTxt)
  }
}

// ---------- HANDLER CLOUDLFARE PAGES ----------

export const onRequestPost = async (context: any): Promise<Response> => {
  try {
    const { env, request } = context

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

    // Lecture du body
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
      // on laisse passer en cas d’erreur de quota
    }

    const started = Date.now()
    let result: AnalyseResult | null = null
    let errorMessage: string | null = null

    try {
      result = await callOpenAI(env, annonce)
    } catch (e: any) {
      errorMessage = e?.message ?? 'openai_error'
    }

    const durationMs = Date.now() - started

    // Log en base
    try {
      await supabase.from('analyses').insert({
        email: email ?? null,
        input_raw: annonce,
        output_json: result,
        duration_ms: durationMs,
        error: errorMessage,
        model: OPENAI_MODEL,
      })
    } catch (e) {
      console.error('Supabase insert error (analyses)', e)
    }

    if (!result) {
      // IA a échoué → on renvoie une erreur contrôlée
      return new Response(
        JSON.stringify({ ok: false, error: errorMessage ?? 'openai_error' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (email) {
      try {
        await sendAnalysisEmail(env, email, result)
      } catch (e) {
        console.error('sendAnalysisEmail error', e)
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: result,
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
    console.error('UNHANDLED ERROR in /api/analyse (full)', e)
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'internal_error_full',
        details: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
