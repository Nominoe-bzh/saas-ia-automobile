'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://www.checktonvehicule.fr'

type Plan = {
  id: 'SINGLE' | 'PACK' | 'UNLIMITED'
  name: string
  description: string
  price: number
  popular?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'SINGLE',
    name: 'Analyse Unique',
    description: '1 analyse IA complète',
    price: 4.9,
    features: [
      '1 analyse IA complète',
      'Rapport PDF téléchargeable',
      'Score sur 100',
      'Checklist d\'inspection',
      'Crédit sans expiration',
    ],
  },
  {
    id: 'PACK',
    name: 'Pack 5 Analyses',
    description: '5 analyses IA complètes',
    price: 14.9,
    popular: true,
    features: [
      '5 analyses IA complètes',
      'Rapports PDF téléchargeables',
      'Score sur 100',
      'Checklist d\'inspection',
      'Économisez 9,60 € (vs 5×Single)',
      'Valable 1 an',
    ],
  },
  {
    id: 'UNLIMITED',
    name: 'Pack Illimité',
    description: 'Analyses illimitées pendant 30 jours',
    price: 59,
    features: [
      'Analyses IA illimitées',
      'Rapports PDF téléchargeables',
      'Score sur 100',
      'Checklist d\'inspection',
      'Idéal pour professionnels',
      'Valable 30 jours',
    ],
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const supabase = createClient()

  // Vérifier l'authentification au chargement
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setIsAuthenticated(true)
          setUserEmail(session.user.email || null)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('[Pricing] Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleSelectPlan = async (planId: string) => {
    // SÉCURITÉ : Vérifier l'authentification AVANT de permettre l'achat
    if (!isAuthenticated || !userEmail) {
      // Stocker le plan sélectionné et rediriger vers login
      sessionStorage.setItem('intended_plan', planId)
      window.location.href = `/login?next=/pricing`
      return
    }

    setLoading(planId)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          planType: planId,
          userId: session.user.id, // IMPORTANT: Passer le userId
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'Erreur lors de la création de la session de paiement')
      }

      // Redirection vers Stripe Checkout
      window.location.href = json.checkoutUrl
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      setLoading(null)
    }
  }

  // Pendant la vérification de l'authentification
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Check Ton Véhicule
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && userEmail && (
              <div className="text-sm text-gray-600 hidden sm:inline-block">
                {userEmail}
              </div>
            )}
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Choisissez votre formule</h1>
        <p className="text-xl text-gray-600 mb-8">
          Analysez vos annonces de véhicules d'occasion en toute confiance
        </p>

        {/* Message d'authentification */}
        {!isAuthenticated && (
          <div className="max-w-md mx-auto mb-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🔐 Connexion requise</strong><br />
              Vous devez être connecté pour acheter un pack. Cliquez sur "Choisir ce plan" et vous serez redirigé vers la connexion.
            </p>
          </div>
        )}

        {isAuthenticated && userEmail && (
          <div className="max-w-md mx-auto mb-12 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ <strong>Connecté en tant que :</strong> {userEmail}
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </section>

      {/* Plans */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-8 shadow-sm hover:shadow-xl transition-shadow ${
                plan.popular ? 'border-black' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Plus populaire
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold">{plan.price.toLocaleString('fr-FR')}</span>
                  <span className="text-2xl text-gray-600">€</span>
                </div>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-black text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Redirection...
                  </span>
                ) : isAuthenticated ? (
                  'Choisir ce plan'
                ) : (
                  'Se connecter et acheter'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Paiement sécurisé via Stripe
          </h4>
          <p className="text-sm text-gray-700">
            Vos crédits sont activés immédiatement après paiement. Vous recevrez une confirmation par email.
            {isAuthenticated && ' Les crédits sont liés à votre compte.'}
          </p>
        </div>
      </section>
    </main>
  )
}
