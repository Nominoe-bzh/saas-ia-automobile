'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type UserOverview = {
  ok: boolean
  user: {
    id: string
    email: string
  }
  credits: {
    remaining: number | null
    consumed: number
    planType: string
    isUnlimited: boolean
    validUntil: string | null
    status: string
  }
  subscription: {
    id: string
    isValid: boolean
    createdAt: string
    updatedAt: string
  }
  history: {
    analyses: Array<{
      id: string
      email: string
      car_model: string
      year: number
      created_at: string
    }>
    payments: Array<{
      id: string
      plan_type: string
      amount_cents: number
      currency: string
      status: string
      credits: number | null
      created_at: string
    }>
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<UserOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // Vérifier l'authentification
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/login'
          return
        }

        // Récupérer les données via l'API
        const res = await fetch('/api/user/overview', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!res.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }

        const result = await res.json()
        if (result.ok) {
          setData(result)
        } else {
          setError(result.message || 'Erreur inconnue')
        }
      } catch (err: any) {
        console.error('[Dashboard] Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-900 mb-6">{error || 'Impossible de charger vos données'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'eur',
    })
  }

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = {
      FREE: 'Gratuit',
      SINGLE: 'Analyse Unique',
      PACK: 'Pack 5 Analyses',
      UNLIMITED: 'Pack Illimité',
    }
    return labels[planType] || planType
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord
          </h1>
          <p className="text-gray-900">
            Bienvenue {data.user.email}
          </p>
        </div>

        {/* Section 1 : Mon Solde */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">💎 Mon Solde</h2>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {getPlanLabel(data.credits.planType)}
            </span>
          </div>

          <div className="mb-6">
            {data.credits.isUnlimited ? (
              <>
                <div className="text-5xl font-bold mb-2">∞</div>
                <p className="text-blue-100">Analyses illimitées</p>
                {data.credits.validUntil && (
                  <p className="text-sm text-blue-100 mt-2">
                    Valide jusqu'au {formatDate(data.credits.validUntil)}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl font-bold mb-2">
                  {data.credits.remaining ?? 0}
                </div>
                <p className="text-blue-100">
                  Crédit{(data.credits.remaining ?? 0) > 1 ? 's' : ''} restant{(data.credits.remaining ?? 0) > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-100 mt-2">
                  {data.credits.consumed} consommé{data.credits.consumed > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Recharger
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              Nouvelle analyse
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section 2 : Mes Analyses */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                🚗 Mes Analyses
              </h2>
              <span className="text-sm text-gray-500">
                {data.history.analyses.length} analyse{data.history.analyses.length > 1 ? 's' : ''}
              </span>
            </div>

            {data.history.analyses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-gray-900 mb-4">Aucune analyse pour le moment</p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Créer ma première analyse
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.history.analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {analysis.car_model || 'Véhicule'}
                        </h3>
                        <p className="text-sm text-gray-900">
                          Année {analysis.year || 'Non spécifiée'}
                        </p>
                      </div>
                      <Link
                        href={`/rapport?id=${analysis.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Voir →
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(analysis.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3 : Mes Factures */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                💳 Mes Factures
              </h2>
              <span className="text-sm text-gray-500">
                {data.history.payments.length} paiement{data.history.payments.length > 1 ? 's' : ''}
              </span>
            </div>

            {data.history.payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💰</div>
                <p className="text-gray-900 mb-4">Aucun paiement enregistré</p>
                <Link
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Voir les tarifs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.history.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {getPlanLabel(payment.plan_type)}
                        </h3>
                        <p className="text-sm text-gray-900">
                          {payment.credits !== null 
                            ? `${payment.credits} crédit${payment.credits > 1 ? 's' : ''}`
                            : 'Illimité'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatPrice(payment.amount_cents)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'succeeded' 
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status === 'succeeded' ? '✓ Payé' : payment.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

