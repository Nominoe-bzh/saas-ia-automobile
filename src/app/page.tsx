'use client'

declare global {
  interface Window {
    plausible?: (...args: any[]) => void
  }
}

import { useState } from 'react'

export default function Home() {
  // --- Etat formulaire liste d’attente ---
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [typeUser, setTypeUser] = useState('Particulier')
  const [status, setStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')

  // --- Etat démo analyse ---
  const [demoAnnonce, setDemoAnnonce] = useState(
    "Clio 4 - 1.5 dCi 90 ch Zen, 2016, 120 000 km, diesel, CT OK, 8 000 euros, 1ère main, non fumeur, carnet à jour"
  )
  const [demoStatus, setDemoStatus] = useState<'idle' | 'pending' | 'ok' | 'err'>('idle')
  const [demoResult, setDemoResult] = useState<any | null>(null)

  // --- Submit liste d’attente ---
  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, prenom, type_utilisateur: typeUser }),
      })

      if (!res.ok) {
        setStatus('err')
        return
      }

      setStatus('ok')
      setEmail('')
      setPrenom('')
      setTypeUser('Particulier')

      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('Signup', {
          props: {
            source: 'landing',
            role: typeUser,
          },
        })
      }
    } catch (err) {
      console.error(err)
      setStatus('err')
    }
  }

  // --- Lancer une analyse démo ---
  const runDemoAnalyse = async () => {
    setDemoStatus('pending')
    setDemoResult(null)
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annonce: demoAnnonce }),
      })

      const json = await res.json()

      if (!res.ok || !json.ok) {
        console.error(json)
        setDemoStatus('err')
        return
      }

      setDemoResult(json.data)
      setDemoStatus('ok')

      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('DemoAnalyse', {
          props: {
            source: 'landing',
          },
        })
      }
    } catch (err) {
      console.error(err)
      setDemoStatus('err')
    }
  }

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
      </section>

      {/* Features */}
      <section className="px-6 py-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Analyse d’annonce</h3>
          <p className="text-sm text-gray-600 mt-2">
            Détection des incohérences, alertes risques, check points.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Négociation assistée</h3>
          <p className="text-sm text-gray-600 mt-2">
            Arguments chiffrés basés sur le marché et l’historique.
          </p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="font-semibold">Économie potentielle</h3>
          <p className="text-sm text-gray-600 mt-2">
            500–2 000 € économisés en moyenne sur le prix final.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-6 max-w-5xl mx-auto text-center">
        <p className="text-sm text-gray-500">
          Phase pilote en cours — accès prioritaire à l’ouverture.
        </p>
      </section>

      {/* Signup waitlist */}
      <section className="px-6 py-12 max-w-xl mx-auto">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">Rejoindre la liste d’attente</h2>
          <form onSubmit={submitWaitlist} className="mt-6 space-y-4">
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
                Merci. Vérifiez votre boîte mail.
              </p>
            )}
            {status === 'err' && (
              <p className="text-red-700 text-sm text-center">
                Erreur d’envoi. Réessayez.
              </p>
            )}
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            En soumettant, vous acceptez de recevoir un email d’accueil.
          </p>
        </div>
      </section>

      {/* Bloc démo analyse IA */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* Colonne gauche : saisie annonce */}
          <div className="rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-2">Analyse démo d’une annonce</h2>
            <p className="text-sm text-gray-600 mb-4">
              Collez une annonce de voiture d’occasion (Leboncoin, La Centrale, etc.) et lancez une
              analyse IA.
            </p>
            <textarea
              className="w-full min-h-[140px] rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              value={demoAnnonce}
              onChange={(e) => setDemoAnnonce(e.target.value)}
            />
            <button
              onClick={runDemoAnalyse}
              disabled={demoStatus === 'pending'}
              className="mt-4 w-full rounded-md bg-black text-white py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {demoStatus === 'pending' ? 'Analyse en cours…' : 'Lancer une analyse démo'}
            </button>
            {demoStatus === 'err' && (
              <p className="mt-2 text-sm text-red-700">
                Erreur lors de l’analyse. Réessayez dans quelques instants.
              </p>
            )}
          </div>

          {/* Colonne droite : résultat */}
          <div className="rounded-2xl border p-6 bg-gray-50">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Résultat d’analyse</h3>

            {demoStatus === 'idle' && (
              <p className="text-sm text-gray-500">
                Lancez une analyse pour voir la fiche synthétique, les risques détectés et un score
                global sur 100.
              </p>
            )}

            {demoStatus === 'pending' && (
              <p className="text-sm text-gray-600">Analyse IA en cours…</p>
            )}

            {demoStatus === 'ok' && demoResult && (
              <div className="space-y-4 text-sm text-gray-800">
                {/* Fiche véhicule */}
                <div>
                  <h4 className="font-semibold mb-1">Fiche véhicule</h4>
                  <ul className="text-xs md:text-sm space-y-0.5">
                    {demoResult.fiche?.titre && (
                      <li>
                        <span className="font-medium">Titre :</span> {demoResult.fiche.titre}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">Marque / modèle :</span>{' '}
                      {[demoResult.fiche?.marque, demoResult.fiche?.modele]
                        .filter(Boolean)
                        .join(' ')}
                    </li>
                    <li>
                      <span className="font-medium">Motorisation :</span>{' '}
                      {demoResult.fiche?.motorisation || '—'}
                    </li>
                    <li>
                      <span className="font-medium">Année :</span>{' '}
                      {demoResult.fiche?.annee || '—'}
                    </li>
                    <li>
                      <span className="font-medium">Kilométrage :</span>{' '}
                      {demoResult.fiche?.kilometrage || '—'}
                    </li>
                    <li>
                      <span className="font-medium">Prix :</span>{' '}
                      {demoResult.fiche?.prix || '—'}
                    </li>
                    <li>
                      <span className="font-medium">Énergie :</span>{' '}
                      {demoResult.fiche?.energie || '—'}
                    </li>
                    <li>
                      <span className="font-medium">Finition :</span>{' '}
                      {demoResult.fiche?.finition || '—'}
                    </li>
                  </ul>
                </div>

                {/* Score global */}
                <div>
                  <h4 className="font-semibold mb-1">Score global</h4>
                  <p>
                    <span className="font-medium">
                      {demoResult.score_global?.note_sur_100 ?? '—'}/100
                    </span>
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 mt-1">
                    {demoResult.score_global?.resume}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Profil d’achat :{' '}
                    <span className="font-medium">
                      {demoResult.score_global?.profil_achat || '—'}
                    </span>
                  </p>
                </div>

                {/* Risques */}
                <div>
                  <h4 className="font-semibold mb-1">Risques détectés</h4>
                  {demoResult.risques && demoResult.risques.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                      {demoResult.risques.map((r: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-medium">
                            [{r.niveau?.toUpperCase() || '—'}] {r.type || 'risque'}
                            {': '}
                          </span>
                          {r.detail}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Aucun risque identifié.</p>
                  )}
                </div>

                {/* Avis acheteur */}
                <div>
                  <h4 className="font-semibold mb-1">Avis acheteur</h4>
                  <p className="text-xs md:text-sm text-gray-700 mb-1">
                    {demoResult.avis_acheteur?.resume_simple}
                  </p>
                  {demoResult.avis_acheteur?.questions_a_poser && (
                    <div className="mt-2">
                      <p className="font-medium text-xs md:text-sm mb-1">
                        Questions à poser au vendeur :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                        {demoResult.avis_acheteur.questions_a_poser.map(
                          (q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  {demoResult.avis_acheteur?.points_a_verifier_essai && (
                    <div className="mt-2">
                      <p className="font-medium text-xs md:text-sm mb-1">
                        Points à vérifier à l’essai :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                        {demoResult.avis_acheteur.points_a_verifier_essai.map(
                          (p: string, idx: number) => (
                            <li key={idx}>{p}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Check Ton Véhicule — Tous droits réservés.
      </footer>
    </main>
  )
}
