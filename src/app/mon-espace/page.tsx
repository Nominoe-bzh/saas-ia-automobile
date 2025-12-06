'use client'

import React, { useState } from 'react'

type HistoriqueItem = {
  id: string
  created_at: string
  vehicule: string
  note: number | null
  resume: string
  hasRapport: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

export default function MonEspacePage() {
  const [email, setEmail] = useState('')
  const [items, setItems] = useState<HistoriqueItem[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    'idle'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFetch = async () => {
    if (!email.trim()) {
      setErrorMsg('Merci de saisir un email.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg(null)
    setItems([])

    try {
      const res = await fetch(`${API_BASE}/api/historique`, {
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
          json?.error ||
          `Réponse inattendue du serveur (code ${res.status}).`
        setErrorMsg(msg)
        setStatus('error')
        return
      }

      const list: HistoriqueItem[] = Array.isArray(json.items)
        ? json.items
        : []

      setItems(list)
      setStatus('ok')
    } catch {
      setErrorMsg(
        'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.'
      )
      setStatus('error')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <a href="/" className="text-sm text-gray-600 hover:underline">
          ← Retour à l’accueil
        </a>
        <h1 className="text-lg font-semibold">Mon espace</h1>
        <div className="w-20" />
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="rounded-2xl border p-6 max-w-3xl mx-auto shadow-sm">
          <h2 className="text-xl font-semibold text-center">
            Retrouver mes analyses
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Saisissez l’email que vous avez utilisé pour demander vos analyses
            IA.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </div>

            <button
              type="button"
              onClick={handleFetch}
              disabled={status === 'loading'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {status === 'loading' ? 'Recherche en cours…' : 'Voir mes analyses'}
            </button>

            {errorMsg && (
              <p className="text-sm text-red-700 text-center mt-2">
                {errorMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="text-base font-semibold mb-3">
          Vos dernières analyses ({items.length})
        </h2>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-2 border-b">Date</th>
                <th className="px-4 py-2 border-b">Véhicule</th>
                <th className="px-4 py-2 border-b">Note / 100</th>
                <th className="px-4 py-2 border-b">Synthèse</th>
                <th className="px-4 py-2 border-b">Rapport</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Aucune analyse trouvée pour cet email pour le moment.
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-2">{item.vehicule}</td>
                  <td className="px-4 py-2">
                    {item.note !== null ? item.note : '—'}
                  </td>
                  <td className="px-4 py-2">{item.resume}</td>
                  <td className="px-4 py-2">
                    {item.hasRapport ? (
                      <button
                        type="button"
                        className="text-sm text-black underline"
                        onClick={() =>
                          alert(
                            'Le rapport détaillé sera bientôt disponible dans une nouvelle page.'
                          )
                        }
                      >
                        Voir le rapport
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Non disponible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Les rapports détaillés seront bientôt consultables et exportables
          depuis cet espace.
        </p>
      </section>
    </main>
  )
}
