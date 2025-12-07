// lib/types/announcement.ts
// Schémas et types pour l'extraction d'annonces

import { z } from 'zod'

export const AnnouncementSchema = z.object({
  // Informations véhicule
  marque: z.string().min(1, 'Marque requise'),
  modele: z.string().min(1, 'Modele requis'),
  finition: z.string().nullable(),
  annee: z.string().nullable(),
  
  // Caractéristiques techniques
  kilometrage: z.string().nullable(),
  energie: z.enum(['essence', 'diesel', 'electrique', 'hybride', 'gpl', 'autre', 'inconnu']).nullable(),
  boite: z.enum(['manuelle', 'automatique', 'robotisee', 'inconnu']).nullable(),
  puissance: z.string().nullable(),
  
  // Commercial
  prix: z.string().nullable(),
  negociable: z.boolean().default(false),
  
  // État et historique
  premiere_main: z.boolean().nullable(),
  nb_proprietaires: z.number().nullable(),
  controle_technique: z.enum(['ok', 'a_faire', 'ko', 'inconnu']).default('inconnu'),
  carnet_entretien: z.enum(['complet', 'partiel', 'absent', 'inconnu']).default('inconnu'),
  
  // Vendeur
  type_vendeur: z.enum(['particulier', 'professionnel', 'concessionnaire', 'inconnu']).default('inconnu'),
  localisation: z.string().nullable(),
  
  // Extraction complète
  titre: z.string().min(1, 'Titre requis'),
  description_courte: z.string().nullable(),
})

export type Announcement = z.infer<typeof AnnouncementSchema>

// Schema pour la réponse complète d'analyse
export const AnalysisResultSchema = z.object({
  fiche: AnnouncementSchema,
  
  risques: z.array(
    z.object({
      type: z.string(),
      niveau: z.enum(['faible', 'modere', 'eleve']),
      detail: z.string(),
      recommandation: z.string(),
    })
  ),
  
  score_global: z.object({
    note_sur_100: z.number().min(0).max(100),
    resume: z.string(),
    profil_achat: z.enum(['acheter', 'a_negocier', 'a_eviter']),
  }),
  
  avis_acheteur: z.object({
    resume_simple: z.string(),
    questions_a_poser: z.array(z.string()),
    points_a_verifier_essai: z.array(z.string()),
  }),
  
  // Nouveaux champs pour sprints suivants
  prix_cible: z.object({
    estimation: z.number(),
    fourchette_basse: z.number(),
    fourchette_haute: z.number(),
    ecart_annonce: z.number(),
    justification: z.string(),
  }).optional(),
  
  checklist_inspection: z.object({
    mecanique: z.array(z.string()),
    administratif: z.array(z.string()),
    vendeur: z.array(z.string()),
  }).optional(),
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>




