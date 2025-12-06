import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Exclure functions/ de la compilation Next.js (gérées par Cloudflare Pages)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

export default nextConfig
