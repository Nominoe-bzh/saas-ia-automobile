'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Composant interne qui contient toute la logique
function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordMode, setShowPasswordMode] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const searchParams = useSearchParams()
  const nextUrl = searchParams?.get('next') || '/dashboard'

  const supabase = createClient()

  // Gérer la connexion Magic Link (priorité)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Veuillez entrer votre email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setStatus('error')
      setMessage('Email invalide')
      return
    }

    setStatus('pending')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${nextUrl}`,
        },
      })

      if (error) throw error

      setStatus('success')
      setMessage('✅ Un lien magique a été envoyé à votre email ! Cliquez sur le lien pour vous connecter.')
    } catch (error: any) {
      console.error('[Login] Magic link error:', error)
      setStatus('error')
      setMessage(error.message || 'Erreur lors de l\'envoi du lien magique')
    }
  }

  // Gérer la connexion par mot de passe (secondaire)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setStatus('success')
      setMessage('Connexion réussie ! Redirection...')
      
      // Rediriger intelligemment
      setTimeout(() => {
        window.location.href = nextUrl
      }, 1000)
    } catch (error: any) {
      console.error('[Login] Password login error:', error)
      setStatus('error')
      setMessage(error.message || 'Email ou mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check Ton Véhicule
          </h1>
          <p className="text-gray-600">
            Connexion rapide sans mot de passe
          </p>
          {nextUrl !== '/dashboard' && (
            <p className="text-sm text-blue-600 mt-2">
              Connectez-vous pour continuer votre achat
            </p>
          )}
        </div>

        {/* Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{message}</p>
          </div>
        )}

        {/* Mode Magic Link (Par défaut) */}
        {!showPasswordMode ? (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Votre email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setStatus('idle')
                    setMessage('')
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre@email.com"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={status === 'pending'}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {status === 'pending' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    ✨ Recevoir un lien magique
                  </>
                )}
              </button>
            </form>

            {/* Infos Magic Link */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-700">
                <strong>Comment ça marche ?</strong><br />
                Vous recevrez un email avec un lien de connexion sécurisé. Cliquez dessus pour vous connecter instantanément, sans mot de passe !
              </p>
            </div>

            {/* Séparateur */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>
            </div>

            {/* Lien vers mode mot de passe */}
            <button
              type="button"
              onClick={() => setShowPasswordMode(true)}
              className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Se connecter avec un mot de passe →
            </button>
          </>
        ) : (
          <>
            {/* Mode Mot de passe (Secondaire) */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email-password" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="email-password"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'pending'}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'pending' ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            {/* Retour vers Magic Link */}
            <button
              type="button"
              onClick={() => {
                setShowPasswordMode(false)
                setPassword('')
                setStatus('idle')
                setMessage('')
              }}
              className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour à la connexion par email magique
            </button>
          </>
        )}

        {/* Retour accueil */}
        <div className="mt-8 pt-6 border-t text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

// Composant principal avec Suspense boundary
export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🚗</div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
