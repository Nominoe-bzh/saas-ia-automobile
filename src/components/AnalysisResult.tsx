// src/components/AnalysisResult.tsx
// Composant pour afficher le résultat d'analyse complet

'use client'

import { useState } from 'react'

type AnalysisResultProps = {
  data: {
    fiche: {
      titre: string
      marque: string
      modele: string
      finition: string | null
      annee: string | null
      kilometrage: string | null
      energie: string | null
      prix: string | null
    }
    risques: Array<{
      type: string
      niveau: 'faible' | 'modéré' | 'élevé'
      detail: string
      recommandation: string
    }>
    score_global: {
      note_sur_100: number
      resume: string
      profil_achat: 'acheter' | 'a_negocier' | 'a_eviter'
    }
    avis_acheteur: {
      resume_simple: string
      questions_a_poser: string[]
      points_a_verifier_essai: string[]
    }
    prix_cible?: {
      estimation: number
      fourchette_basse: number
      fourchette_haute: number
      ecart_annonce: number
      ecart_pourcentage: number
      justification: string
      opportunite: 'excellente' | 'bonne' | 'correcte' | 'surcote'
    }
    checklist_inspection?: {
      mecanique: string[]
      administratif: string[]
      vendeur: string[]
    }
  }
  analysisId?: string
}

export default function AnalysisResult({ data, analysisId }: AnalysisResultProps) {
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
      // Utiliser URL absolue pour Cloudflare Functions
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://www.checktonvehicule.fr'
      window.open(`${apiBase}/api/pdf/generate?id=${analysisId}`, '_blank')

      // Track download
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('PDF_Downloaded', {
          props: {
            marque: data.fiche.marque,
            score: data.score_global.note_sur_100,
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

  return (
    <div className="space-y-6">
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

      {/* Verdict principal avec jauge */}
      <VerdictCard score={data.score_global} />

      {/* Prix cible */}
      {data.prix_cible && <PriceTargetCard priceData={data.prix_cible} />}

      {/* Fiche technique */}
      <FicheCard fiche={data.fiche} />

      {/* Risques détectés */}
      <RisquesCard risques={data.risques} />

      {/* Checklist inspection */}
      {data.checklist_inspection && (
        <ChecklistCard checklist={data.checklist_inspection} />
      )}

      {/* Avis acheteur */}
      <AvisCard avis={data.avis_acheteur} />
    </div>
  )
}

// --- Composants individuels ---

function VerdictCard({ score }: { score: AnalysisResultProps['data']['score_global'] }) {
  const { note_sur_100, resume, profil_achat } = score

  // Couleur selon le profil
  const colors = {
    acheter: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    a_negocier: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
    a_eviter: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  }

  const color = colors[profil_achat]

  // Label du verdict
  const verdictLabel = {
    acheter: '✅ Acheter',
    a_negocier: '💰 À négocier',
    a_eviter: '❌ À éviter',
  }

  return (
    <div className={`rounded-2xl border ${color.border} ${color.bg} p-6 shadow-sm`}>
      <h2 className="text-2xl font-bold mb-4">Verdict IA</h2>

      {/* Jauge de score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Score global</span>
          <span className={`text-3xl font-bold ${color.text}`}>{note_sur_100}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              profil_achat === 'acheter'
                ? 'bg-green-600'
                : profil_achat === 'a_negocier'
                ? 'bg-orange-500'
                : 'bg-red-600'
            }`}
            style={{ width: `${note_sur_100}%` }}
          />
        </div>
      </div>

      {/* Badge verdict */}
      <div className={`inline-block px-4 py-2 rounded-full ${color.bg} ${color.text} font-semibold text-lg mb-3`}>
        {verdictLabel[profil_achat]}
      </div>

      {/* Résumé */}
      <p className="text-gray-700 leading-relaxed">{resume}</p>
    </div>
  )
}

function PriceTargetCard({ priceData }: { priceData: NonNullable<AnalysisResultProps['data']['prix_cible']> }) {
  const { estimation, fourchette_basse, fourchette_haute, ecart_annonce, ecart_pourcentage, justification, opportunite } = priceData

  const opportuniteColors = {
    excellente: 'bg-green-100 text-green-800 border-green-300',
    bonne: 'bg-blue-100 text-blue-800 border-blue-300',
    correcte: 'bg-gray-100 text-gray-800 border-gray-300',
    surcote: 'bg-red-100 text-red-800 border-red-300',
  }

  const opportuniteLabel = {
    excellente: '🔥 Excellente opportunité',
    bonne: '👍 Bonne affaire',
    correcte: '⚖️ Prix correct',
    surcote: '⚠️ Surcoté',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">💰 Prix cible</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Fourchette basse</p>
          <p className="text-2xl font-bold text-gray-900">{fourchette_basse.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <p className="text-sm text-blue-600 mb-1 font-semibold">Prix cible</p>
          <p className="text-3xl font-bold text-blue-900">{estimation.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Fourchette haute</p>
          <p className="text-2xl font-bold text-gray-900">{fourchette_haute.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {ecart_annonce !== 0 && (
        <div className={`p-4 rounded-lg border ${opportuniteColors[opportunite]} mb-4`}>
          <p className="font-semibold mb-1">{opportuniteLabel[opportunite]}</p>
          <p className="text-sm">
            Écart avec le prix annoncé : {ecart_annonce > 0 ? '+' : ''}{ecart_annonce.toLocaleString('fr-FR')} € 
            ({ecart_pourcentage > 0 ? '+' : ''}{ecart_pourcentage.toFixed(1)}%)
          </p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Justification :</p>
        <p className="text-sm text-gray-600 leading-relaxed">{justification}</p>
      </div>
    </div>
  )
}

function FicheCard({ fiche }: { fiche: AnalysisResultProps['data']['fiche'] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">📋 Fiche technique</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fiche.marque && (
          <div>
            <span className="text-sm text-gray-500">Marque :</span>
            <span className="ml-2 font-semibold">{fiche.marque}</span>
          </div>
        )}
        {fiche.modele && (
          <div>
            <span className="text-sm text-gray-500">Modèle :</span>
            <span className="ml-2 font-semibold">{fiche.modele}</span>
          </div>
        )}
        {fiche.finition && (
          <div>
            <span className="text-sm text-gray-500">Finition :</span>
            <span className="ml-2 font-semibold">{fiche.finition}</span>
          </div>
        )}
        {fiche.annee && (
          <div>
            <span className="text-sm text-gray-500">Année :</span>
            <span className="ml-2 font-semibold">{fiche.annee}</span>
          </div>
        )}
        {fiche.kilometrage && (
          <div>
            <span className="text-sm text-gray-500">Kilométrage :</span>
            <span className="ml-2 font-semibold">{fiche.kilometrage}</span>
          </div>
        )}
        {fiche.energie && (
          <div>
            <span className="text-sm text-gray-500">Énergie :</span>
            <span className="ml-2 font-semibold">{fiche.energie}</span>
          </div>
        )}
        {fiche.prix && (
          <div>
            <span className="text-sm text-gray-500">Prix annoncé :</span>
            <span className="ml-2 font-semibold">{fiche.prix}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RisquesCard({ risques }: { risques: AnalysisResultProps['data']['risques'] }) {
  const niveauColors = {
    faible: 'bg-green-100 text-green-800',
    modéré: 'bg-orange-100 text-orange-800',
    élevé: 'bg-red-100 text-red-800',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">⚠️ Risques détectés</h3>
      {risques.length === 0 ? (
        <p className="text-gray-600">Aucun risque majeur détecté.</p>
      ) : (
        <div className="space-y-4">
          {risques.map((risque, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{risque.type}</h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${niveauColors[risque.niveau]}`}
                >
                  {risque.niveau}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{risque.detail}</p>
              <p className="text-sm text-gray-600 italic">💡 {risque.recommandation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChecklistCard({ checklist }: { checklist: NonNullable<AnalysisResultProps['data']['checklist_inspection']> }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">✅ Checklist d'inspection</h3>

      <div className="space-y-4">
        {/* Mécanique */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">🔧 Mécanique</h4>
          <ul className="space-y-1">
            {checklist.mecanique.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Administratif */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">📄 Administratif</h4>
          <ul className="space-y-1">
            {checklist.administratif.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vendeur */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">❓ Questions au vendeur</h4>
          <ul className="space-y-1">
            {checklist.vendeur.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function AvisCard({ avis }: { avis: AnalysisResultProps['data']['avis_acheteur'] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4">💬 Avis acheteur</h3>

      <p className="text-gray-700 leading-relaxed mb-4">{avis.resume_simple}</p>

      {avis.questions_a_poser.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">❓ Questions à poser :</h4>
          <ul className="space-y-1">
            {avis.questions_a_poser.map((q, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                • {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {avis.points_a_verifier_essai.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">🔍 Points à vérifier à l'essai :</h4>
          <ul className="space-y-1">
            {avis.points_a_verifier_essai.map((p, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                • {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

