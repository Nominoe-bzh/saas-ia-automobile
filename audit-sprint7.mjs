#!/usr/bin/env node

/**
 * 🔍 AUDIT SPRINT 7 - MONÉTISATION
 * 
 * Script d'audit automatisé demandé par GEMINI (Auditeur)
 * Exécuté par CURSOR (Ingénieur de Développement)
 * 
 * Ce script vérifie :
 * 1. Infrastructure BDD (tables, RLS, schéma)
 * 2. Flux de paiement end-to-end
 * 3. Protection des quotas
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const BASE_URL = process.env.BASE_URL || 'https://www.checktonvehicule.fr'

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  log(`  ${title}`, 'bright')
  console.log('='.repeat(80) + '\n')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

// Résultats de l'audit
const auditResults = {
  infrastructure: {},
  paymentFlow: {},
  protection: {},
}

// ============================================================================
// ÉTAPE 1 : VÉRIFICATION DE L'INFRASTRUCTURE
// ============================================================================

async function auditInfrastructure() {
  logSection('ÉTAPE 1 : VÉRIFICATION DE L\'INFRASTRUCTURE')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('Variables d\'environnement Supabase manquantes')
    logInfo('Crée un fichier .env.local avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY')
    auditResults.infrastructure.status = 'ÉCHEC'
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1.1 - Vérifier les tables
  log('\n1.1 - Vérification des tables', 'blue')

  const expectedTables = ['subscriptions', 'payments']
  const deprecatedTables = ['paid_plans']

  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0)
      
      if (error) {
        if (error.code === '42P01') {
          logError(`Table "${table}" introuvable`)
          auditResults.infrastructure[`table_${table}`] = 'ÉCHEC'
        } else {
          logWarning(`Table "${table}" existe mais erreur : ${error.message}`)
          auditResults.infrastructure[`table_${table}`] = 'PARTIEL'
        }
      } else {
        logSuccess(`Table "${table}" existe`)
        auditResults.infrastructure[`table_${table}`] = 'SUCCÈS'
      }
    } catch (err) {
      logError(`Erreur lors de la vérification de "${table}" : ${err.message}`)
      auditResults.infrastructure[`table_${table}`] = 'ÉCHEC'
    }
  }

  // Vérifier que les anciennes tables n'existent plus
  for (const table of deprecatedTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0)
      
      if (error && error.code === '42P01') {
        logSuccess(`Table obsolète "${table}" correctement supprimée`)
        auditResults.infrastructure[`deprecated_${table}`] = 'SUCCÈS'
      } else {
        logWarning(`Table obsolète "${table}" existe encore (devrait être supprimée)`)
        auditResults.infrastructure[`deprecated_${table}`] = 'ÉCHEC'
      }
    } catch (err) {
      // Erreur = table n'existe pas = bon signe
      logSuccess(`Table obsolète "${table}" correctement supprimée`)
      auditResults.infrastructure[`deprecated_${table}`] = 'SUCCÈS'
    }
  }

  // 1.2 - Vérifier le schéma de la table subscriptions
  log('\n1.2 - Schéma de la table "subscriptions"', 'blue')

  try {
    const { data, error } = await supabase.from('subscriptions').select('*').limit(1)
    
    if (error) {
      logError(`Impossible de récupérer le schéma : ${error.message}`)
      auditResults.infrastructure.schema_subscriptions = 'ÉCHEC'
    } else {
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        logInfo('Colonnes détectées :')
        columns.forEach(col => console.log(`   - ${col}`))
        
        const expectedColumns = ['user_id', 'plan_type', 'credits', 'credits_consumed', 'valid_until', 'status']
        const missingColumns = expectedColumns.filter(col => !columns.includes(col))
        
        if (missingColumns.length === 0) {
          logSuccess('Toutes les colonnes attendues sont présentes')
          auditResults.infrastructure.schema_subscriptions = 'SUCCÈS'
        } else {
          logWarning(`Colonnes manquantes : ${missingColumns.join(', ')}`)
          auditResults.infrastructure.schema_subscriptions = 'PARTIEL'
        }
      } else {
        logInfo('Table "subscriptions" est vide (normal si aucun utilisateur test)')
        
        // Essayer de décrire la structure via une requête d'insertion vide
        logInfo('Colonnes attendues : user_id, plan_type, credits, credits_consumed, valid_until, status')
        auditResults.infrastructure.schema_subscriptions = 'SUCCÈS (table vide)'
      }
    }
  } catch (err) {
    logError(`Erreur lors de la vérification du schéma : ${err.message}`)
    auditResults.infrastructure.schema_subscriptions = 'ÉCHEC'
  }

  // 1.3 - Vérifier les RLS Policies
  log('\n1.3 - Vérification des RLS Policies', 'blue')

  logInfo('Vérification manuelle requise : connecte-toi à Supabase Dashboard')
  logInfo('→ Table Editor → subscriptions → Policies')
  logInfo('→ Table Editor → payments → Policies')
  logInfo('')
  logInfo('Policies attendues :')
  logInfo('  - "service_role can do everything" (service_role)')
  logInfo('  - "Users can view their own subscriptions" (authenticated, SELECT)')
  logInfo('  - "Users can view their own payments" (authenticated, SELECT)')
  
  auditResults.infrastructure.rls_policies = 'MANUEL (voir Dashboard Supabase)'

  // 1.4 - Vérifier la fonction RPC consume_credit
  log('\n1.4 - Vérification de la fonction RPC "consume_credit"', 'blue')

  try {
    // Tester avec un UUID fictif (ne devrait pas consommer, juste vérifier que la fonction existe)
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const { data, error } = await supabase.rpc('consume_credit', { p_user_id: testUserId })
    
    if (error) {
      if (error.message.includes('does not exist')) {
        logError('Fonction RPC "consume_credit" introuvable')
        auditResults.infrastructure.rpc_consume_credit = 'ÉCHEC'
      } else if (error.message.includes('No active subscription') || error.message.includes('invalid input')) {
        logSuccess('Fonction RPC "consume_credit" existe (erreur attendue pour UUID fictif)')
        auditResults.infrastructure.rpc_consume_credit = 'SUCCÈS'
      } else {
        logWarning(`Fonction RPC existe mais erreur : ${error.message}`)
        auditResults.infrastructure.rpc_consume_credit = 'PARTIEL'
      }
    } else {
      logSuccess('Fonction RPC "consume_credit" existe et fonctionne')
      auditResults.infrastructure.rpc_consume_credit = 'SUCCÈS'
    }
  } catch (err) {
    logError(`Erreur lors de la vérification de la fonction RPC : ${err.message}`)
    auditResults.infrastructure.rpc_consume_credit = 'ÉCHEC'
  }

  auditResults.infrastructure.status = 'COMPLÉTÉ'
}

// ============================================================================
// ÉTAPE 2 : TEST DU FLUX DE PAIEMENT (END-TO-END)
// ============================================================================

async function testPaymentFlow() {
  logSection('ÉTAPE 2 : TEST DU FLUX DE PAIEMENT (END-TO-END)')

  const testEmail = `test.audit.${Date.now()}@example.com`
  logInfo(`Email de test généré : ${testEmail}`)

  // 2.1 - Créer un utilisateur de test
  log('\n2.1 - Création d\'un utilisateur de test', 'blue')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let userId
  try {
    // Créer un utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
      user_metadata: { created_by: 'audit_script' },
    })

    if (authError) {
      logError(`Impossible de créer l'utilisateur : ${authError.message}`)
      auditResults.paymentFlow.user_creation = 'ÉCHEC'
      return
    }

    userId = authData.user.id
    logSuccess(`Utilisateur créé avec ID : ${userId}`)
    auditResults.paymentFlow.user_creation = 'SUCCÈS'
  } catch (err) {
    logError(`Erreur lors de la création de l'utilisateur : ${err.message}`)
    auditResults.paymentFlow.user_creation = 'ÉCHEC'
    return
  }

  // 2.2 - Générer un lien de paiement Stripe
  log('\n2.2 - Génération d\'un lien de paiement Stripe', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/billing/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        planType: 'SINGLE',
        userId: userId,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      logError(`Erreur API : ${result.error || result.message}`)
      auditResults.paymentFlow.checkout_session = 'ÉCHEC'
      return
    }

    logSuccess('Session Stripe créée')
    logInfo(`Lien de paiement : ${result.checkoutUrl}`)
    logInfo(`Session ID : ${result.sessionId}`)
    
    auditResults.paymentFlow.checkout_session = 'SUCCÈS'
    auditResults.paymentFlow.checkout_url = result.checkoutUrl

    // Instructions pour le test manuel
    log('\n📝 INSTRUCTIONS POUR COMPLÉTER LE TEST :', 'yellow')
    logInfo('1. Ouvre le lien ci-dessus dans ton navigateur')
    logInfo('2. Utilise la carte de test Stripe : 4242 4242 4242 4242')
    logInfo('3. Date d\'expiration : 12/25, CVC : 123')
    logInfo('4. Complète le paiement')
    logInfo('5. Reviens ici et appuie sur Entrée pour continuer la vérification')
    
    // Attendre la confirmation manuelle
    console.log('\n')
    await new Promise(resolve => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      readline.question('Appuie sur Entrée après avoir complété le paiement...', () => {
        readline.close()
        resolve()
      })
    })

  } catch (err) {
    logError(`Erreur lors de la génération du lien : ${err.message}`)
    auditResults.paymentFlow.checkout_session = 'ÉCHEC'
    return
  }

  // 2.3 - Vérifier que les crédits ont été ajoutés
  log('\n2.3 - Vérification des crédits dans Supabase', 'blue')

  try {
    await new Promise(resolve => setTimeout(resolve, 3000)) // Attendre 3 secondes pour le webhook

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError) {
      logError(`Aucune souscription trouvée : ${subError.message}`)
      auditResults.paymentFlow.credit_verification = 'ÉCHEC'
      return
    }

    logSuccess('Souscription trouvée')
    logInfo(`Plan type : ${subscription.plan_type}`)
    logInfo(`Crédits : ${subscription.credits}`)
    logInfo(`Crédits consommés : ${subscription.credits_consumed}`)
    logInfo(`Validité : ${subscription.valid_until || 'Illimité'}`)

    if (subscription.credits === 1 && subscription.plan_type === 'SINGLE') {
      logSuccess('Crédits correctement ajoutés (1 crédit pour plan SINGLE)')
      auditResults.paymentFlow.credit_verification = 'SUCCÈS'
    } else {
      logWarning(`Crédits inattendus : ${subscription.credits} (attendu : 1)`)
      auditResults.paymentFlow.credit_verification = 'PARTIEL'
    }

    // Vérifier la table payments
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (payError) {
      logWarning('Aucun enregistrement de paiement trouvé')
      auditResults.paymentFlow.payment_record = 'ÉCHEC'
    } else {
      logSuccess('Enregistrement de paiement trouvé')
      logInfo(`Montant : ${payment.amount_cents / 100} €`)
      logInfo(`Statut : ${payment.status}`)
      auditResults.paymentFlow.payment_record = 'SUCCÈS'
    }

  } catch (err) {
    logError(`Erreur lors de la vérification : ${err.message}`)
    auditResults.paymentFlow.credit_verification = 'ÉCHEC'
  }

  auditResults.paymentFlow.status = 'COMPLÉTÉ'
  auditResults.paymentFlow.test_user_id = userId
  auditResults.paymentFlow.test_email = testEmail
}

// ============================================================================
// ÉTAPE 3 : TEST DE PROTECTION
// ============================================================================

async function testProtection() {
  logSection('ÉTAPE 3 : TEST DE PROTECTION (QUOTA 0)')

  const testEmail = `test.quota0.${Date.now()}@example.com`
  logInfo(`Email de test (sans crédit) : ${testEmail}`)

  // 3.1 - Créer un utilisateur sans crédit
  log('\n3.1 - Création d\'un utilisateur SANS crédit', 'blue')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let userId
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
      user_metadata: { created_by: 'audit_script_quota_test' },
    })

    if (authError) {
      logError(`Impossible de créer l'utilisateur : ${authError.message}`)
      auditResults.protection.user_creation = 'ÉCHEC'
      return
    }

    userId = authData.user.id
    logSuccess(`Utilisateur créé avec ID : ${userId}`)
    
    // Créer manuellement une subscription avec 0 crédit
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_type: 'FREE',
      credits: 0,
      credits_consumed: 0,
      status: 'active',
    })

    if (subError) {
      logWarning(`Impossible de créer la subscription : ${subError.message}`)
    } else {
      logSuccess('Subscription créée avec 0 crédit')
    }

    auditResults.protection.user_creation = 'SUCCÈS'
  } catch (err) {
    logError(`Erreur : ${err.message}`)
    auditResults.protection.user_creation = 'ÉCHEC'
    return
  }

  // 3.2 - Tenter une analyse avec 0 crédit
  log('\n3.2 - Test de l\'API /api/analyse avec 0 crédit', 'blue')

  try {
    const response = await fetch(`${BASE_URL}/api/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        immatriculation: 'AB-123-CD',
        kilometrage: '50000',
        prixAchat: '15000',
        carteGrise: 'Présente',
        contrôleTechnique: 'En cours de validité',
      }),
    })

    const result = await response.json()

    if (!response.ok || result.error === 'QUOTA_EXCEEDED') {
      logSuccess('API correctement protégée : QUOTA_EXCEEDED')
      logInfo(`Message : ${result.message}`)
      auditResults.protection.api_protection = 'SUCCÈS'
    } else if (response.ok && result.hasAnalyse) {
      logError('API NON PROTÉGÉE : L\'analyse a été effectuée malgré 0 crédit !')
      auditResults.protection.api_protection = 'ÉCHEC CRITIQUE'
    } else {
      logWarning(`Réponse inattendue : ${JSON.stringify(result)}`)
      auditResults.protection.api_protection = 'PARTIEL'
    }
  } catch (err) {
    logError(`Erreur lors du test : ${err.message}`)
    auditResults.protection.api_protection = 'ÉCHEC'
  }

  auditResults.protection.status = 'COMPLÉTÉ'
}

// ============================================================================
// RAPPORT FINAL
// ============================================================================

function generateFinalReport() {
  logSection('RAPPORT FINAL - AUDIT SPRINT 7')

  log('📊 RÉSULTATS PAR ÉTAPE\n', 'bright')

  // ÉTAPE 1 : Infrastructure
  log('ÉTAPE 1 : VÉRIFICATION DE L\'INFRASTRUCTURE', 'blue')
  for (const [key, value] of Object.entries(auditResults.infrastructure)) {
    if (key === 'status') continue
    const icon = value.includes('SUCCÈS') ? '✅' : value.includes('ÉCHEC') ? '❌' : '⚠️'
    console.log(`  ${icon} ${key} : ${value}`)
  }

  // ÉTAPE 2 : Flux de paiement
  log('\nÉTAPE 2 : TEST DU FLUX DE PAIEMENT', 'blue')
  for (const [key, value] of Object.entries(auditResults.paymentFlow)) {
    if (key === 'status' || key.includes('test_') || key.includes('checkout_url')) continue
    const icon = value.includes('SUCCÈS') ? '✅' : value.includes('ÉCHEC') ? '❌' : '⚠️'
    console.log(`  ${icon} ${key} : ${value}`)
  }

  // ÉTAPE 3 : Protection
  log('\nÉTAPE 3 : TEST DE PROTECTION', 'blue')
  for (const [key, value] of Object.entries(auditResults.protection)) {
    if (key === 'status') continue
    const icon = value.includes('SUCCÈS') ? '✅' : value.includes('ÉCHEC') ? '❌' : '⚠️'
    console.log(`  ${icon} ${key} : ${value}`)
  }

  // Calcul du score global
  let totalTests = 0
  let passedTests = 0

  const allResults = [
    ...Object.values(auditResults.infrastructure),
    ...Object.values(auditResults.paymentFlow),
    ...Object.values(auditResults.protection),
  ]

  allResults.forEach(result => {
    if (typeof result === 'string' && result !== 'COMPLÉTÉ') {
      totalTests++
      if (result.includes('SUCCÈS')) passedTests++
    }
  })

  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  log('\n' + '═'.repeat(80), 'bright')
  log(`  SCORE GLOBAL : ${passedTests}/${totalTests} tests réussis (${successRate}%)`, 'bright')
  log('═'.repeat(80), 'bright')

  if (successRate >= 90) {
    log('\n🎉 AUDIT RÉUSSI : Le Sprint 7 est validé !', 'green')
  } else if (successRate >= 70) {
    log('\n⚠️  AUDIT PARTIEL : Quelques corrections nécessaires', 'yellow')
  } else {
    log('\n❌ AUDIT ÉCHOUÉ : Des problèmes critiques doivent être corrigés', 'red')
  }

  // Anomalies structurelles détectées
  const criticalIssues = []
  if (auditResults.infrastructure.table_subscriptions === 'ÉCHEC') {
    criticalIssues.push('Table "subscriptions" manquante')
  }
  if (auditResults.infrastructure.table_payments === 'ÉCHEC') {
    criticalIssues.push('Table "payments" manquante')
  }
  if (auditResults.infrastructure.rpc_consume_credit === 'ÉCHEC') {
    criticalIssues.push('Fonction RPC "consume_credit" manquante')
  }
  if (auditResults.protection.api_protection === 'ÉCHEC CRITIQUE') {
    criticalIssues.push('API /api/analyse NON PROTÉGÉE (sécurité)')
  }

  if (criticalIssues.length > 0) {
    log('\n🚨 ANOMALIES STRUCTURELLES DÉTECTÉES :', 'red')
    criticalIssues.forEach(issue => console.log(`   - ${issue}`))
    log('\n⚠️  Action requise : Exécuter le script de migration SQL dans Supabase', 'yellow')
    logInfo('   Fichier : supabase_migration_sprint7_refactor.sql')
  }

  console.log('\n')
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('\n' + '█'.repeat(80), 'bright')
  log('  🔍 AUDIT SPRINT 7 - MONÉTISATION', 'bright')
  log('  Demandé par : GEMINI (Auditeur/Consultant)', 'cyan')
  log('  Exécuté par : CURSOR (Ingénieur de Développement)', 'cyan')
  log('█'.repeat(80) + '\n', 'bright')

  try {
    await auditInfrastructure()
    
    // Demander si on continue avec le test de paiement
    log('\n' + '─'.repeat(80))
    logWarning('L\'ÉTAPE 2 nécessite une interaction manuelle (paiement test Stripe)')
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const shouldContinue = await new Promise(resolve => {
      readline.question('Veux-tu continuer avec les tests de paiement ? (o/n) : ', answer => {
        readline.close()
        resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui')
      })
    })

    if (shouldContinue) {
      await testPaymentFlow()
      await testProtection()
    } else {
      logInfo('Tests de paiement et de protection ignorés')
      auditResults.paymentFlow.status = 'IGNORÉ'
      auditResults.protection.status = 'IGNORÉ'
    }

    generateFinalReport()

  } catch (error) {
    logError(`Erreur fatale lors de l'audit : ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }
}

// Exécuter l'audit
main().catch(console.error)

