'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://www.checktonvehicule.fr'

function PrintContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID d\'analyse manquant.')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        console.log('[PDF Print] Fetching report with ID:', id)
        console.log('[PDF Print] API URL:', `${API_BASE}/api/rapport?id=${encodeURIComponent(id)}`)
        
        const res = await fetch(`${API_BASE}/api/rapport?id=${encodeURIComponent(id)}`)
        console.log('[PDF Print] Response status:', res.status)
        
        const json = await res.json()
        console.log('[PDF Print] Response JSON:', json)
        console.log('[PDF Print] json.ok:', json.ok)
        console.log('[PDF Print] json.data:', json.data)
        
        if (!res.ok || !json.ok) {
          throw new Error(json.message || 'Rapport introuvable')
        }
        
        if (!json.data) {
          throw new Error('Données du rapport manquantes')
        }
        
        console.log('[PDF Print] Data structure:', {
          hasFiche: !!json.data.fiche,
          hasScore: !!json.data.score_global,
          hasRisques: !!json.data.risques,
          hasPrix: !!json.data.prix_cible,
          hasChecklist: !!json.data.checklist_inspection,
          hasAvis: !!json.data.avis_acheteur,
          ficheMarque: json.data.fiche?.marque,
          scoreNote: json.data.score_global?.note_sur_100
        })
        
        console.log('[PDF Print] Full data object:', JSON.stringify(json.data, null, 2))
        
        setData(json.data)
        setLoading(false)

        // Auto-print après chargement
        setTimeout(() => {
          window.print()
        }, 500)
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement')
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error || 'Rapport introuvable'}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  const fiche = data.fiche || {}
  const score = data.score_global || {}
  const risques = Array.isArray(data.risques) ? data.risques : []
  const prixCible = data.prix_cible || null
  const checklist = data.checklist_inspection || null
  const avis = data.avis_acheteur || {}

  const formatPrice = (value: number | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="bg-white min-h-screen">
        {/* Bouton d'impression (masqué à l'impression) */}
        <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow-lg hover:opacity-90"
          >
            📄 Imprimer / Telecharger PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow-lg hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>

        {/* Contenu du rapport */}
        <div className="max-w-4xl mx-auto p-8">
          {/* Page de garde */}
          <div className="text-center mb-12 pb-12 border-b-2 border-gray-300">
            <h1 className="text-4xl font-bold mb-4">Check Ton Vehicule</h1>
            <p className="text-xl text-gray-600 mb-6">Rapport d'Analyse Expert</p>
            <div className="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-lg font-semibold mb-2">
                {[fiche.marque, fiche.modele, fiche.finition || fiche.version].filter(Boolean).join(' ')}
              </p>
              <p className="text-gray-600">
                {[fiche.annee, fiche.kilometrage, fiche.energie].filter(Boolean).join(' • ')}
              </p>
              {fiche.prix && <p className="text-xl font-bold mt-3">{fiche.prix}</p>}
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Date : {new Date().toLocaleDateString('fr-FR')}
            </p>
            {id && <p className="text-xs text-gray-400 mt-1">Ref: {id.slice(0, 8)}</p>}
          </div>

          {/* Verdict global */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-black">Verdict Global</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Score :</span>
                <span className="text-3xl font-bold">{score.note_sur_100 || 'N/A'} / 100</span>
              </div>
              {score.resume && (
                <p className="text-gray-700 mb-3">{score.resume}</p>
              )}
              {score.profil_achat && (
                <div className="inline-block px-4 py-2 bg-black text-white rounded-lg font-semibold">
                  {score.profil_achat === 'a_acheter' && '✅ À acheter'}
                  {score.profil_achat === 'a_negocier' && '⚠️ À négocier'}
                  {score.profil_achat === 'a_fuir' && '❌ À fuir'}
                </div>
              )}
            </div>
          </section>

          {/* Analyse de prix */}
          {prixCible && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-black">Analyse de Prix</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Prix annonce</p>
                  <p className="text-2xl font-bold">{formatPrice(prixCible.prix_annonce)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-600">
                  <p className="text-sm text-gray-600 mb-1">Prix cible IA</p>
                  <p className="text-2xl font-bold text-green-700">{formatPrice(prixCible.estimation)}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">Fourchette de marché :</p>
                <p className="text-gray-700">
                  {formatPrice(prixCible.fourchette_basse)} - {formatPrice(prixCible.fourchette_haute)}
                </p>
              </div>
              {prixCible.justification && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">💡 Analyse :</p>
                  <p className="text-gray-700">{prixCible.justification}</p>
                </div>
              )}
              {prixCible.ecart_annonce && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-semibold mb-2">📊 Écart avec le marché :</p>
                  <p className="text-gray-700">
                    <span className="font-bold">{formatPrice(Math.abs(prixCible.ecart_annonce))}</span>
                    {prixCible.ecart_annonce > 0 ? ' au-dessus' : ' en-dessous'} du prix cible
                    {prixCible.ecart_pourcentage && (
                      <span> ({Math.abs(prixCible.ecart_pourcentage).toFixed(1)} %)</span>
                    )}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Risques détectés */}
          {risques.length > 0 && (
            <section className="mb-10 page-break">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-black">Risques Detectes</h2>
              <div className="space-y-4">
                {risques.map((risque: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{risque.type || 'Risque'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        risque.niveau === 'eleve' ? 'bg-red-600 text-white' :
                        risque.niveau === 'modere' ? 'bg-orange-500 text-white' :
                        'bg-yellow-400 text-black'
                      }`}>
                        {risque.niveau || 'N/A'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{risque.detail}</p>
                    {risque.recommandation && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-sm font-semibold mb-1">👉 Recommandation :</p>
                        <p className="text-sm text-gray-700">{risque.recommandation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Checklist d'inspection */}
          {checklist && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-black">Checklist d'Inspection</h2>
              
              {checklist.mecanique && checklist.mecanique.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    🔧 Mecanique
                  </h3>
                  <ul className="space-y-2">
                    {checklist.mecanique.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <span className="text-green-600 font-bold">☐</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checklist.administratif && checklist.administratif.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    📄 Administratif
                  </h3>
                  <ul className="space-y-2">
                    {checklist.administratif.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <span className="text-green-600 font-bold">☐</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checklist.vendeur && checklist.vendeur.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    💬 Questions au vendeur
                  </h3>
                  <ul className="space-y-2">
                    {checklist.vendeur.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <span className="text-blue-600 font-bold">?</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Avis final */}
          {avis && (
            <section className="mb-10 page-break">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-black">Avis Expert</h2>
              {avis.resume_simple && (
                <div className="bg-blue-50 p-6 rounded-lg mb-4">
                  <p className="text-lg leading-relaxed">{avis.resume_simple}</p>
                </div>
              )}
              
              {avis.questions_a_poser && avis.questions_a_poser.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Questions a poser :</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {avis.questions_a_poser.map((q: string, idx: number) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {avis.points_a_verifier_essai && avis.points_a_verifier_essai.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2">Points a verifier a l'essai :</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {avis.points_a_verifier_essai.map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
            <p className="mb-2">
              Rapport genere par <strong>Check Ton Vehicule</strong>
            </p>
            <p className="text-xs">
              www.checktonvehicule.fr • L'IA qui securise vos decisions automobiles
            </p>
            <p className="text-xs mt-2 text-gray-400">
              Ce rapport est base sur l'analyse IA de l'annonce fournie. Il ne remplace pas une inspection mecanique professionnelle.
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Initialisation...</p>
      </div>
    }>
      <PrintContent />
    </Suspense>
  )
}

