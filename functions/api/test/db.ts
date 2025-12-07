// functions/api/test/db.ts
// Endpoint de test pour vérifier la connexion Supabase

import { createClient } from '@supabase/supabase-js'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'read'

  // Créer le client Supabase
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  try {
    // Test 1 : Vérifier la connexion
    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        message: 'API Cloudflare OK',
        timestamp: new Date().toISOString(),
        env: {
          supabase_url: env.SUPABASE_URL ? 'configured' : 'missing',
          supabase_key: env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
        },
      })
    }

    // Test 2 : Insérer une donnée de test
    if (action === 'insert' && request.method === 'POST') {
      const testData = {
        email: `test-${Date.now()}@example.com`,
        input_raw: 'Test de connexion Supabase',
        output_json: {
          test: true,
          timestamp: new Date().toISOString(),
        },
        model: 'test-model',
      }

      const { data, error } = await supabase
        .from('analyses')
        .insert(testData)
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        return jsonResponse(
          {
            ok: false,
            error: 'INSERT_ERROR',
            message: 'Erreur lors de l\'insertion',
            details: error.message,
            code: error.code,
          },
          500,
        )
      }

      return jsonResponse({
        ok: true,
        message: 'Donnee de test inseree avec succes',
        data,
      })
    }

    // Test 3 : Lire les dernières analyses
    if (action === 'read') {
      const { data, error, count } = await supabase
        .from('analyses')
        .select('id, email, created_at, model', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Supabase read error:', error)
        return jsonResponse(
          {
            ok: false,
            error: 'READ_ERROR',
            message: 'Erreur lors de la lecture',
            details: error.message,
            code: error.code,
          },
          500,
        )
      }

      return jsonResponse({
        ok: true,
        message: 'Lecture Supabase OK',
        totalCount: count,
        items: data,
      })
    }

    // Test 4 : Compter les analyses
    if (action === 'count') {
      const { count, error } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Supabase count error:', error)
        return jsonResponse(
          {
            ok: false,
            error: 'COUNT_ERROR',
            message: 'Erreur lors du comptage',
            details: error.message,
          },
          500,
        )
      }

      return jsonResponse({
        ok: true,
        message: 'Comptage OK',
        totalAnalyses: count,
      })
    }

    // Test 5 : Supprimer les données de test
    if (action === 'cleanup' && request.method === 'POST') {
      const { data, error } = await supabase
        .from('analyses')
        .delete()
        .like('email', 'test-%@example.com')
        .select()

      if (error) {
        console.error('Supabase cleanup error:', error)
        return jsonResponse(
          {
            ok: false,
            error: 'CLEANUP_ERROR',
            message: 'Erreur lors du nettoyage',
            details: error.message,
          },
          500,
        )
      }

      return jsonResponse({
        ok: true,
        message: 'Nettoyage termine',
        deletedCount: data?.length || 0,
      })
    }

    return jsonResponse(
      {
        ok: false,
        error: 'INVALID_ACTION',
        message: 'Action non reconnue',
        availableActions: ['ping', 'insert', 'read', 'count', 'cleanup'],
      },
      400,
    )
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return jsonResponse(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Erreur inattendue',
        details: err.message || String(err),
      },
      500,
    )
  }
}


