'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icône succès */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
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
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement confirmé !
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Vos crédits d'analyse ont été activés et sont maintenant disponibles. Vous pouvez commencer à analyser vos annonces !
        </p>

        {sessionId && (
          <p className="text-sm text-gray-500 mb-8">
            Référence de transaction : {sessionId.slice(0, 20)}...
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-6 bg-black text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Analyser une annonce
          </Link>

          <Link
            href="/mon-espace"
            className="block w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Voir mon historique
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Un email de confirmation vous a été envoyé.
        </p>
      </div>
    </main>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

