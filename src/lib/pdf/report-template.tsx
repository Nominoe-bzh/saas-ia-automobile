// src/lib/pdf/report-template.tsx
// Template PDF professionnel pour les rapports d'analyse

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { AnalysisResult } from '../types/announcement'

// Styles PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
    borderBottom: '1px solid #ddd',
    paddingBottom: 5,
  },
  verdictBox: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  verdictAcheter: {
    backgroundColor: '#dcfce7',
    border: '2px solid #16a34a',
  },
  verdictNegocier: {
    backgroundColor: '#fed7aa',
    border: '2px solid #ea580c',
  },
  verdictEviter: {
    backgroundColor: '#fee2e2',
    border: '2px solid #dc2626',
  },
  verdictScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  verdictLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  priceBox: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceTarget: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  ficheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  ficheItem: {
    width: '50%',
    marginBottom: 8,
  },
  ficheLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  ficheValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  risqueItem: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    marginBottom: 8,
    border: '1px solid #e5e7eb',
  },
  risqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  risqueType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  risqueNiveau: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: 10,
  },
  niveauFaible: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  niveauModere: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  niveauEleve: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  risqueDetail: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  risqueReco: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  checklistItem: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 10,
    lineHeight: 1.4,
  },
  checklistCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTop: '1px solid #ddd',
    paddingTop: 10,
  },
  opportuniteBadge: {
    padding: '5px 10px',
    borderRadius: 5,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  opportuniteExcellente: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  opportuniteBonne: {
    backgroundColor: '#dbeafe',
    color: '#1e3a8a',
  },
  opportuniteCorrecte: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  opportuniteSurcote: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
})

type PDFReportProps = {
  data: AnalysisResult
  generatedAt?: Date
}

export function PDFReport({ data, generatedAt = new Date() }: PDFReportProps) {
  const { fiche, risques, score_global, avis_acheteur, prix_cible, checklist_inspection } = data

  // Déterminer le style du verdict
  const verdictStyle =
    score_global.profil_achat === 'acheter'
      ? styles.verdictAcheter
      : score_global.profil_achat === 'a_negocier'
      ? styles.verdictNegocier
      : styles.verdictEviter

  const verdictLabel = {
    acheter: 'ACHETER',
    a_negocier: 'A NEGOCIER',
    a_eviter: 'A EVITER',
  }[score_global.profil_achat]

  // Style opportunité
  const opportuniteStyle = prix_cible
    ? prix_cible.opportunite === 'excellente'
      ? styles.opportuniteExcellente
      : prix_cible.opportunite === 'bonne'
      ? styles.opportuniteBonne
      : prix_cible.opportunite === 'correcte'
      ? styles.opportuniteCorrecte
      : styles.opportuniteSurcote
    : styles.opportuniteCorrecte

  const opportuniteLabel = {
    excellente: 'Excellente opportunite',
    bonne: 'Bonne affaire',
    correcte: 'Prix correct',
    surcote: 'Surcote',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Check Ton Vehicule</Text>
          <Text style={styles.subtitle}>Rapport d'Analyse IA - Vehicule d'occasion</Text>
          <Text style={styles.subtitle}>
            Genere le {generatedAt.toLocaleDateString('fr-FR')} a{' '}
            {generatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Verdict principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verdict IA</Text>
          <View style={[styles.verdictBox, verdictStyle]}>
            <Text style={styles.verdictScore}>{score_global.note_sur_100}/100</Text>
            <Text style={styles.verdictLabel}>{verdictLabel}</Text>
            <Text style={styles.verdictText}>{score_global.resume}</Text>
          </View>
        </View>

        {/* Prix cible */}
        {prix_cible && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prix Cible</Text>
            <View style={styles.priceBox}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Fourchette basse</Text>
                <Text style={styles.priceValue}>{prix_cible.fourchette_basse.toLocaleString('fr-FR')} EUR</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix cible recommande</Text>
                <Text style={styles.priceTarget}>{prix_cible.estimation.toLocaleString('fr-FR')} EUR</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Fourchette haute</Text>
                <Text style={styles.priceValue}>{prix_cible.fourchette_haute.toLocaleString('fr-FR')} EUR</Text>
              </View>
              {prix_cible.ecart_annonce !== 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Ecart avec annonce</Text>
                  <Text style={styles.priceValue}>
                    {prix_cible.ecart_annonce > 0 ? '+' : ''}
                    {prix_cible.ecart_annonce.toLocaleString('fr-FR')} EUR (
                    {prix_cible.ecart_pourcentage > 0 ? '+' : ''}
                    {prix_cible.ecart_pourcentage.toFixed(1)}%)
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.opportuniteBadge, opportuniteStyle]}>
              <Text>{opportuniteLabel[prix_cible.opportunite]}</Text>
            </View>
            <Text style={[styles.verdictText, { marginTop: 10 }]}>{prix_cible.justification}</Text>
          </View>
        )}

        {/* Fiche technique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiche Technique</Text>
          <View style={styles.ficheGrid}>
            {fiche.marque && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Marque</Text>
                <Text style={styles.ficheValue}>{fiche.marque}</Text>
              </View>
            )}
            {fiche.modele && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Modele</Text>
                <Text style={styles.ficheValue}>{fiche.modele}</Text>
              </View>
            )}
            {fiche.finition && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Finition</Text>
                <Text style={styles.ficheValue}>{fiche.finition}</Text>
              </View>
            )}
            {fiche.annee && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Annee</Text>
                <Text style={styles.ficheValue}>{fiche.annee}</Text>
              </View>
            )}
            {fiche.kilometrage && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Kilometrage</Text>
                <Text style={styles.ficheValue}>{fiche.kilometrage}</Text>
              </View>
            )}
            {fiche.energie && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Energie</Text>
                <Text style={styles.ficheValue}>{fiche.energie}</Text>
              </View>
            )}
            {fiche.prix && (
              <View style={styles.ficheItem}>
                <Text style={styles.ficheLabel}>Prix annonce</Text>
                <Text style={styles.ficheValue}>{fiche.prix}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Risques */}
        {risques.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risques Identifies</Text>
            {risques.map((risque, idx) => {
              const niveauStyle =
                risque.niveau === 'faible'
                  ? styles.niveauFaible
                  : risque.niveau === 'modéré'
                  ? styles.niveauModere
                  : styles.niveauEleve

              return (
                <View key={idx} style={styles.risqueItem}>
                  <View style={styles.risqueHeader}>
                    <Text style={styles.risqueType}>{risque.type}</Text>
                    <View style={[styles.risqueNiveau, niveauStyle]}>
                      <Text>{risque.niveau.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.risqueDetail}>{risque.detail}</Text>
                  <Text style={styles.risqueReco}>Recommandation: {risque.recommandation}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Check Ton Vehicule - www.checktonvehicule.fr</Text>
          <Text>Rapport genere automatiquement par IA - A titre informatif uniquement</Text>
        </View>
      </Page>

      {/* Page 2 : Checklist et avis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Check Ton Vehicule</Text>
          <Text style={styles.subtitle}>Checklist d'Inspection & Avis Acheteur</Text>
        </View>

        {/* Checklist */}
        {checklist_inspection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist d'Inspection</Text>

            <Text style={styles.checklistCategory}>Mecanique</Text>
            {checklist_inspection.mecanique.map((item, idx) => (
              <Text key={idx} style={styles.checklistItem}>
                • {item}
              </Text>
            ))}

            <Text style={styles.checklistCategory}>Administratif</Text>
            {checklist_inspection.administratif.map((item, idx) => (
              <Text key={idx} style={styles.checklistItem}>
                • {item}
              </Text>
            ))}

            <Text style={styles.checklistCategory}>Questions au vendeur</Text>
            {checklist_inspection.vendeur.map((item, idx) => (
              <Text key={idx} style={styles.checklistItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {/* Avis acheteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avis Acheteur</Text>
          <Text style={[styles.verdictText, { marginBottom: 15 }]}>{avis_acheteur.resume_simple}</Text>

          {avis_acheteur.questions_a_poser.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.checklistCategory}>Questions a poser</Text>
              {avis_acheteur.questions_a_poser.map((q, idx) => (
                <Text key={idx} style={styles.checklistItem}>
                  • {q}
                </Text>
              ))}
            </View>
          )}

          {avis_acheteur.points_a_verifier_essai.length > 0 && (
            <View>
              <Text style={styles.checklistCategory}>Points a verifier a l'essai</Text>
              {avis_acheteur.points_a_verifier_essai.map((p, idx) => (
                <Text key={idx} style={styles.checklistItem}>
                  • {p}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Check Ton Vehicule - www.checktonvehicule.fr</Text>
          <Text>Rapport genere automatiquement par IA - A titre informatif uniquement</Text>
        </View>
      </Page>
    </Document>
  )
}

