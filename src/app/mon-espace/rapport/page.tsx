'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type RapportData = any

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

function RapportContent() {
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<'pending' | 'ok' | 'err'>('pending')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [data, setData] = useState<RapportData | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')

    if (!id) {
      setStatus('err')
      setErrorMsg('Identifiant de rapport manquant dans l’URL.')
      return
    }

    const fetchRapport = async () => {
      // Track: Consultation rapport
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('Rapport_Viewed', {
          props: {
            rapportId: id.substring(0, 8), // Premiers caractères pour anonymiser
          },
        })
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/rapport?id=${encodeURIComponent(id)}`
        )

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
              ? 'Rapport introuvable pour cet identifiant.'
              : `Erreur (code ${res.status}). Réessayez dans quelques instants.`)

          setStatus('err')
          setErrorMsg(msg)
          return
        }

        setData(json.data)
        setStatus('ok')
        
        // Track: Rapport chargé avec métadonnées
        if (typeof window !== 'undefined' && (window as any).plausible) {
          const score = json.data?.score_global?.note_sur_100
          ;(window as any).plausible('Rapport_Loaded', {
            props: {
              score: score || 0,
              hasRisques: Array.isArray(json.data?.risques) && json.data.risques.length > 0,
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

    fetchRapport()
  }, [searchParams])

  const fiche = data?.fiche || {}
  const risques: any[] = Array.isArray(data?.risques) ? data.risques : []
  const scoreObj = data?.score_global || {}
  const avis = data?.avis_acheteur || data?.avis || {}

  const note =
    typeof scoreObj === 'number'
      ? scoreObj
      : typeof scoreObj?.note_sur_100 === 'number'
      ? scoreObj.note_sur_100
      : null

  const recommendation =
    avis?.resume_simple ||
    avis?.resume ||
    (data ? 'Analyse disponible ci-dessous.' : '')

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="px-6 py-4 border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
          <Link href="/mon-espace" className="text-gray-600 hover:underline">
            ← Retour à l’espace
          </Link>
          <span className="font-semibold">Détail du rapport</span>
        </div>
      </header>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        {status === 'pending' && !errorMsg && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Chargement du rapport en cours…
          </div>
        )}

        {errorMsg && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        {status === 'ok' && data && (
          <div className="space-y-6 text-sm">
            {/* Synthèse */}
            <div className="rounded-lg border px-4 py-3">
              <h2 className="font-semibold mb-1">Synthèse rapide</h2>
              <p className="text-gray-700">
                {recommendation || 'Analyse disponible.'}
              </p>
            </div>

            {/* Fiche véhicule */}
            <div className="rounded-lg border px-4 py-3">
              <h3 className="font-semibold mb-1">Fiche véhicule</h3>
              <p className="text-gray-700">
                {[fiche.marque, fiche.modele, fiche.version || fiche.finition]
                  .filter(Boolean)
                  .join(' ')}
              </p>
              <p className="text-gray-500">
                {[
                  fiche.annee,
                  fiche.kilometrage,
                  fiche.energie,
                  fiche.prix,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            </div>

            {/* Score */}
            {note !== null && (
              <div className="rounded-lg border px-4 py-3">
                <h3 className="font-semibold mb-1">Score global</h3>
                <p className="text-gray-700">
                  Note : <span className="font-semibold">{note} / 100</span>
                </p>
                {scoreObj?.resume && (
                  <p className="text-gray-600 mt-1">{scoreObj.resume}</p>
                )}
              </div>
            )}

            {/* Risques */}
            {risques.length > 0 && (
              <div className="rounded-lg border px-4 py-3">
                <h3 className="font-semibold mb-2">Risques identifiés</h3>
                <ul className="space-y-1 list-disc pl-4 text-gray-700">
                  {risques.map((r, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">
                        {r.type ? `${r.type} – ` : ''}
                        {r.niveau ? `${r.niveau} : ` : ''}
                      </span>
                      {r.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions / check-list */}
            {(avis?.questions_a_poser || avis?.points_a_verifier_essai) && (
              <div className="rounded-lg border px-4 py-3 space-y-3">
                {Array.isArray(avis.questions_a_poser) && (
                  <div>
                    <h3 className="font-semibold mb-1">
                      Questions à poser au vendeur
                    </h3>
                    <ul className="list-disc pl-4 text-gray-700">
                      {avis.questions_a_poser.map(
                        (q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {Array.isArray(avis.points_a_verifier_essai) && (
                  <div>
                    <h3 className="font-semibold mb-1">
                      Points à vérifier à l’essai
                    </h3>
                    <ul className="list-disc pl-4 text-gray-700">
                      {avis.points_a_verifier_essai.map(
                        (p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default function RapportPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-gray-900">
          <header className="px-6 py-4 border-b">
            <div className="max-w-5xl mx-auto flex items-center justify-between text-sm">
              <Link href="/mon-espace" className="text-gray-600 hover:underline">
                ← Retour à l’espace
              </Link>
              <span className="font-semibold">Détail du rapport</span>
            </div>
          </header>
          <section className="px-6 py-10 max-w-5xl mx-auto">
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Chargement du rapport en cours…
            </div>
          </section>
        </main>
      }
    >
      <RapportContent />
    </Suspense>
  )
}
