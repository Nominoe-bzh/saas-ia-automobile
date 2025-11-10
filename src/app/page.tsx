'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (honeypot.trim() !== '') {
      setMsg('Erreur inattendue.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Merci d’entrer un email valide.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setMsg('Merci ! Tu es sur liste d’attente. Regarde tes emails 👍')
        setEmail('')
      } else {
        setMsg(data.error || 'Erreur lors de l’envoi.')
      }
    } catch {
      setMsg('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Check Ton Véhicule</h1>
        <p className="text-sm text-gray-600">
          Inscris-toi pour 3 analyses offertes à l’ouverture.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ton@email.com"
              className="flex-1 rounded-xl border px-3 py-2"
            />
            <button
              disabled={loading}
              className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? '...' : 'Je m’inscris'}
            </button>
          </div>

          {/* Champ honeypot invisible */}
          <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <label>Company</label>
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </form>

        {msg && <div className="text-sm">{msg}</div>}
      </div>
    </main>
  )
}
