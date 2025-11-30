'use client'

import { useState } from 'react'

type AnalyseItem = {
  id: string
  created_at: string
  input_raw: string
  titre: string | null
  marque: string | null
  modele: string | null
  annee: string | null
  kilometrage: string | null
  energie: string | null
  prix: string | null
  note: number | null
}

export default function MonEspace() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<AnalyseItem[]>([])

  const handleLoad = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email.trim()) {
      setError('Merci de saisir un email.')
      setStatus('err')
      return
    }

    setStatus('pending')
    setError(null)
    setItems([])

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || ''
      const res = await fetch(`${apiBase}/api/historique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
       })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        // réponse non JSON
      }

      if (!res.ok || !json || json.ok === false) {
        const msg =
          json?.error === 'HISTORIQUE_READ_ERROR'
            ? 'Erreur lors de la récupération de votre historique. Réessayez plus tard.'
            : `Erreur (code ${res.status}). Réessayez dans quelques instants.`

        setError(msg)
        setStatus('err')
        return
      }

      const list: AnalyseItem[] = Array.isArray(json.items) ? json.items : []

      setItems(list)
      setStatus('ok')
    } catch {
      setError(
        'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.',
      )
      setStatus('err')
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="px-6 py-8 max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center">
          Mon espace – Historique des analyses
        </h1>
        <p className="mt-3 text-sm text-gray-600 text-center">
          Entrez le même email que celui utilisé pour recevoir vos rapports
          d’analyse.
        </p>

        <form
          onSubmit={handleLoad}
          className="mt-8 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={status === 'pending'}
            className="rounded-md bg-black text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {status === 'pending' ? 'Chargement…' : 'Voir mon historique'}
          </button>
        </form>

        {status === 'pending' && !error && (
          <p className="mt-4 text-sm text-gray-500">
            Récupération de vos dernières analyses…
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {status === 'ok' && items.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">
            Aucun rapport trouvé pour cet email. Vérifiez l’orthographe ou
            faites une nouvelle analyse depuis la page d’accueil.
          </p>
        )}

        {status === 'ok' && items.length > 0 && (
          <section className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              {items.length} analyse(s) trouvée(s) pour <strong>{email}</strong>.
            </p>

            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border px-4 py-3 text-sm bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold">
                        {item.marque || item.modele
                          ? [item.marque, item.modele].filter(Boolean).join(' ')
                          : item.titre || 'Analyse de véhicule'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {item.note !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Note</p>
                        <p className="text-sm font-semibold">
                          {item.note} / 100
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-gray-700 line-clamp-2">
                    {item.input_raw}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {[
                      item.annee,
                      item.kilometrage,
                      item.energie,
                      item.prix,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
