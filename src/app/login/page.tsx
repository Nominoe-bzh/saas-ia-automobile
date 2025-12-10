'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')
    setMessage('')

    try {
      if (mode === 'signup') {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (error) throw error

        setStatus('success')
        setMessage('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
      } else {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setStatus('success')
        setMessage('Connexion réussie ! Redirection...')
        
        // Rediriger vers le dashboard
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error: any) {
      console.error('[Login] Error:', error)
      setStatus('error')
      setMessage(error.message || 'Une erreur est survenue')
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setStatus('error')
      setMessage('Veuillez entrer votre email')
      return
    }

    setStatus('pending')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      setStatus('success')
      setMessage('Un lien magique a été envoyé à votre email ! Vérifiez votre boîte de réception.')
    } catch (error: any) {
      console.error('[Login] Magic link error:', error)
      setStatus('error')
      setMessage(error.message || 'Erreur lors de l\'envoi du lien magique')
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
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'pending'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'pending' 
              ? 'Chargement...' 
              : mode === 'login' 
                ? 'Se connecter' 
                : 'Créer un compte'
            }
          </button>
        </form>

        {/* Lien magique */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={status === 'pending'}
            className="mt-4 w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✨ Connexion par email magique
          </button>
        </div>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {mode === 'login' 
              ? 'Pas encore de compte ? Créer un compte' 
              : 'Déjà un compte ? Se connecter'
            }
          </button>
        </div>

        {/* Retour accueil */}
        <div className="mt-6 text-center">
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

