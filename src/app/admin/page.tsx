'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type PlausibleStats = {
  visitors: { value: number }
  pageviews: { value: number }
  bounce_rate: { value: number }
  visit_duration: { value: number }
}

type PlausibleEvent = {
  name: string
  visitors: number
  events: number
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<PlausibleStats | null>(null)
  const [events, setEvents] = useState<PlausibleEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'day' | '7d' | '30d' | 'month'>('7d')

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
      fetchStats('7d')
    }
  }, [])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple protection - À remplacer par votre vraie logique
    if (password === 'admin2025') {
      sessionStorage.setItem('admin_authenticated', 'true')
      setIsAuthenticated(true)
      fetchStats('7d')
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    setIsAuthenticated(false)
    setPassword('')
    setStats(null)
    setEvents([])
  }

  const fetchStats = async (selectedPeriod: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/stats?period=${selectedPeriod}`)
      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Erreur lors de la récupération des stats')
      }

      setStats(json.data.stats)
      setEvents(json.data.events)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (newPeriod: 'day' | '7d' | '30d' | 'month') => {
    setPeriod(newPeriod)
    fetchStats(newPeriod)
  }

  // Page de login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="Entrez le mot de passe"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-black text-white py-2 font-semibold hover:opacity-90"
            >
              Se connecter
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Dashboard principal
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:underline text-sm">
              ← Accueil
            </Link>
            <h1 className="text-xl font-bold">Dashboard Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:underline"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Sélecteur de période */}
        <div className="mb-6 flex gap-2">
          {(['day', '7d', '30d', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === p
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === 'day' && 'Aujourd\'hui'}
              {p === '7d' && '7 derniers jours'}
              {p === '30d' && '30 derniers jours'}
              {p === 'month' && 'Ce mois-ci'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              <strong>Erreur :</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-2">
              Vérifiez que PLAUSIBLE_API_KEY est configuré dans Cloudflare Pages
            </p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Stats principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Visiteurs uniques</p>
                <p className="text-3xl font-bold">{stats.visitors.value.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Pages vues</p>
                <p className="text-3xl font-bold">{stats.pageviews.value.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Taux de rebond</p>
                <p className="text-3xl font-bold">{stats.bounce_rate.value}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Durée moyenne</p>
                <p className="text-3xl font-bold">{Math.round(stats.visit_duration.value)}s</p>
              </div>
            </div>

            {/* Events */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Événements personnalisés</h2>
              </div>
              <div className="p-6">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun événement enregistré pour cette période</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-gray-600">
                            {event.visitors} visiteurs • {event.events} occurrences
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {((event.events / stats.visitors.value) * 100).toFixed(1)}% des visiteurs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lien vers Plausible */}
            <div className="mt-6 text-center">
              <a
                href="https://plausible.io/checktonvehicule.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Voir le dashboard complet sur Plausible →
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

