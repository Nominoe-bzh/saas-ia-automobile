// src/app/api/report/[id]/route.ts
// Route Next.js pour generation PDF - Sprint 6 specs

import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import { PDFReport } from '@/lib/pdf/report-template'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: analysisId } = await params

  // Valider UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(analysisId)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_ID', message: 'Format ID invalide' },
      { status: 400 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { ok: false, error: 'CONFIG_ERROR', message: 'Configuration Supabase manquante' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  try {
    // Récupérer l'analyse
    const { data: analysis, error: dbError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .maybeSingle()

    if (dbError) {
      console.error('Supabase error:', dbError)
      return NextResponse.json(
        { ok: false, error: 'DATABASE_ERROR', message: 'Erreur base de donnees' },
        { status: 500 }
      )
    }

    if (!analysis) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Analyse introuvable' },
        { status: 404 }
      )
    }

    // Parser les données
    let analysisData: any
    try {
      if (typeof analysis.output_json === 'string') {
        analysisData = JSON.parse(analysis.output_json)
      } else {
        analysisData = analysis.output_json
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'INVALID_DATA', message: 'Donnees invalides' },
        { status: 500 }
      )
    }

    // Vérifier données minimales
    if (!analysisData.fiche || !analysisData.score_global) {
      return NextResponse.json(
        { ok: false, error: 'INCOMPLETE_DATA', message: 'Donnees incompletes' },
        { status: 500 }
      )
    }

    // Générer PDF
    const pdfBuffer = await renderToBuffer(
      PDFReport({
        data: analysisData,
        analysisId: analysisId,
        generatedAt: new Date(),
      })
    )

    // Nom de fichier
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
      },
    })
  } catch (pdfError: any) {
    console.error('PDF generation error:', pdfError)
    return NextResponse.json(
      {
        ok: false,
        error: 'PDF_GENERATION_ERROR',
        message: 'Erreur generation PDF',
        details: pdfError.message || String(pdfError),
      },
      { status: 500 }
    )
  }
}


