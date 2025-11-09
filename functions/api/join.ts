// functions/api/join.ts
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Déclare les variables disponibles dans context.env
type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
}

// ✅ PagesFunction reçoit maintenant le type EnvBindings
export const onRequestPost: PagesFunction<EnvBindings> = async (context) => {
  try {
    const body = await context.request.json()
    const { email } = z.object({ email: z.string().email() }).parse(body)

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_ANON_KEY
    )

    const { error } = await supabase.from('waitlist').insert({ email })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return new Response(JSON.stringify({ ok:false, error:error.message }), { status:400 })
    }

    const resend = new Resend(context.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SaaS IA Automobile <onboarding@resend.dev>',
      to: email,
      subject: 'Bienvenue — 3 analyses offertes à l’ouverture',
      text: `Bonjour,

Tu es sur liste d’attente de SaaS IA Automobile. À l’ouverture, tu recevras 3 analyses gratuites pour tester l’outil et économiser 500–2 000 € à l’achat.

— Johan`
    })

    return new Response(JSON.stringify({ ok:true }), { status:200 })
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error:e?.message ?? 'error' }), { status:400 })
  }
}
