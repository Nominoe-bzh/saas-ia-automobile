'use client'

import { useState } from 'react'
import Link from 'next/link'

type ItemHistorique = {
  id: string
  created_at: string
  vehicule: string | null
  note: number | null
  resume: string | null
  hasRapport: boolean
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export default function MonEspacePage() {
  const [email, setEmail] = useState('')
  const [items, setItems] = useState<ItemHistorique[]>([])
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>(
    'idle'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('pending')
    setErrorMsg(null)
    setItems([])

    if (!email.trim()) {
      setStatus('err')
      setErrorMsg('Merci de saisir un email.')
      return
    }

    // Track: Consultation historique
    if (typeof window !== 'undefined' && (window as any).plausible) {
      ;(window as any).plausible('Historique_Consulted')
    }

    try {
      const res = await fetch(`${API_BASE}/api/historique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        json = null
      }

      if (!res.ok || !json || json.ok === false) {
        const msg =
          json?.error ||
          (res.status === 404
            ? 'Aucune analyse trouvée pour cet email.'
            : `Erreur (code ${res.status}). Réessayez dans quelques instants.`)

        setStatus('err')
        setErrorMsg(msg)
        return
      }

      const list: ItemHistorique[] = Array.isArray(json.items)
        ? json.items
        : []

      setItems(list)
      setStatus('ok')
      
      // Track: Succès avec nombre d'analyses
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('Historique_Loaded', {
          props: {
            nbAnalyses: list.length,
          },
        })
      }
    } catch {
      setStatus('err')
      setErrorMsg(
        'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.'
      )
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Barre de retour */}
      <header className="px-6 py-4 border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
          <Link href="/" className="text-gray-600 hover:underline">
            ← Retour à l’accueil
          </Link>
          <span className="font-semibold">Mon espace</span>
        </div>
      </header>

      {/* Bloc de recherche d’analyses */}
      <section className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-center mb-2">
            Retrouver mes analyses
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Saisissez l’email que vous avez utilisé pour demander vos analyses
            IA.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {status === 'pending'
                ? 'Recherche en cours…'
                : 'Voir mes analyses'}
            </button>

            {errorMsg && (
              <p className="text-sm text-red-700 text-center mt-2">
                {errorMsg}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Tableau des analyses */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="text-base font-semibold mb-3">
          Vos dernières analyses ({items.length})
        </h2>

        <div className="rounded-2xl border overflow-hidden text-sm">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Véhicule</th>
                <th className="text-left px-4 py-2">Note / 100</th>
                <th className="text-left px-4 py-2">Synthèse</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    Aucune analyse trouvée pour l'instant.
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {new Date(item.created_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {item.vehicule || 'Véhicule analysé'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {item.note ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {item.resume || 'Analyse disponible.'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {item.hasRapport ? (
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/rapport?id=${encodeURIComponent(
                            item.id
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Voir
                        </a>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`/api/report/${item.id}`}
                          download
                          className="text-xs text-green-700 hover:underline"
                          onClick={() => {
                            if (typeof window !== 'undefined' && (window as any).plausible) {
                              ;(window as any).plausible('PDF_Downloaded', {
                                props: {
                                  from: 'historique',
                                },
                              })
                            }
                          }}
                        >
                          PDF
                        </a>
                      </div>
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
          Cliquez sur "Voir" pour consulter le rapport ou "PDF" pour le telecharger.
        </p>
      </section>
    </main>
  )
}
