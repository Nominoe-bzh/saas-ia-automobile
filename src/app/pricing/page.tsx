'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://www.checktonvehicule.fr'

type Plan = {
  id: 'single' | 'pack5' | 'pack30'
  name: string
  credits: number
  price: number
  popular?: boolean
  features: string[]
}

const PLANS: Plan[] = [
  {
    id: 'single',
    name: 'Analyse Unique',
    credits: 1,
    price: 5,
    features: [
      '1 analyse IA complète',
      'Rapport PDF téléchargeable',
      'Score sur 100',
      'Checklist d\'inspection',
      'Valable 6 mois',
    ],
  },
  {
    id: 'pack5',
    name: 'Pack 5 Analyses',
    credits: 5,
    price: 15,
    popular: true,
    features: [
      '5 analyses IA complètes',
      'Rapports PDF téléchargeables',
      'Score sur 100',
      'Checklist d\'inspection',
      'Économisez 10 €',
      'Valable 1 an',
    ],
  },
  {
    id: 'pack30',
    name: 'Pack 30 Analyses',
    credits: 30,
    price: 60,
    features: [
      '30 analyses IA complètes',
      'Rapports PDF téléchargeables',
      'Score sur 100',
      'Checklist d\'inspection',
      'Économisez 90 €',
      'Idéal professionnels',
      'Valable 1 an',
    ],
  },
]

export default function PricingPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    if (!email || !email.trim()) {
      setError('Merci de saisir votre email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Email invalide')
      return
    }

    setLoading(planId)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          planType: planId,
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Check Ton Véhicule
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choisissez votre formule
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Analysez vos annonces de véhicules d'occasion en toute confiance
        </p>

        {/* Email input */}
        <div className="max-w-md mx-auto mb-12">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Votre email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            placeholder="vous@exemple.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 text-left">{error}</p>
          )}
        </div>
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
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-2xl text-gray-600">€</span>
                </div>
                <p className="text-sm text-gray-500">
                  {plan.credits} analyse{plan.credits > 1 ? 's' : ''}
                  {plan.credits > 1 && ` (${(plan.price / plan.credits).toFixed(2)}€/analyse)`}
                </p>
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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
                ) : (
                  'Choisir ce plan'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
            Les crédits sont liés à votre adresse email.
          </p>
        </div>
      </section>
    </main>
  )
}

