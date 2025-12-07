// src/components/SimpleAnalysisResult.tsx
// Affichage simplifié pour l'ancien format (rétrocompatibilité)

'use client'

import { useState } from 'react'

type SimpleAnalysisResultProps = {
  data: any
  analysisId?: string
}

export default function SimpleAnalysisResult({ data, analysisId }: SimpleAnalysisResultProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const handleDownloadPDF = async () => {
    if (!analysisId) {
      setPdfError('ID d\'analyse manquant')
      return
    }

    setPdfLoading(true)
    setPdfError(null)

    try {
      // Ouvrir la page d'impression dans un nouvel onglet
      window.open(`/rapport/${analysisId}/print`, '_blank')

      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('PDF_Downloaded', {
          props: {
            source: 'simple_result',
          },
        })
      }
    } catch (error: any) {
      console.error('PDF download error:', error)
      setPdfError('Impossible de telecharger le PDF. Reessaie plus tard.')
    } finally {
      setPdfLoading(false)
    }
  }
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

  const recommendation = avis?.resume_simple || avis?.resume || 'Analyse disponible ci-dessous.'

  return (
    <div className="mt-6 space-y-4 text-sm">
      {/* Bouton de téléchargement PDF */}
      {analysisId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Telecharger le rapport complet</h3>
              <p className="text-sm text-gray-600">Format PDF a partager ou imprimer</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generation...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Telecharger PDF</span>
                </>
              )}
            </button>
          </div>
          {pdfError && (
            <p className="mt-3 text-sm text-red-600">{pdfError}</p>
          )}
        </div>
      )}

      {/* Synthèse */}
      <div>
        <h3 className="font-semibold mb-1">Synthèse rapide</h3>
        <p className="text-gray-700">{recommendation}</p>
      </div>

      {/* Fiche véhicule */}
      <div className="rounded-lg border px-3 py-2">
        <h4 className="font-semibold mb-1">Fiche véhicule (extrait)</h4>
        <p className="text-gray-700">
          {[fiche.marque, fiche.modele, fiche.version || fiche.finition].filter(Boolean).join(' ')}
        </p>
        <p className="text-gray-500">
          {[fiche.annee, fiche.kilometrage, fiche.energie, fiche.prix].filter(Boolean).join(' • ')}
        </p>
      </div>

      {/* Score global */}
      {note !== null && (
        <div className="rounded-lg border px-3 py-2">
          <h4 className="font-semibold mb-1">Score global</h4>
          <p className="text-gray-700">
            Note : <span className="font-semibold">{note} / 100</span>
          </p>
          {scoreObj?.resume && <p className="text-gray-600 mt-1">{scoreObj.resume}</p>}
        </div>
      )}

      {/* Risques principaux */}
      {risques.length > 0 && (
        <div className="rounded-lg border px-3 py-2">
          <h4 className="font-semibold mb-2">Risques identifiés</h4>
          <ul className="space-y-1 list-disc pl-4 text-gray-700">
            {risques.slice(0, 3).map((r, idx) => (
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

      {/* Questions & check-list */}
      {(avis?.questions_a_poser || avis?.points_a_verifier_essai) && (
        <div className="rounded-lg border px-3 py-2 space-y-3">
          {Array.isArray(avis.questions_a_poser) && (
            <div>
              <h4 className="font-semibold mb-1">Questions à poser au vendeur</h4>
              <ul className="list-disc pl-4 text-gray-700">
                {avis.questions_a_poser.slice(0, 5).map((q: string, idx: number) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(avis.points_a_verifier_essai) && (
            <div>
              <h4 className="font-semibold mb-1">Points à vérifier à l'essai</h4>
              <ul className="list-disc pl-4 text-gray-700">
                {avis.points_a_verifier_essai.slice(0, 5).map((p: string, idx: number) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CTA après le résultat */}
      <div className="rounded-lg bg-gray-50 px-3 py-3 text-center border border-gray-200 mt-4">
        <p className="text-gray-700 text-sm mb-2">
          Inscris-toi en bas de page pour accéder à l'historique de tes analyses et bien plus à
          venir !
        </p>
      </div>
    </div>
  )
}


