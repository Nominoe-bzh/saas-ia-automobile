'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type UserOverview = {
  credits: {
    remaining: number | null
    planType: string
    isUnlimited: boolean
  }
  user: {
    email: string
  }
}

export default function Header() {
  const [overview, setOverview] = useState<UserOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)

        // Appeler l'API pour récupérer les données utilisateur
        const res = await fetch('/api/user/overview', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          if (data.ok) {
            setOverview(data)
          }
        }
      } catch (error) {
        console.error('[Header] Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setOverview(null)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🚗</span>
          <span className="font-bold text-lg hidden sm:inline-block">
            Check Ton Véhicule
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-4">
          {/* Badge Crédits */}
          {isAuthenticated && overview && (
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <span className="text-lg">💎</span>
              {overview.credits.isUnlimited ? (
                <span className="text-sm font-semibold text-blue-700">Illimité</span>
              ) : (
                <span className="text-sm font-semibold text-blue-700">
                  {overview.credits.remaining ?? 0} Crédit{(overview.credits.remaining ?? 0) > 1 ? 's' : ''}
                </span>
              )}
            </Link>
          )}

          {/* Liens principaux */}
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-block"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-block"
              >
                Tarifs
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-block"
              >
                Tarifs
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connexion
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

