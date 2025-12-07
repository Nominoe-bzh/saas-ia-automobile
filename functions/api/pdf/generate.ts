// functions/api/pdf/generate.ts
// API Cloudflare Function pour générer un PDF depuis une analyse

import { renderToBuffer } from '@react-pdf/renderer'
import { PDFReport } from '../../../src/lib/pdf/report-template'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function getSupabase(env: EnvBindings) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env } = context

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // Récupérer l'ID de l'analyse depuis l'URL
  const url = new URL(request.url)
  const analysisId = url.searchParams.get('id')

  if (!analysisId) {
    return jsonResponse({ ok: false, error: 'MISSING_ID', message: 'Parametre id requis' }, 400)
  }

  // Valider le format UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(analysisId)) {
    return jsonResponse({ ok: false, error: 'INVALID_ID', message: 'Format ID invalide' }, 400)
  }

  const supabase = getSupabase(env)

  // Récupérer l'analyse depuis Supabase
  const { data: analysis, error: dbError } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .maybeSingle()

  if (dbError) {
    console.error('Supabase error:', dbError)
    return jsonResponse(
      { ok: false, error: 'DATABASE_ERROR', message: 'Erreur lors de la recuperation de l\'analyse' },
      500,
    )
  }

  if (!analysis) {
    return jsonResponse(
      { ok: false, error: 'NOT_FOUND', message: 'Analyse introuvable' },
      404,
    )
  }

  // Valider et extraire les données
  let analysisData: any
  try {
    if (typeof analysis.output_json === 'string') {
      analysisData = JSON.parse(analysis.output_json)
    } else {
      analysisData = analysis.output_json
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    return jsonResponse(
      { ok: false, error: 'INVALID_DATA', message: 'Donnees d\'analyse invalides' },
      500,
    )
  }

  // Vérifier que les données minimales sont présentes
  if (!analysisData.fiche || !analysisData.score_global) {
    return jsonResponse(
      { ok: false, error: 'INCOMPLETE_DATA', message: 'Donnees d\'analyse incompletes' },
      500,
    )
  }

  try {
    // Générer le PDF avec React PDF
    const pdfBuffer = await renderToBuffer(
      PDFReport({
        data: analysisData,
        generatedAt: new Date(),
      })
    )

    // Créer un nom de fichier descriptif
    const vehiculeName = [analysisData.fiche.marque, analysisData.fiche.modele]
      .filter(Boolean)
      .join('-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase()
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `rapport-${vehiculeName}-${timestamp}.pdf`

    // Retourner le PDF
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
        ...CORS_HEADERS,
      },
    })
  } catch (pdfError: any) {
    console.error('PDF generation error:', pdfError)
    return jsonResponse(
      {
        ok: false,
        error: 'PDF_GENERATION_ERROR',
        message: 'Erreur lors de la generation du PDF',
        details: pdfError.message || String(pdfError),
      },
      500,
    )
  }
}


