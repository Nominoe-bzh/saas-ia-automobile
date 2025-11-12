'use client'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [typeUser, setTypeUser] = useState('Particulier')
  const [status, setStatus] = useState<'idle'|'pending'|'ok'|'err'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prenom, type_utilisateur: typeUser }),
      })
      setStatus(res.ok ? 'ok' : 'err')
      if (res.ok) { setEmail(''); setPrenom(''); setTypeUser('Particulier') }
    } catch { setStatus('err') }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="px-6 py-20 md:py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Check Ton Véhicule
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600">
          L’assistant IA qui sécurise l’achat de votre voiture d’occasion.
        </p>
      </section>

      {/* Features */}
      <section className="px-6 py-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Analyse d’annonce</h3>
          <p className="text-sm text-gray-600 mt-2">Détection des incohérences, alertes risques, check points.</p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Négociation assistée</h3>
          <p className="text-sm text-gray-600 mt-2">Arguments chiffrés basés sur marché et historique.</p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Économie potentielle</h3>
          <p className="text-sm text-gray-600 mt-2">500–2 000 € économisés en moyenne sur le prix final.</p>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-6 max-w-5xl mx-auto text-center">
        <p className="text-sm text-gray-500">Phase pilote en cours — accès prioritaire à l’ouverture.</p>
      </section>

      {/* Signup */}
      <section className="px-6 py-12 max-w-xl mx-auto">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">Rejoindre la liste d’attente</h2>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">Prénom</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Vous êtes</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={typeUser}
                onChange={(e) => setTypeUser(e.target.value)}
              >
                <option>Particulier</option>
                <option>Pro</option>
                <option>Concessionnaire</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={status === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {status === 'pending' ? 'Envoi…' : 'Je m’inscris'}
            </button>

            {status === 'ok' && (
              <p className="text-green-700 text-sm text-center">Merci. Vérifiez votre boîte mail.</p>
            )}
            {status === 'err' && (
              <p className="text-red-700 text-sm text-center">Erreur d’envoi. Réessayez.</p>
            )}
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            En soumettant, vous acceptez de recevoir un email d’accueil.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Check Ton Véhicule — Tous droits réservés.
      </footer>
    </main>
  )
}
