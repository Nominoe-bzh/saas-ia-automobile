// src/lib/pdf/report-template.tsx
// Template PDF professionnel - Sprint 6 conforme specs

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AnalysisResult } from '../types/announcement'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Page de garde
  coverPage: {
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  coverInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 60,
    textAlign: 'center',
  },
  coverLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  analysisId: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 5,
  },
  // Header sections
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
  // Sections
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
  // Verdict
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
  // Résumé (Section 1)
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 11,
    color: '#000',
  },
  summaryHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  // Prix
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
  ecartBox: {
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  ecartPositive: {
    backgroundColor: '#dcfce7',
    border: '1px solid #16a34a',
  },
  ecartNegative: {
    backgroundColor: '#fee2e2',
    border: '1px solid #dc2626',
  },
  // Points forts/faibles
  pointsBox: {
    marginBottom: 15,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 5,
  },
  pointBullet: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: 'bold',
  },
  pointText: {
    fontSize: 10,
    lineHeight: 1.4,
    flex: 1,
  },
  pointPositive: {
    color: '#16a34a',
  },
  pointNegative: {
    color: '#dc2626',
  },
  // Risques
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
  // Checklist
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
  // Footer
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
})

type PDFReportProps = {
  data: AnalysisResult
  analysisId: string
  generatedAt?: Date
}

export function PDFReport({ data, analysisId, generatedAt = new Date() }: PDFReportProps) {
  const { fiche, risques, score_global, avis_acheteur, prix_cible, checklist_inspection } = data

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

  // Calculer l'écart de prix
  const prixAnnonce = extractPrice(fiche.prix)
  const ecartPrix = prix_cible && prixAnnonce ? prixAnnonce - prix_cible.estimation : 0
  const ecartPct = prix_cible && prixAnnonce ? ((ecartPrix / prix_cible.estimation) * 100) : 0

  // Séparer points forts et points faibles depuis les risques
  const pointsForts = risques.filter(r => r.niveau === 'faible').slice(0, 3)
  const pointsFaibles = risques.filter(r => r.niveau !== 'faible')

  return (
    <Document>
      {/* PAGE DE GARDE */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverLogo}>Check Ton Vehicule</Text>
        <Text style={styles.coverTitle}>Rapport d'Analyse IA</Text>
        <Text style={styles.coverSubtitle}>Vehicule d'occasion</Text>
        
        <View style={{ marginTop: 40 }}>
          <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
            {fiche.marque} {fiche.modele} {fiche.finition || ''}
          </Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            {fiche.annee || ''} • {fiche.kilometrage || ''} • {fiche.energie || ''}
          </Text>
        </View>

        <Text style={styles.coverInfo}>
          Genere le {generatedAt.toLocaleDateString('fr-FR')} a{' '}
          {generatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.analysisId}>ID: {analysisId}</Text>
      </Page>

      {/* PAGE 1 : RESUME */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Section 1 - Resume</Text>
        </View>

        {/* Véhicule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Vehicule</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Marque</Text>
              <Text style={styles.summaryValue}>{fiche.marque || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Modele</Text>
              <Text style={styles.summaryValue}>{fiche.modele || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Annee</Text>
              <Text style={styles.summaryValue}>{fiche.annee || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Kilometrage</Text>
              <Text style={styles.summaryValue}>{fiche.kilometrage || '-'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Motorisation</Text>
              <Text style={styles.summaryValue}>{fiche.energie || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Prix vendeur vs Prix IA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analyse de Prix</Text>
          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix vendeur</Text>
              <Text style={styles.priceValue}>{fiche.prix || 'Non communique'}</Text>
            </View>
            {prix_cible && (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Prix IA recommande</Text>
                  <Text style={styles.priceTarget}>{formatPrice(prix_cible.estimation)} EUR</Text>
                </View>
                {ecartPrix !== 0 && (
                  <View style={[styles.ecartBox, ecartPrix > 0 ? styles.ecartNegative : styles.ecartPositive]}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3 }}>
                      Ecart: {ecartPrix > 0 ? '+' : ''}{formatPrice(Math.abs(ecartPrix))} EUR ({ecartPct > 0 ? '+' : ''}{ecartPct.toFixed(1)}%)
                    </Text>
                    <Text style={{ fontSize: 10 }}>
                      {ecartPrix > 0 
                        ? 'Prix superieur a la valeur estimee - Marge de negociation possible'
                        : 'Prix inferieur a la valeur estimee - Bonne opportunite'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Verdict */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verdict Final</Text>
          <View style={[styles.verdictBox, verdictStyle]}>
            <Text style={styles.verdictScore}>{score_global.note_sur_100}/100</Text>
            <Text style={styles.verdictLabel}>{verdictLabel}</Text>
            <Text style={styles.verdictText}>{score_global.resume}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Check Ton Vehicule - www.checktonvehicule.fr</Text>
        </View>
      </Page>

      {/* PAGE 2 : ANALYSE DETAILLEE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Section 2 - Analyse Detaillee</Text>
        </View>

        {/* Points forts */}
        {pointsForts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points Forts</Text>
            <View style={styles.pointsBox}>
              {pointsForts.map((point, idx) => (
                <View key={idx} style={styles.pointItem}>
                  <Text style={[styles.pointBullet, styles.pointPositive]}>+</Text>
                  <Text style={styles.pointText}>{point.detail}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Points faibles / Signaux d'alerte */}
        {pointsFaibles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points Faibles / Signaux d'Alerte</Text>
            <View style={styles.pointsBox}>
              {pointsFaibles.map((point, idx) => (
                <View key={idx} style={styles.risqueItem}>
                  <View style={styles.risqueHeader}>
                    <Text style={styles.risqueType}>{point.type}</Text>
                    <View style={[
                      styles.risqueNiveau,
                      point.niveau === 'modéré' ? styles.niveauModere : styles.niveauEleve
                    ]}>
                      <Text>{point.niveau.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.risqueDetail}>{point.detail}</Text>
                  <Text style={styles.risqueReco}>Recommandation: {point.recommandation}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Check Ton Vehicule - www.checktonvehicule.fr</Text>
        </View>
      </Page>

      {/* PAGE 3 : CHECKLIST */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Section 3 - Checklist d'Inspection</Text>
        </View>

        {checklist_inspection && (
          <View style={styles.section}>
            <Text style={styles.checklistCategory}>Mecanique / Esthetique</Text>
            {checklist_inspection.mecanique.map((item, idx) => (
              <Text key={idx} style={styles.checklistItem}>
                • {item}
              </Text>
            ))}

            <Text style={styles.checklistCategory}>Administratif / Historique</Text>
            {checklist_inspection.administratif.map((item, idx) => (
              <Text key={idx} style={styles.checklistItem}>
                • {item}
              </Text>
            ))}

            <Text style={styles.checklistCategory}>Questions a poser au vendeur</Text>
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

          {avis_acheteur.points_a_verifier_essai.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>
                Points a verifier a l'essai:
              </Text>
              {avis_acheteur.points_a_verifier_essai.slice(0, 5).map((p, idx) => (
                <Text key={idx} style={styles.checklistItem}>
                  • {p}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Check Ton Vehicule - www.checktonvehicule.fr</Text>
          <Text>Rapport genere automatiquement par IA - A titre informatif uniquement</Text>
        </View>
      </Page>
    </Document>
  )
}

function extractPrice(priceStr: string | null): number | null {
  if (!priceStr) return null
  const numbers = priceStr.replace(/[^0-9]/g, '')
  const price = parseInt(numbers, 10)
  return isNaN(price) ? null : price
}

function formatPrice(price: number): string {
  // Formatage manuel avec espace normal (pas non-breaking space)
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
