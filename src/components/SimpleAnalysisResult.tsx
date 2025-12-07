// src/components/SimpleAnalysisResult.tsx
// Affichage simplifié pour l'ancien format (rétrocompatibilité)

'use client'

type SimpleAnalysisResultProps = {
  data: any
}

export default function SimpleAnalysisResult({ data }: SimpleAnalysisResultProps) {
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


