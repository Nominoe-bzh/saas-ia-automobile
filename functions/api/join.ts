// functions/api/join.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string
}

type CFContext = {
  env: EnvBindings
  request: Request
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const joinInputSchema = z.object({
  email: z.string().email('Email invalide'),
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Prénom trop long'),
  type_utilisateur: z.enum(['Particulier', 'Pro', 'Concessionnaire'], {
    message: 'Type utilisateur invalide',
  }),
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // Parse et validation
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parsed = joinInputSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, error: 'INVALID_INPUT', details: parsed.error.flatten() },
      400,
    )
  }

  const { email, prenom, type_utilisateur } = parsed.data

  // 1) Insert Supabase
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const { error: insertError } = await supabase.from('waitlist').insert({
    email,
    prenom,
    type_utilisateur,
  })

  if (insertError) {
    // Gestion des doublons (email déjà présent)
    if (
      insertError.code === '23505' ||
      String(insertError.message).toLowerCase().includes('duplicate')
    ) {
      return jsonResponse(
        { ok: false, error: 'EMAIL_ALREADY_EXISTS', message: 'Cet email est déjà inscrit' },
        409,
      )
    }

    console.error('Supabase insert error:', insertError)
    return jsonResponse(
      { ok: false, error: 'DB_ERROR', message: 'Erreur lors de l\'inscription' },
      500,
    )
  }

  // 2) Envoi email via Resend (non bloquant)
  let emailSent = false
  try {
    const emailPayload = {
      from: env.MAIL_FROM,
      to: [email],
      subject: 'Bienvenue — 3 analyses offertes à l'ouverture',
      text: `Bonjour ${prenom},

Tu es sur liste d'attente de Check Ton Véhicule. À l'ouverture, tu recevras 3 analyses gratuites pour tester l'outil et économiser 500–2 000 € à l'achat.

— Johan`,
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    if (resendRes.ok) {
      emailSent = true
    } else {
      const errText = await resendRes.text().catch(() => '')
      console.error('Resend error:', resendRes.status, errText)
      // On continue même si l'email échoue
    }
  } catch (emailError) {
    console.error('Email send exception:', emailError)
    // On continue même si l'email échoue
  }

  // Toujours retourner une réponse, même si l'email échoue
  const response: Response = jsonResponse({
    ok: true,
    message: 'Inscription réussie',
    email_sent: emailSent,
  })
  
  return response
}
