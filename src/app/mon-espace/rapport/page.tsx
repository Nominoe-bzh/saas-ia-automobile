'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

type AnalyseItem = {
  id: string
  created_at: string
  email: string | null
  input_raw: string | null
  model: string | null
  duration_ms: number | null
  output: any | null
}

export default function RapportPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<AnalyseItem | null>(null)

  useEffect(() => {
    // On ne fait rien côté serveur
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    if (!id) {
      setError('Identifiant de rapport manquant.')
      setLoading(false)
      return
    }

    const fetchRapport = async () => {
      setLoading(true)
      setError(null)

      try {
        const endpoint = API_BASE
          ? `${API_BASE}/api/rapport`
          : '/api/rapport'

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
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
            `Erreur lors du chargement du rapport (code ${res.status}).`
          setError(msg)
          setLoading(false)
          return
        }

        setItem(json.item as AnalyseItem)
        setLoading(false)
      } catch {
        setError(
          "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez."
        )
        setLoading(false)
      }
    }

    fetchRapport()
  }, [])

  const handleBack = () => {
    router.push('/mon-espace')
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Retour à l’espace
          </button>
          <h1 className="text-lg font-semibold">Détail du rapport</h1>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <p className="text-sm text-gray-600">
            Chargement du rapport en cours…
          </p>
        )}

        {!loading && error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <div className="space-y-6">
            {/* En-tête rapport */}
            <div className="rounded-xl border px-4 py-3">
              <h2 className="text-base font-semibold mb-2">
                Informations générales
              </h2>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Date :</span>{' '}
                {new Date(item.created_at).toLocaleString('fr-FR')}
              </p>
              {item.email && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Email :</span> {item.email}
                </p>
              )}
              {item.model && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Modèle IA :</span> {item.model}
                </p>
              )}
              {typeof item.duration_ms === 'number' && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Temps de calcul :</span>{' '}
                  {item.duration_ms} ms
                </p>
              )}
            </div>

            {/* Annonce d’origine */}
            {item.input_raw && (
              <div className="rounded-xl border px-4 py-3">
                <h2 className="text-base font-semibold mb-2">
                  Annonce analysée
                </h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {item.input_raw}
                </pre>
              </div>
            )}

            {/* Résultat IA (si présent) */}
            {item.output && (
              <div className="rounded-xl border px-4 py-3 space-y-4">
                <h2 className="text-base font-semibold mb-2">
                  Résultat de l’analyse IA
                </h2>

                {/* Synthèse rapide */}
                {item.output.avis_acheteur?.resume_simple && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">
                      Synthèse rapide
                    </h3>
                    <p className="text-sm text-gray-800">
                      {item.output.avis_acheteur.resume_simple}
                    </p>
                  </div>
                )}

                {/* Score */}
                {typeof item.output.score_global?.note_sur_100 ===
                  'number' && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">
                      Score global
                    </h3>
                    <p className="text-sm text-gray-800">
                      Note :{' '}
                      <span className="font-semibold">
                        {item.output.score_global.note_sur_100} / 100
                      </span>
                    </p>
                    {item.output.score_global.resume && (
                      <p className="text-sm text-gray-700 mt-1">
                        {item.output.score_global.resume}
                      </p>
                    )}
                  </div>
                )}

                {/* Risques */}
                {Array.isArray(item.output.risques) &&
                  item.output.risques.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">
                        Risques identifiés
                      </h3>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {item.output.risques.map(
                          (r: any, idx: number) => (
                            <li key={idx}>
                              <span className="font-semibold">
                                {r.type ? `${r.type} – ` : ''}
                                {r.niveau ? `${r.niveau} : ` : ''}
                              </span>
                              {r.detail}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Questions & check-list */}
                {Array.isArray(
                  item.output.avis_acheteur?.questions_a_poser
                ) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">
                      Questions à poser au vendeur
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                      {item.output.avis_acheteur.questions_a_poser.map(
                        (q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {Array.isArray(
                  item.output.avis_acheteur?.points_a_verifier_essai
                ) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">
                      Points à vérifier lors de l’essai
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                      {item.output.avis_acheteur.points_a_verifier_essai.map(
                        (p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!item.output && (
              <p className="text-sm text-gray-600">
                Le détail du rapport complet n’est pas encore disponible pour
                cette analyse.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
