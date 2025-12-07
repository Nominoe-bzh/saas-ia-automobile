// app/api/test-db/route.ts
// Route Next.js pour tester la connexion Supabase (dev uniquement)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action') || 'read'

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ENV_MISSING',
        message: 'Variables Supabase manquantes',
        env: {
          supabase_url: supabaseUrl ? 'configured' : 'missing',
          supabase_key: supabaseKey ? 'configured' : 'missing',
        },
      },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  try {
    if (action === 'ping') {
      return NextResponse.json({
        ok: true,
        message: 'API Next.js OK',
        timestamp: new Date().toISOString(),
        env: {
          supabase_url: 'configured',
          supabase_key: 'configured',
        },
      })
    }

    if (action === 'count') {
      const { count, error } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'COUNT_ERROR',
            message: 'Erreur comptage',
            details: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Comptage OK',
        totalAnalyses: count,
      })
    }

    if (action === 'read') {
      const { data, error, count } = await supabase
        .from('analyses')
        .select('id, email, created_at, model', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'READ_ERROR',
            message: 'Erreur lecture',
            details: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Lecture OK',
        totalCount: count,
        items: data,
      })
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_ACTION',
        message: 'Action non reconnue',
        availableActions: ['ping', 'count', 'read'],
      },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Erreur inattendue',
        details: err.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: 'ENV_MISSING' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  try {
    if (action === 'insert') {
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
        return NextResponse.json(
          {
            ok: false,
            error: 'INSERT_ERROR',
            message: 'Erreur insertion',
            details: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Donnee test inseree',
        data,
      })
    }

    if (action === 'cleanup') {
      const { data, error } = await supabase
        .from('analyses')
        .delete()
        .like('email', 'test-%@example.com')
        .select()

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'CLEANUP_ERROR',
            message: 'Erreur nettoyage',
            details: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: 'Nettoyage termine',
        deletedCount: data?.length || 0,
      })
    }

    return NextResponse.json(
      { ok: false, error: 'INVALID_ACTION' },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        details: err.message,
      },
      { status: 500 }
    )
  }
}


