import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Note: 'output: export' est incompatible avec les API Routes Next.js
  // Pour Cloudflare Pages, on utilise les Cloudflare Functions (dossier functions/)
  // et on garde Next.js en mode serveur pour le développement local
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

export default nextConfig
