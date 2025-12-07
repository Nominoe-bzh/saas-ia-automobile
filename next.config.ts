import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Note: Les API Routes Next.js ne fonctionnent pas avec 'output: export'
  // Toutes les APIs sont dans /functions/ (Cloudflare Functions)
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

export default nextConfig
