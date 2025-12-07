// lib/checklist/inspection-generator.ts
// Générateur de checklist d'inspection personnalisée

import { OpenAIClient } from '../openai'
import { Announcement } from '../types/announcement'

export type InspectionChecklist = {
  mecanique: string[]
  administratif: string[]
  vendeur: string[]
}

export class InspectionGenerator {
  private openai: OpenAIClient

  constructor(openai: OpenAIClient) {
    this.openai = openai
  }

  async generate(announcement: Announcement, risques: any[]): Promise<InspectionChecklist> {
    const systemPrompt = `
Tu es un expert en controle technique et inspection automobile.
Tu generes une checklist d'inspection personnalisee selon le vehicule et ses risques.

Reponds en JSON strict :
{
  "mecanique": ["point 1", "point 2", ...],
  "administratif": ["point 1", "point 2", ...],
  "vendeur": ["question 1", "question 2", ...]
}

Regles :
- mecanique : 5-8 points concrets a verifier lors de l'essai/visite
- administratif : 3-5 documents/verifications administratives
- vendeur : 4-6 questions a poser au vendeur

Adapte selon :
- Type de vehicule (diesel = injecteurs, electrique = batterie)
- Kilometrage (fort km = usure plus importante)
- Risques detectes (focalise sur les faiblesses)
- Type de vendeur (pro = historique complet, particulier = carnet)
`.trim()

    const ficheStr = `
Vehicule: ${announcement.marque} ${announcement.modele} ${announcement.finition || ''}
Annee: ${announcement.annee || 'Non precise'}
Kilometrage: ${announcement.kilometrage || 'Non precise'}
Energie: ${announcement.energie || 'inconnu'}
Type vendeur: ${announcement.type_vendeur}
CT: ${announcement.controle_technique}
Carnet: ${announcement.carnet_entretien}

Risques detectes :
${risques.map((r) => `- ${r.type} (${r.niveau}): ${r.detail}`).join('\n')}
`.trim()

    const userPrompt = `
Genere une checklist d'inspection pour :

${ficheStr}
`.trim()

    const content = await this.openai.chatJSON<InspectionChecklist>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Validation basique
    if (!Array.isArray(content.mecanique) || content.mecanique.length === 0) {
      throw new Error('Checklist mecanique invalide')
    }

    return content
  }
}




