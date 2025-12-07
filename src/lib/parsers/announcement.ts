// lib/parsers/announcement.ts
// Parser intelligent d'annonces automobiles

import { OpenAIClient } from '../openai'
import { Announcement, AnnouncementSchema } from '../types/announcement'

export class AnnouncementParser {
  private openai: OpenAIClient

  constructor(openai: OpenAIClient) {
    this.openai = openai
  }

  async parse(annonceText: string): Promise<Announcement> {
    const systemPrompt = `
Tu es un expert en extraction de donnees d'annonces automobiles.
Tu DOIS repondre en JSON strict, sans texte autour.

Extrait TOUTES les informations disponibles dans l'annonce.
Si une info est absente, mets null ou "inconnu" selon le type.

Format JSON attendu :
{
  "marque": "string",
  "modele": "string",
  "finition": "string | null",
  "annee": "string | null",
  "kilometrage": "string | null",
  "energie": "essence | diesel | electrique | hybride | gpl | autre | inconnu | null",
  "boite": "manuelle | automatique | robotisee | inconnu | null",
  "puissance": "string | null",
  "prix": "string | null",
  "negociable": boolean,
  "premiere_main": boolean | null,
  "nb_proprietaires": number | null,
  "controle_technique": "ok | a_faire | ko | inconnu",
  "carnet_entretien": "complet | partiel | absent | inconnu",
  "type_vendeur": "particulier | professionnel | concessionnaire | inconnu",
  "localisation": "string | null",
  "titre": "string",
  "description_courte": "string | null"
}

Regles :
- Sois precis et exhaustif
- Normalise les donnees (ex: "90ch" -> "90")
- Deduis le type de vendeur du contexte
`.trim()

    const userPrompt = `
Annonce a analyser :

${annonceText}
`.trim()

    const content = await this.openai.chatJSON([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Validation avec Zod
    const validated = AnnouncementSchema.parse(content)
    return validated
  }
}


