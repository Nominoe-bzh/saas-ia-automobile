// functions/api/join.ts
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json()
    const { email } = z.object({ email: z.string().email() }).parse(body)

    // Connexion à Supabase
    const supabase = createClient(
      context.env.SUPABASE_URL as string,
      context.env.SUPABASE_ANON_KEY as string
    )

    // Insertion de l’email (ignore les doublons)
    const { error } = await supabase.from('waitlist').insert({ email })
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return new Response(JSON.stringify({ ok:false, error:error.message }), { status:400 })
    }

    // Envoi de l’email via Resend
    const resend = new Resend(context.env.RESEND_API_KEY as string)
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
