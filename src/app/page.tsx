'use client'

import { useState } from 'react'
import type React from 'react'
import Link from 'next/link'

export default function Home() {
  // --- Etat formulaire liste d’attente ---
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [typeUser, setTypeUser] = useState('Particulier')
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')

  // --- Etat démo analyse IA ---
  const [demoEmail, setDemoEmail] = useState('')
  const [demoAnnonce, setDemoAnnonce] = useState('')
  const [demoStatus, setDemoStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')
  const [demoResult, setDemoResult] = useState<any | null>(null)
  const [demoAnalysisId, setDemoAnalysisId] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  // ============ Formulaire liste d’attente ============
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('pending')

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          prenom,
          type_utilisateur: typeUser,
        }),
      })

      if (!res.ok) {
        setStatus('err')
        return
      }

      setStatus('ok')
      setEmail('')
      setPrenom('')
      setTypeUser('Particulier')

      // Event d’inscription pour Plausible
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('Signup', {
          props: {
            source: 'landing',
            role: typeUser,
          },
        })
      }
    } catch {
      setStatus('err')
    }
  }

  // ============ Démo analyse IA ============
  const handleDemoAnalyse = async () => {
    if (!demoAnnonce.trim()) {
      setDemoError("Merci de coller une annonce ou une description avant de lancer l'analyse.")
      setDemoStatus('err')
      return
    }

    // Track: Démarrage analyse
    if (typeof window !== 'undefined' && (window as any).plausible) {
      ;(window as any).plausible('Demo_Analyse_Started', {
        props: {
          hasEmail: !!demoEmail,
          annonceLength: demoAnnonce.length,
        },
      })
    }

    setDemoStatus('pending')
    setDemoError(null)
    setDemoResult(null)
    setDemoAnalysisId(null)

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonce: demoAnnonce,
          email: demoEmail || null,
        }),
      })

      let json: any = null
      try {
        json = await res.json()
      } catch {
        // Réponse non JSON
      }

      if (!res.ok || !json || json.ok === false) {
        const msg =
          json?.error ||
          (res.status === 429
            ? "Trop de requetes d'analyse pour le moment. Reessaie dans quelques minutes."
            : `Erreur technique cote serveur (code ${res.status}). Reessaie plus tard.`)

        setDemoError(msg)
        setDemoStatus('err')
        
        // Track: Erreur analyse
        if (typeof window !== 'undefined' && (window as any).plausible) {
          ;(window as any).plausible('Demo_Analyse_Error', {
            props: {
              errorType: res.status === 429 ? 'quota_exceeded' : 'server_error',
              statusCode: res.status,
            },
          })
        }
        
        return
      }

      // Compatibilité : /api/analyse peut renvoyer { data: ... } ou { analyse: ... }
      const analyse = json.data || json.analyse || null
      const analysisId = json.analysisId || null
      
      console.log('📊 Response from /api/analyse:', { 
        hasAnalyse: !!analyse, 
        analysisId, 
        responseKeys: Object.keys(json) 
      })
      
      if (!analyse) {
        setDemoError("La reponse de l'IA est vide ou invalide. Reessaie avec une autre annonce.")
        setDemoStatus('err')
        return
      }

      setDemoResult(analyse)
      setDemoAnalysisId(analysisId)
      setDemoStatus('ok')
      
      // Track: Succès analyse
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('Demo_Analyse_Success', {
          props: {
            hasEmail: !!demoEmail,
            score: analyse.score_global?.note_sur_100 || 0,
            profilAchat: analyse.score_global?.profil_achat || 'unknown',
            nbRisques: Array.isArray(analyse.risques) ? analyse.risques.length : 0,
          },
        })
      }
    } catch {
      setDemoError(
        "Impossible de joindre le serveur. Verifie ta connexion Internet et reessaie dans quelques instants."
      )
      setDemoStatus('err')
      
      // Track: Erreur réseau
      if (typeof window !== 'undefined' && (window as any).plausible) {
        ;(window as any).plausible('Demo_Analyse_Error', {
          props: {
            errorType: 'network_error',
          },
        })
      }
    }
  }

  // Helpers d’affichage pour la démo
  const fiche = demoResult?.fiche || {}
  const risques: any[] = Array.isArray(demoResult?.risques) ? demoResult.risques : []
  const scoreObj = demoResult?.score_global || {}
  const avis = demoResult?.avis_acheteur || demoResult?.avis || {}

  const note =
    typeof scoreObj === 'number'
      ? scoreObj
      : typeof scoreObj?.note_sur_100 === 'number'
      ? scoreObj.note_sur_100
      : null

  const recommendation =
    avis?.resume_simple ||
    avis?.resume ||
    (demoResult ? 'Analyse disponible ci-dessous.' : '')

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="px-6 py-20 md:py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Check Ton Véhicule
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600">
          L’assistant IA qui sécurise l’achat de votre voiture d’occasion.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Analyse d’annonce, détection de risques, aide à la négociation — objectif&nbsp;:
          économiser 500 à 2 000&nbsp;€ sur le prix final.
        </p>
      </section>

      {/* Features */}
      <section className="px-6 py-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Analyse d’annonce</h3>
          <p className="text-sm text-gray-600 mt-2">
            L’IA repère les incohérences, oublis suspects, signaux rouges.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Négociation assistée</h3>
          <p className="text-sm text-gray-600 mt-2">
            Arguments chiffrés basés sur le marché, l’historique et les risques détectés.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Économie potentielle</h3>
          <p className="text-sm text-gray-600 mt-2">
            500–2 000&nbsp;€ économisés en moyenne en évitant les “mauvaises affaires”.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-6 max-w-5xl mx-auto text-center">
        <p className="text-sm text-gray-500">
          Phase pilote en cours — accès prioritaire à l’ouverture &amp; 3 analyses offertes.
        </p>
      </section>

      {/* Signup + Démo en grille */}
      <section className="px-6 pb-16 max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
        {/* Bloc liste d’attente */}
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">
            Rejoindre la liste d’attente
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Recevez 3 analyses gratuites dès l’ouverture pour tester l’outil sur vos vraies annonces.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">Prénom</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Vous êtes</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                value={typeUser}
                onChange={(e) => setTypeUser(e.target.value)}
              >
                <option>Particulier</option>
                <option>Pro</option>
                <option>Concessionnaire</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={status === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {status === 'pending' ? 'Envoi…' : 'Je m’inscris'}
            </button>

            {status === 'ok' && (
              <p className="text-green-700 text-sm text-center">
                Merci. Vérifiez votre boîte mail (et le spam).
              </p>
            )}
            {status === 'err' && (
              <p className="text-red-700 text-sm text-center">
                Erreur d’envoi. Réessayez dans quelques instants.
              </p>
            )}
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            En soumettant, vous acceptez de recevoir un email d’accueil.
          </p>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Déjà utilisé l’outil ?{' '}
            <a href="/mon-espace" className="underline">
              Accéder à mon historique d’analyses
            </a>
          </p>
        </div>

        {/* Bloc démo analyse IA */}
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">
            Tester une analyse d'annonce (démo)
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Collez une annonce Le Bon Coin, La Centrale, ou décrivez simplement le véhicule.
          </p>
          <p className="mt-1 text-xs text-gray-500 text-center">
            3 analyses gratuites par email •{' '}
            <Link href="/pricing" className="text-blue-600 hover:underline font-medium">
              Voir les formules payantes
            </Link>
          </p>

          <div className="mt-4 space-y-3">
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black min-h-[120px]"
              placeholder="Exemple : Clio 4 - 1.5 dCi 90 ch Zen, 2016, 120 000 km, diesel, CT OK, 8 000 €, 1ère main, non fumeur, carnet à jour…"
              value={demoAnnonce}
              onChange={(e) => setDemoAnnonce(e.target.value)}
            />

            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ton email (optionnel, pour recevoir le rapport)"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
            />

            <button
              type="button"
              onClick={handleDemoAnalyse}
              disabled={demoStatus === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60 mt-1"
            >
              {demoStatus === 'pending' ? 'Analyse en cours…' : 'Analyser avec l’IA'}
            </button>

            {demoStatus === 'pending' && !demoError && (
              <p className="mt-2 text-sm text-gray-500">
                L’IA analyse ton annonce… Cela prend quelques secondes.
              </p>
            )}

            {demoError && (
              <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                <p className="mb-2">{demoError}</p>
                {demoError.includes('QUOTA_EXCEEDED') || demoError.toLowerCase().includes('limite') ? (
                  <Link
                    href="/pricing"
                    className="inline-block mt-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90"
                  >
                    Voir les formules payantes
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          {/* Résultat de l'analyse */}
          {demoStatus === 'ok' && demoResult && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Analyse terminée</h3>
              
              {/* Score */}
              {note !== null && (
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Score global</span>
                    <span className={`text-2xl font-bold ${
                      note >= 75 ? 'text-green-600' : note >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {note}/100
                    </span>
                  </div>
                  {scoreObj.profil_achat && (
                    <p className="mt-2 text-sm text-gray-600">
                      Profil : <span className="font-semibold">{scoreObj.profil_achat}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Recommandation */}
              {recommendation && (
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              )}

              {/* Risques */}
              {risques.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Risques détectés ({risques.length})
                  </h4>
                  <ul className="space-y-2">
                    {risques.slice(0, 3).map((risque: any, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          risque.niveau === 'élevé' ? 'bg-red-500' :
                          risque.niveau === 'modéré' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></span>
                        <span><strong>{risque.type}</strong> : {risque.detail}</span>
                      </li>
                    ))}
                    {risques.length > 3 && (
                      <li className="text-sm text-gray-500 italic">
                        + {risques.length - 3} autre{risques.length - 3 > 1 ? 's' : ''} risque{risques.length - 3 > 1 ? 's' : ''}...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {demoAnalysisId && (
                  <>
                    <Link
                      href={`/rapport?id=${demoAnalysisId}${demoEmail ? `&email=${encodeURIComponent(demoEmail)}` : ''}`}
                      className="block w-full text-center px-4 py-2 bg-black text-white rounded-lg font-semibold hover:opacity-90"
                    >
                      📄 Voir le rapport complet
                    </Link>
                    <a
                      href={`/rapport/print?id=${demoAnalysisId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-white text-black border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      📥 Télécharger PDF
                    </a>
                  </>
                )}
                {demoEmail && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Un email avec le rapport complet a été envoyé à <strong>{demoEmail}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-xs text-gray-500 border-t">
        © {new Date().getFullYear()} Check Ton Véhicule — Tous droits réservés.
      </footer>
    </main>
  )
}
