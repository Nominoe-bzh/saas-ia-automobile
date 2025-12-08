// functions/api/join.ts
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string                // ← ajouté
}

type CFContext = {
  env: EnvBindings
  request: Request
}

export async function onRequestPost(context: CFContext): Promise<Response> {
  try {
    const body = await context.request.json()
    const { email } = z.object({ email: z.string().email() }).parse(body)

    // 1) Insert Supabase
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)
    const { error } = await supabase.from('waitlist').insert({ email })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return new Response(JSON.stringify({ ok: false, error: `supabase: ${error.message}` }), { status: 400 })
    }

    // 2) Envoi email via Resend (domaine vérifié)
    const payload = {
      from: context.env.MAIL_FROM,   // ← utilise ton domaine vérifié
      to: [email],
      subject: 'Bienvenue — 3 analyses offertes à l’ouverture',
      text: `Bonjour,

Tu es sur liste d’attente de Check Ton Véhicule. À l’ouverture, tu recevras 3 analyses gratuites pour tester l’outil et économiser 500–2 000 € à l’achat.

— Johan`
    }

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!r.ok) {
      const errTxt = await r.text().catch(() => '')
      return new Response(JSON.stringify({ ok: false, error: `resend: ${r.status}\n${errTxt}` }), { status: 400 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'error' }), { status: 400 })
  }
}
