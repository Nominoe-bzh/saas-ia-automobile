'use client'

import { useState } from 'react'

type WaitlistStatus = 'idle' | 'pending' | 'ok' | 'err'
type AnalyseStatus = 'idle' | 'pending' | 'ok' | 'err'

export default function Home() {
  // --- Etat formulaire liste d’attente ---
  const [email, setEmail] = useState('')
  const [prenom, setPrenom] = useState('')
  const [typeUser, setTypeUser] = useState('Particulier')
  const [status, setStatus] = useState<WaitlistStatus>('idle')

  // --- Etat test d’analyse ---
  const [annonceTest, setAnnonceTest] = useState('')
  const [analyseStatus, setAnalyseStatus] = useState<AnalyseStatus>('idle')
  const [analyseData, setAnalyseData] = useState<any | null>(null)
  const [analyseError, setAnalyseError] = useState<string | null>(null)

  // ------- Soumission liste d’attente (/api/join) -------
  const submitWaitlist = async (e: React.FormEvent) => {
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

        setTypeUser('Particulier')

      if (typeof window !== 'undefined') {
        const plausibleFn = (window as any).plausible as
          | ((eventName: string, options?: any) => void)
          | undefined

        plausibleFn?.('Signup', {
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

  // ------- Soumission test d’analyse (/api/analyse) -------
  const submitAnalyse = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalyseStatus('pending')
    setAnalyseError(null)
    setAnalyseData(null)

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annonce: annonceTest }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.ok) {
        setAnalyseStatus('err')
        setAnalyseError(json?.error ?? 'Erreur lors de l’analyse')
        return
      }

      setAnalyseStatus('ok')
      setAnalyseData(json.analyse)
    } catch (err: any) {
      setAnalyseStatus('err')
      setAnalyseError(err?.message ?? 'Erreur réseau')
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
            Arguments chiffrés basés sur marché et historique.
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

      {/* Signup liste d’attente */}
      <section className="px-6 py-12 max-w-xl mx-auto">
        <div className="rounded-2xl border p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-center">
            Rejoindre la liste d’attente
          </h2>
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

      {/* Bloc test d’analyse (mode démo) */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-center">
            Tester une analyse (démo)
          </h2>
          <p className="text-xs text-gray-500 text-center mt-1">
            Pour le moment, l’analyse est générée en mode démonstration (fallback),
            le temps d’activer le budget IA OpenAI.
          </p>

          <form onSubmit={submitAnalyse} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Collez ici une annonce de voiture d’occasion
              </label>
              <textarea
                className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black min-h-[120px]"
                value={annonceTest}
                onChange={(e) => setAnnonceTest(e.target.value)}
                placeholder="Ex : Clio 4 - 1.5 dCi 90 ch Zen, 2016, 120 000 km, diesel, CT OK, 8 000 €..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={analyseStatus === 'pending'}
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {analyseStatus === 'pending'
                ? 'Analyse en cours…'
                : 'Lancer une analyse (démo)'}
            </button>
          </form>

          {/* Affichage des résultats */}
          <div className="mt-6">
            {analyseStatus === 'err' && (
              <p className="text-sm text-red-700 text-center">
                {analyseError ?? 'Erreur lors de l’analyse.'}
              </p>
            )}

            {analyseStatus === 'ok' && analyseData && (
              <div className="space-y-4 text-sm text-left">
                <div className="rounded-xl border bg-white p-4">
                  <h3 className="font-semibold">Score & avis</h3>
                  <p className="mt-1">
                    <span className="font-medium">Score global :</span>{' '}
                    {analyseData.score_global}/100
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Recommandation :</span>{' '}
                    {analyseData.avis?.recommandation}
                  </p>
                  <p className="mt-1 text-gray-700">
                    {analyseData.avis?.resume}
                  </p>
                </div>

                {Array.isArray(analyseData.risques) &&
                  analyseData.risques.length > 0 && (
                    <div className="rounded-xl border bg-white p-4">
                      <h3 className="font-semibold">Principaux risques</h3>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        {analyseData.risques.map((r: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-medium">
                              [{r.niveau.toUpperCase()}] {r.type} :
                            </span>{' '}
                            {r.detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <details className="rounded-xl border bg-white p-4">
                  <summary className="cursor-pointer font-semibold">
                    Voir le JSON complet (debug)
                  </summary>
                  <pre className="mt-2 text-xs overflow-x-auto">
                    {JSON.stringify(analyseData, null, 2)}
                  </pre>
                </details>
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
