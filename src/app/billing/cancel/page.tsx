'use client'

import Link from 'next/link'

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icône info */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Votre paiement a été annulé. Aucune somme n'a été prélevée sur votre compte.
        </p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 px-6 bg-black text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Revenir aux formules
          </Link>

          <Link
            href="/"
            className="block w-full py-3 px-6 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Si vous rencontrez un problème, contactez-nous à{' '}
          <a
            href="mailto:support@checktonvehicule.fr"
            className="text-blue-600 hover:underline"
          >
            support@checktonvehicule.fr
          </a>
        </p>
      </div>
    </main>
  )
}

