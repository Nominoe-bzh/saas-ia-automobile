// functions/api/join.ts
import type { PagesFunction } from '@cloudflare/workers-types'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
}

export const onRequestPost: PagesFunction<EnvBindings> = async (context) => {
  try {
    const body = await context.request.json()
    const { email } = z.object({ email: z.string().email() }).parse(body)

    // 1) Supabase: insert (ignore doublon)
    const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)
    const { error } = await supabase.from('waitlist').insert({ email })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return new Response(JSON.stringify({ ok: false, error: `supabase: ${error.message}` }), { status: 400 })
    }

    // 2) Resend: envoi via fetch (compat Cloudflare Workers)
    const payload = {
      from: 'SaaS IA Automobile <onboarding@resend.dev>',
      to: [email],
      subject: 'Bienvenue — 3 analyses offertes à l’ouverture',
      text:
        `Bonjour,

Tu es sur liste d’attente de SaaS IA Automobile. À l’ouverture, tu recevras 3 analyses gratuites pour tester l’outil et économiser 500–2 000 € à l’achat.

— Johan`
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => '')
      return new Response(JSON.stringify({ ok: false, error: `resend: ${resp.status} ${errTxt}` }), { status: 400 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'error' }), { status: 400 })
  }
}
