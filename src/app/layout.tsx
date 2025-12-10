import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Check Ton Vehicule - Assistant IA pour voitures doccasion',
  description:
    'Analyse IA d annonces auto, detection de risques, aide a la negociation. Gagnez 500-2000 euros sur votre prochaine voiture.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}

        {/* Plausible custom script */}
        <Script
          async
          src="https://plausible.io/js/pa-wrlyMwgrkJe5XcixXf6Nm.js"
        />

        <Script id="plausible-init">
          {`
            window.plausible = window.plausible || function() {
              (plausible.q = plausible.q || []).push(arguments);
            };
            plausible.init = plausible.init || function(i) {
              plausible.o = i || {};
            };
            plausible.init();
          `}
        </Script>
      </body>
    </html>
  )
}
