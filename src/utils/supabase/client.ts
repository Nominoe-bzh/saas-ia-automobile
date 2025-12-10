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

  // ⚠️ GRACEFUL DEGRADATION: Ne pas bloquer le build si les variables manquent
  // Pendant le build statique (SSG), les variables peuvent être absentes
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      // Côté client, on peut logger un warning
      console.warn(
        '[Supabase Client] Variables d\'environnement manquantes. ' +
        'Fonctionnalités d\'authentification désactivées.'
      )
    }
    // Retourner un client "vide" qui ne fera rien
    // @ts-ignore - On retourne un objet minimal pour éviter les erreurs
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signInWithOtp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: new Error('Supabase not configured') }),
          }),
        }),
      }),
    }
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

