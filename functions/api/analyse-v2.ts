// functions/api/analyse-v2.ts
// Version améliorée avec extraction, pricing et checklist
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createOpenAIClient } from '../../src/lib/openai'
import { AnnouncementParser } from '../../src/lib/parsers/announcement'
import { PriceEngine } from '../../src/lib/pricing/price-engine'
import { InspectionGenerator } from '../../src/lib/checklist/inspection-generator'

type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  RESEND_API_KEY: string
  MAIL_FROM: string
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
}

type CFContext = {
  request: Request
  env: EnvBindings
}

const analyseInputSchema = z.object({
  annonce: z.string().min(10),
  email: z.string().email().nullable().optional(),
  mode: z.enum(['basic', 'complete']).default('complete'),
})

const MAX_DEMO = 3

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Préflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // Parse JSON
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400)
  }

  const parsed = analyseInputSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, error: 'INVALID_INPUT', details: parsed.error.flatten() },
      400,
    )
  }

  const { annonce, email, mode } = parsed.data
  const supabase = getSupabase(env)

  // Gestion du quota
  const quotaKey = email || 'no-email'
  const { data: quotaRow, error: quotaError } = await supabase
    .from('demo_quota')
    .select('*')
    .eq('email', quotaKey)
    .maybeSingle()

  if (quotaError && quotaError.code !== 'PGRST116') {
    return jsonResponse({ ok: false, error: 'QUOTA_READ_ERROR' }, 500)
  }

  const currentCount = quotaRow?.count ?? 0
  if (currentCount >= MAX_DEMO) {
    return jsonResponse(
      {
        ok: false,
        error: 'QUOTA_EXCEEDED',
        quota_count: currentCount,
        quota_limit: MAX_DEMO,
      },
      429,
    )
  }

  // Incrémenter le compteur
  if (!quotaRow) {
    await supabase.from('demo_quota').insert({
      email: quotaKey,
      count: currentCount + 1,
    })
  } else {
    await supabase
      .from('demo_quota')
      .update({ count: currentCount + 1 })
      .eq('email', quotaKey)
  }

  // Créer les clients IA
  const openai = createOpenAIClient(env.OPENAI_API_KEY, env.OPENAI_MODEL)
  const parser = new AnnouncementParser(openai)
  const priceEngine = new PriceEngine(openai)
  const inspectionGen = new InspectionGenerator(openai)

  let analyse: any = null
  let modelUsed = 'gpt-4o-mini'

  try {
    // Étape 1 : Extraction annonce
    const fiche = await parser.parse(annonce)

    // Étape 2 : Analyse des risques (utiliser l'ancien prompt pour l'instant)
    const risquesData = await runRiskAnalysis(openai, annonce)

    // Étape 3 : Prix cible (si mode complete)
    let prixCible = null
    if (mode === 'complete') {
      try {
        prixCible = await priceEngine.estimatePrice(fiche)
      } catch (err) {
        console.error('Prix cible error:', err)
        // Continue sans prix cible
      }
    }

    // Étape 4 : Checklist inspection personnalisée
    let checklist = null
    if (mode === 'complete') {
      try {
        checklist = await inspectionGen.generate(fiche, risquesData.risques)
      } catch (err) {
        console.error('Checklist error:', err)
        // Continue sans checklist
      }
    }

    // Construire la réponse complète
    analyse = {
      fiche: {
        titre: fiche.titre,
        marque: fiche.marque,
        modele: fiche.modele,
        finition: fiche.finition,
        annee: fiche.annee,
        kilometrage: fiche.kilometrage,
        energie: fiche.energie,
        prix: fiche.prix,
      },
      risques: risquesData.risques,
      score_global: risquesData.score_global,
      avis_acheteur: risquesData.avis_acheteur,
      ...(prixCible && { prix_cible: prixCible }),
      ...(checklist && { checklist_inspection: checklist }),
    }

    modelUsed = env.OPENAI_MODEL || 'gpt-4o-mini'
  } catch (err: any) {
    console.error('OpenAI error:', err?.message || String(err))
    
    // Fallback sur analyse basique
    return jsonResponse(
      {
        ok: false,
        error: 'ANALYSIS_ERROR',
        message: 'Erreur lors de l\'analyse. Reessayez.',
      },
      500,
    )
  }

  // Log de l'analyse (non bloquant)
  await supabase.from('analyses').insert({
    email: quotaKey,
    input_raw: annonce,
    output_json: analyse,
    model: modelUsed,
  })

  return jsonResponse({
    ok: true,
    message: 'analyse IA OK',
    data: analyse,
    quota: {
      count: currentCount + 1,
      limit: MAX_DEMO,
    },
  })
}

// Helper temporaire pour analyse des risques (ancien prompt)
async function runRiskAnalysis(openai: any, annonce: string) {
  const systemPrompt = `
Tu es un expert en vehicules d'occasion.
Analyse les risques et donne un score global.

Reponds en JSON :
{
  "risques": [{"type": "string", "niveau": "faible|modere|eleve", "detail": "string", "recommandation": "string"}],
  "score_global": {"note_sur_100": number, "resume": "string", "profil_achat": "acheter|a_negocier|a_eviter"},
  "avis_acheteur": {"resume_simple": "string", "questions_a_poser": ["string"], "points_a_verifier_essai": ["string"]}
}
`.trim()

  const content = await openai.chatJSON([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Annonce: ${annonce}` },
  ])

  return content
}




