// src/app/api/test-supabase/route.ts
// ⚠️ DEV/DEBUG ONLY - Endpoint de test pour Supabase
// TODO: Supprimer ou sécuriser avant la production finale

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'ping'

  console.log('🔍 Test Supabase - Action:', action)
  console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Configuré' : '❌ Manquant')
  console.log('🔍 Supabase Key:', supabaseKey ? '✅ Configuré' : '❌ Manquant')

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'MISSING_CONFIG',
        message: 'Variables d\'environnement Supabase manquantes',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey,
        },
      },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    switch (action) {
      case 'ping': {
        // Test simple de connexion
        const { data, error } = await supabase.from('waitlist').select('id').limit(1)

        if (error) {
          console.error('❌ Erreur Supabase ping:', error)
          return NextResponse.json(
            {
              ok: false,
              error: 'SUPABASE_ERROR',
              message: 'Erreur de connexion à Supabase',
              details: error,
            },
            { status: 500 }
          )
        }

        console.log('✅ Ping Supabase OK')
        return NextResponse.json({
          ok: true,
          message: 'Connexion Supabase OK',
          data,
        })
      }

      case 'insert': {
        // Insérer un enregistrement de test
        const testEmail = `test-${Date.now()}@sanitycheck.local`
        const testData = {
          email: testEmail,
          prenom: 'SanityCheck',
          type_utilisateur: 'Particulier',
        }

        console.log('📝 Tentative d\'insertion:', testData)

        const { data, error } = await supabase.from('waitlist').insert(testData).select()

        if (error) {
          console.error('❌ Erreur insertion:', error)
          return NextResponse.json(
            {
              ok: false,
              error: 'INSERT_ERROR',
              message: 'Erreur lors de l\'insertion',
              details: error,
            },
            { status: 500 }
          )
        }

        console.log('✅ Insertion OK:', data)
        return NextResponse.json({
          ok: true,
          message: 'Insertion réussie',
          data,
        })
      }

      case 'read': {
        // Lire les derniers enregistrements
        const { data, error } = await supabase
          .from('waitlist')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('❌ Erreur lecture:', error)
          return NextResponse.json(
            {
              ok: false,
              error: 'READ_ERROR',
              message: 'Erreur lors de la lecture',
              details: error,
            },
            { status: 500 }
          )
        }

        console.log('✅ Lecture OK:', data?.length, 'enregistrements')
        return NextResponse.json({
          ok: true,
          message: 'Lecture réussie',
          count: data?.length || 0,
          data,
        })
      }

      case 'count': {
        // Compter les enregistrements
        const { count, error } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error('❌ Erreur count:', error)
          return NextResponse.json(
            {
              ok: false,
              error: 'COUNT_ERROR',
              message: 'Erreur lors du comptage',
              details: error,
            },
            { status: 500 }
          )
        }

        console.log('✅ Count OK:', count)
        return NextResponse.json({
          ok: true,
          message: 'Comptage réussi',
          count,
        })
      }

      default:
        return NextResponse.json(
          {
            ok: false,
            error: 'INVALID_ACTION',
            message: 'Action invalide',
            availableActions: ['ping', 'insert', 'read', 'count'],
          },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('❌ Erreur inattendue:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Erreur inattendue',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// POST pour insérer une analyse complète (pour test PDF)
export async function POST(request: NextRequest) {
  console.log('📝 POST /api/test-supabase - Insertion analyse complete')

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_CONFIG', message: 'Configuration Supabase manquante' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  try {
    const body = await request.json()
    const { email, input_text, output_json } = body

    if (!email || !input_text || !output_json) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_DATA', message: 'Donnees manquantes (email, input_text, output_json requis)' },
        { status: 400 }
      )
    }

    console.log('📝 Tentative insertion analyse pour:', email)

    const { data, error } = await supabase
      .from('analyses')
      .insert({
        email: email,
        input_raw: input_text,
        output_json: output_json,
        model: 'test-pdf',
      })
      .select()

    if (error) {
      console.error('❌ Erreur insertion analyse:', error)
      return NextResponse.json(
        {
          ok: false,
          error: 'INSERT_ERROR',
          message: 'Erreur lors de l\'insertion de l\'analyse',
          details: error,
        },
        { status: 500 }
      )
    }

    console.log('✅ Analyse inseree avec succes, ID:', data[0].id)
    return NextResponse.json({
      ok: true,
      message: 'Analyse inseree avec succes',
      data: data[0],
    })
  } catch (error: any) {
    console.error('❌ Erreur inattendue POST:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        message: 'Erreur inattendue',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

