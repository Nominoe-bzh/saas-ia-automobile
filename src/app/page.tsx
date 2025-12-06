'use client'

import { useState } from 'react'
import type React from 'react'

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
      if (!analyse) {
        setDemoError("La reponse de l'IA est vide ou invalide. Reessaie avec une autre annonce.")
        setDemoStatus('err')
        return
      }

      setDemoResult(analyse)
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
            Tester une analyse d’annonce (démo)
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Collez une annonce Le Bon Coin, La Centrale, ou décrivez simplement le véhicule.
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
                {demoError}
              </div>
            )}
          </div>

          {/* Résultat de l’analyse */}
          {demoStatus === 'ok' && demoResult && (
            <div className="mt-6 space-y-4 text-sm">
              {/* Synthèse */}
              <div>
                <h3 className="font-semibold mb-1">Synthèse rapide</h3>
                <p className="text-gray-700">
                  {recommendation || 'Analyse disponible ci-dessous.'}
                </p>
              </div>

              {/* Fiche véhicule */}
              <div className="rounded-lg border px-3 py-2">
                <h4 className="font-semibold mb-1">Fiche véhicule (extrait)</h4>
                <p className="text-gray-700">
                  {[fiche.marque, fiche.modele, fiche.version || fiche.finition]
                    .filter(Boolean)
                    .join(' ')}
                </p>
                <p className="text-gray-500">
                  {[fiche.annee, fiche.kilometrage, fiche.energie, fiche.prix]
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
                      <h4 className="font-semibold mb-1">
                        Questions à poser au vendeur
                      </h4>
                      <ul className="list-disc pl-4 text-gray-700">
                        {avis.questions_a_poser
                          .slice(0, 5)
                          .map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(avis.points_a_verifier_essai) && (
                    <div>
                      <h4 className="font-semibold mb-1">
                        Points à vérifier à l’essai
                      </h4>
                        <ul className="list-disc pl-4 text-gray-700">
                          {avis.points_a_verifier_essai
                            .slice(0, 5)
                            .map((p: string, idx: number) => (
                              <li key={idx}>{p}</li>
                            ))}
                        </ul>
                    </div>
                  )}
                </div>
              )}
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
