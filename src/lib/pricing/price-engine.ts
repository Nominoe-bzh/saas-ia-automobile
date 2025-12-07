// lib/pricing/price-engine.ts
// Moteur de calcul du prix cible

import { OpenAIClient } from '../openai'
import { Announcement } from '../types/announcement'

export type PriceEstimate = {
  estimation: number
  fourchette_basse: number
  fourchette_haute: number
  ecart_annonce: number
  ecart_pourcentage: number
  justification: string
  opportunite: 'excellente' | 'bonne' | 'correcte' | 'surcote'
}

export class PriceEngine {
  private openai: OpenAIClient

  constructor(openai: OpenAIClient) {
    this.openai = openai
  }

  async estimatePrice(announcement: Announcement): Promise<PriceEstimate> {
    const systemPrompt = `
Tu es un expert en valorisation de vehicules d'occasion.
Tu dois estimer un prix cible realiste base sur les informations du vehicule.

Reponds en JSON strict :
{
  "estimation": number,
  "fourchette_basse": number,
  "fourchette_haute": number,
  "justification": "string expliquant ton raisonnement"
}

Prends en compte :
- Marque et modele (cote officielle)
- Annee et kilometrage (depreciation)
- Energie (diesel deprecie plus vite)
- Etat general (CT, carnet, nb proprietaires)
- Type de vendeur (pro = marge plus elevee)
- Localisation (marche local)

Sois realiste et prudent. Base-toi sur des references de marche concretes.
`.trim()

    const ficheStr = `
Marque: ${announcement.marque}
Modele: ${announcement.modele}
Finition: ${announcement.finition || 'Non precise'}
Annee: ${announcement.annee || 'Non precise'}
Kilometrage: ${announcement.kilometrage || 'Non precise'}
Energie: ${announcement.energie || 'inconnu'}
Boite: ${announcement.boite || 'inconnu'}
Puissance: ${announcement.puissance || 'Non precise'}
Prix annonce: ${announcement.prix || 'Non precise'}
Negociable: ${announcement.negociable ? 'Oui' : 'Non'}
Premiere main: ${announcement.premiere_main === null ? 'Inconnu' : announcement.premiere_main ? 'Oui' : 'Non'}
Nombre proprietaires: ${announcement.nb_proprietaires || 'Inconnu'}
Controle technique: ${announcement.controle_technique}
Carnet entretien: ${announcement.carnet_entretien}
Type vendeur: ${announcement.type_vendeur}
Localisation: ${announcement.localisation || 'Non precise'}
`.trim()

    const userPrompt = `
Estime le prix cible pour ce vehicule :

${ficheStr}
`.trim()

    const content = await this.openai.chatJSON<{
      estimation: number
      fourchette_basse: number
      fourchette_haute: number
      justification: string
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Calculer l'écart avec le prix annoncé
    const prixAnnonce = this.extractPrice(announcement.prix)
    const ecart = prixAnnonce ? prixAnnonce - content.estimation : 0
    const ecartPct = prixAnnonce ? ((ecart / content.estimation) * 100) : 0

    // Déterminer le niveau d'opportunité
    let opportunite: PriceEstimate['opportunite'] = 'correcte'
    if (ecartPct < -15) opportunite = 'surcote'
    else if (ecartPct > 15) opportunite = 'excellente'
    else if (ecartPct > 5) opportunite = 'bonne'

    return {
      estimation: content.estimation,
      fourchette_basse: content.fourchette_basse,
      fourchette_haute: content.fourchette_haute,
      ecart_annonce: ecart,
      ecart_pourcentage: ecartPct,
      justification: content.justification,
      opportunite,
    }
  }

  private extractPrice(priceStr: string | null): number | null {
    if (!priceStr) return null
    
    // Extraire les chiffres
    const numbers = priceStr.replace(/[^0-9]/g, '')
    const price = parseInt(numbers, 10)
    
    return isNaN(price) ? null : price
  }
}





