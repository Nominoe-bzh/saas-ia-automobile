import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase pour le frontend (Browser)
 * 
 * Utilise les variables d'environnement publiques :
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * Ce client est utilisé pour :
 * - L'authentification (login, signup, logout)
 * - Les requêtes protégées par RLS (Row Level Security)
 * 
 * ⚠️ ATTENTION : Pour les opérations critiques (paiements, crédits),
 * utilisez l'API Cloudflare Functions avec SERVICE_ROLE_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

