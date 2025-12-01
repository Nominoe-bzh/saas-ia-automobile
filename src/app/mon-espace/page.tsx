'use client'

import { useState } from 'react'

type AnalyseItem = {
  id: string
  created_at: string
  output_json?: any | null
}

type ApiResponse =
  | { ok: true; items: AnalyseItem[] }
  | { ok: false; error: string }

const getApiUrl = (path: string) => {
  const base = process.env.NEXT_PUBLIC_API_BASE
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}

export default function MonEspacePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<AnalyseItem[]>([])
  const [selected, setSelected] = useState<AnalyseItem | null>(null)

  const handleFetch = async () => {
    if (!email.trim()) {
      setError('Merci de saisir un email.')
      setStatus('err')
      return
    }

    setStatus('pending')
    setError(null)
    setItems([])

    try {
      const res = await fetch(getApiUrl('/api/historique'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      let json: ApiResponse
      try {
        json = (await res.json()) as ApiResponse
      } catch {
        setStatus('err')
        setError(
          `Réponse inattendue du serveur (code ${res.status}). Réessayez dans quelques instants.`
        )
        return
      }

      if (!res.ok || !json.ok) {
        setStatus('err')
        setError(
          'Erreur lors de la récupération de vos analyses. Réessayez dans quelques instants.'
        )
        return
      }

      setItems(json.items || [])
      setStatus('ok')
    } catch {
      setStatus('err')
      setError(
        'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.'
      )
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

  const renderNote = (item: AnalyseItem) => {
    const analyse = item.output_json
    if (!analyse) return '—'
    const score = analyse.score_global
    if (typeof score === 'number') return `${score} / 100`
    if (score && typeof score.note_sur_100 === 'number') {
      return `${score.note_sur_100} / 100`
    }
    return '—'
  }

  const renderSynthese = (item: AnalyseItem) => {
    const analyse = item.output_json
    if (!analyse) return 'Analyse disponible.'
    const avis =
      analyse.avis_acheteur || analyse.avis || analyse.score_global || null
    if (avis?.resume_simple) return avis.resume_simple
    if (avis?.resume) return avis.resume
    return 'Analyse disponible.'
  }

  const handleOpenReport = (item: AnalyseItem) => {
    if (!item.output_json) return
    setSelected(item)
  }

  const handleCloseReport = () => {
    setSelected(null)
  }

  // ---- Détail du rapport (modal) ----
  const renderReportModal = () => {
    if (!selected || !selected.output_json) return null
    const analyse = selected.output_json

    const fiche = analyse.fiche || {}
    const risques: any[] = Array.isArray(analyse.risques)
      ? analyse.risques
      : []
    const scoreObj = analyse.score_global || {}
    const avis = analyse.avis_acheteur || analyse.avis || {}

    const note =
      typeof scoreObj === 'number'
        ? scoreObj
        : typeof scoreObj?.note_sur_100 === 'number'
        ? scoreObj.note_sur_100
        : null

    const recommendation =
      avis?.resume_simple ||
      avis?.resume ||
      (analyse ? 'Analyse disponible ci-dessous.' : '')

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Rapport d’analyse – {formatDate(selected.created_at)}
            </h2>
            <button
              type="button"
              onClick={handleCloseReport}
              className="text-sm text-gray-500 hover:text-black"
            >
              Fermer
            </button>
          </div>

          <div className="space-y-4 text-sm">
            {/* Synthèse */}
            <div>
              <h3 className="font-semibold mb-1">Synthèse rapide</h3>
              <p className="text-gray-700">
                {recommendation || 'Analyse disponible ci-dessous.'}
              </p>
            </div>

            {/* Fiche véhicule */}
            <div className="rounded-lg border px-3 py-2">
              <h4 className="font-semibold mb-1">Fiche véhicule</h4>
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

            {/* Score global */}
            {note !== null && (
              <div className="rounded-lg border px-3 py-2">
                <h4 className="font-semibold mb-1">Score global</h4>
                <p className="text-gray-700">
                  Note : <span className="font-semibold">{note} / 100</span>
                </p>
                {scoreObj?.resume && (
                  <p className="text-gray-600 mt-1">{scoreObj.resume}</p>
                )}
              </div>
            )}

            {/* Risques principaux */}
            {risques.length > 0 && (
              <div className="rounded-lg border px-3 py-2">
                <h4 className="font-semibold mb-2">Risques identifiés</h4>
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

            {/* Questions & points à vérifier */}
            {(Array.isArray(avis.questions_a_poser) ||
              Array.isArray(avis.points_a_verifier_essai)) && (
              <div className="rounded-lg border px-3 py-2 space-y-3">
                {Array.isArray(avis.questions_a_poser) && (
                  <div>
                    <h4 className="font-semibold mb-1">
                      Questions à poser au vendeur
                    </h4>
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
                    <h4 className="font-semibold mb-1">
                      Points à vérifier lors de l’essai
                    </h4>
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
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <a href="/" className="text-sm text-gray-500 hover:underline">
            ← Retour à l’accueil
          </a>
          <h1 className="text-lg font-semibold">Mon espace</h1>
        </div>
      </header>

      <section className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">
            Retrouver mes analyses
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Saisissez l’email que vous avez utilisé pour demander vos analyses
            IA.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              placeholder="votre.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="button"
              onClick={handleFetch}
              disabled={status === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {status === 'pending' ? 'Recherche en cours…' : 'Voir mes analyses'}
            </button>

            {error && (
              <p className="text-sm text-red-700 text-center mt-2">{error}</p>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <h2 className="text-base font-semibold mb-3">
          Vos dernières analyses ({items.length})
        </h2>

        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b px-4 py-2 text-left">Date</th>
                <th className="border-b px-4 py-2 text-left">Véhicule</th>
                <th className="border-b px-4 py-2 text-left">Note / 100</th>
                <th className="border-b px-4 py-2 text-left">Synthèse</th>
                <th className="border-b px-4 py-2 text-left">Rapport</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    Aucune analyse trouvée pour cet email pour le moment.
                  </td>
                </tr>
              )}

              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-2">Véhicule analysé</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {renderNote(item)}
                  </td>
                  <td className="px-4 py-2 max-w-xs">
                    <span className="line-clamp-2">
                      {renderSynthese(item)}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {item.output_json ? (
                      <button
                        type="button"
                        onClick={() => handleOpenReport(item)}
                        className="text-sm text-black underline underline-offset-2 hover:opacity-80"
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

        <p className="text-xs text-gray-500 mt-3">
          Les rapports détaillés seront bientôt consultables et exportables
          depuis cet espace.
        </p>
      </section>

      {renderReportModal()}
    </main>
  )
}
