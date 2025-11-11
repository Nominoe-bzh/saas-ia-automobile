'use client'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '5rem'
    }}>
      <h1>Check Ton Véhicule</h1>
      <p>Recevez votre accès privilégié à l’assistant IA automobile.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Votre adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', width: '250px' }}
        />
        <button
          type="submit"
          style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem' }}
        >
          S’inscrire
        </button>
      </form>

      {status === 'pending' && <p>Envoi en cours…</p>}
      {status === 'success' && <p>Merci ! Vérifiez votre boîte mail 📬</p>}
      {status === 'error' && <p>Erreur d’envoi. Réessayez.</p>}
    </main>
  )
}
