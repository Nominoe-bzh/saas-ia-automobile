# 📝 CHANGELOG - SPRINT 7 REFACTORING

**Date :** 2025-12-08  
**Type :** Refactoring majeur de la monétisation  
**Status :** ✅ Code prêt - Migration requise

---

## 🎯 **OBJECTIF DU REFACTORING**

Remettre en conformité le système de monétisation avec le Business Plan initial :
- Remplacer l'architecture basée sur `email` par une architecture basée sur `user_id`
- Implémenter une consommation de crédits atomique (RPC côté DB)
- Gérer correctement les 3 types de plans : SINGLE, PACK, UNLIMITED
- Ajouter un système de validité temporelle pour les plans

---

## 🗂️ **STRUCTURE ANCIENNE (SUPPRIMÉE)**

```
Tables Supabase:
├── paid_plans (email, plan_type, credits_remaining)
└── payments (email, stripe_session_id, amount, plan_type)

API Logic:
└── /api/analyse : Gestion manuelle des crédits (risque de race conditions)
```

---

## 🗂️ **NOUVELLE STRUCTURE (IMPLÉMENTÉE)**

```
Tables Supabase:
├── subscriptions (user_id, plan_type, credits, credits_consumed, valid_until, status)
│   ├── Trigger: Auto-création plan FREE à l'inscription
│   └── RLS: Service Role (full) + Authenticated (read own)
│
├── payments (user_id, stripe_*, amount_cents, plan_type, credits, valid_until, status, raw_event)
│   └── RLS: Service Role (full) + Authenticated (read own)
│
└── RPC Function: consume_credit(p_user_id) → JSONB
    └── Consommation atomique (FOR UPDATE + gestion UNLIMITED/crédits)
```

---

## 📦 **FICHIERS CRÉÉS**

| Fichier                                      | Description                                         |
|----------------------------------------------|-----------------------------------------------------|
| `supabase_migration_sprint7_refactor.sql`    | Script SQL complet (DROP, CREATE, RPC, RLS)         |
| `MIGRATION_SPRINT7_GUIDE.md`                 | Guide pas-à-pas pour exécuter la migration          |
| `SPRINT7_REFACTOR_CHANGELOG.md`              | Ce fichier (résumé des changements)                 |

---

## 🔧 **FICHIERS MODIFIÉS**

### **1. Backend - Webhook Stripe**
**Fichier :** `functions/api/billing/webhook.ts`

**Changements :**
- ✅ Gestion des 3 types de plans (SINGLE, PACK, UNLIMITED)
- ✅ Calcul automatique de `valid_until` selon le plan
- ✅ Récupération du `user_id` depuis l'email (si non fourni dans metadata)
- ✅ Insertion dans `payments` et upsert dans `subscriptions`
- ✅ Log de débogage : `🚀 WEBHOOK STRIPE V3 - REFACTORED WITH SUBSCRIPTIONS TABLE`

**Plan Configs :**
```typescript
SINGLE: {
  planType: 'SINGLE',
  credits: 1,
  validityDays: null, // Crédits sans expiration
}

PACK: {
  planType: 'PACK',
  credits: 5,
  validityDays: 365, // 1 an
}

UNLIMITED: {
  planType: 'UNLIMITED',
  credits: null, // Pas de limite
  validityDays: 30, // Abonnement mensuel
}
```

---

### **2. Backend - Create Checkout Session**
**Fichier :** `functions/api/billing/create-checkout-session.ts`

**Changements :**
- ✅ Validation des nouveaux planType : `['SINGLE', 'PACK', 'UNLIMITED']`
- ✅ Mapping vers les nouvelles variables d'environnement :
  - `STRIPE_PRICE_SINGLE`
  - `STRIPE_PRICE_PACK` (ancien PACK5)
  - `STRIPE_PRICE_UNLIMITED` (ancien PACK30)
- ✅ Ajout de `user_id` dans les metadata Stripe (si disponible)

---

### **3. Backend - API Analyse**
**Fichier :** `functions/api/analyse.ts`

**Changements :**
- ✅ Suppression de la logique manuelle de consommation des crédits
- ✅ Remplacement par un appel RPC `consume_credit(p_user_id)`
- ✅ Récupération du `user_id` depuis l'email (requête sur `auth.users`)
- ✅ Gestion des cas : UNLIMITED, crédits disponibles, crédits insuffisants
- ✅ Réponse enrichie avec `remaining`, `unlimited` dans `quota`

---

### **4. Frontend - Page Pricing**
**Fichier :** `src/app/pricing/page.tsx`

**Changements :**
- ✅ Mise à jour des IDs de plans : `'SINGLE' | 'PACK' | 'UNLIMITED'`
- ✅ Renommage du pack30 en **"Pack Illimité"**
- ✅ Description : "Analyses illimitées pendant 30 jours"
- ✅ Envoi du planType correct dans l'appel API

**Anciens plans :**
```typescript
{ id: 'single', name: 'Analyse Unique', credits: 1, price: 4.9 }
{ id: 'pack5', name: 'Pack 5 Analyses', credits: 5, price: 14.9 }
{ id: 'pack30', name: 'Pack 30 Analyses', credits: 30, price: 59 }
```

**Nouveaux plans :**
```typescript
{ id: 'SINGLE', name: 'Analyse Unique', description: '1 analyse IA complète', price: 4.9 }
{ id: 'PACK', name: 'Pack 5 Analyses', description: '5 analyses IA complètes', price: 14.9 }
{ id: 'UNLIMITED', name: 'Pack Illimité', description: 'Analyses illimitées pendant 30 jours', price: 59 }
```

---

## 🔄 **MIGRATION REQUISE**

⚠️ **ATTENTION :** Ce refactoring nécessite une migration en production.

**Actions obligatoires :**
1. Exécuter le script SQL dans Supabase
2. Mettre à jour les variables d'environnement Cloudflare
3. Déployer le code (commit + push)
4. Tester le flux complet

**Voir le guide complet :** `MIGRATION_SPRINT7_GUIDE.md`

---

## 🧪 **TESTS RECOMMANDÉS**

| Test | Objectif | Résultat attendu |
|------|----------|------------------|
| Inscription nouvel utilisateur | Trigger auto plan FREE | Ligne dans `subscriptions` avec `plan_type=FREE` |
| Achat plan UNLIMITED | Webhook + DB update | `subscriptions.plan_type=UNLIMITED`, `credits=null`, `valid_until` dans 30j |
| Achat plan PACK | Webhook + DB update | `subscriptions.plan_type=PACK`, `credits=5`, `valid_until` dans 1 an |
| Analyse avec plan illimité | RPC consume_credit | `credits_consumed` incrémenté, `credits=null` (pas de décrément) |
| Analyse avec plan PACK | RPC consume_credit | `credits` décrémenté (5→4), `credits_consumed` incrémenté |

---

## 📊 **IMPACT SUR LES UTILISATEURS EXISTANTS**

### **Scénario 1 : Utilisateurs avec crédits dans l'ancien système**
- ⚠️ Les crédits dans `paid_plans` seront perdus (table supprimée)
- 💡 Solution : Export CSV avant migration + réinjection manuelle

### **Scénario 2 : Nouveaux utilisateurs après migration**
- ✅ Plan FREE auto-créé à l'inscription
- ✅ Achat de crédits fonctionne immédiatement

### **Scénario 3 : Utilisateurs existants sans crédits**
- ✅ Aucun impact (quota démo continue de fonctionner)

---

## 🔒 **SÉCURITÉ & PERFORMANCE**

### **Avantages du nouveau système :**
- ✅ **Atomicité** : La RPC `consume_credit` utilise `FOR UPDATE` (verrouillage de ligne)
- ✅ **No race conditions** : Impossible de consommer 2 crédits simultanément
- ✅ **RLS activée** : Les utilisateurs ne peuvent lire que leurs propres données
- ✅ **Service Role** : Les webhooks et API backend ont un accès complet

### **Points de vigilance :**
- ⚠️ La RPC nécessite une connexion avec `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ Le webhook récupère le `user_id` depuis l'email (requête supplémentaire)

---

## 📈 **PROCHAINES AMÉLIORATIONS (POST-MIGRATION)**

1. **Passer le `user_id` dans les metadata Stripe** (éviter la requête `auth.users`)
2. **Tableau de bord utilisateur** : Afficher les crédits restants, historique des achats
3. **Gestion des abonnements récurrents** : Si le plan UNLIMITED devient un vrai abonnement Stripe
4. **Notifications** : Email quand il reste 1 crédit, quand le plan expire
5. **Analytics** : Tracking du taux de conversion Free → Paid

---

## 📞 **CONTACT**

En cas de question sur ce refactoring :
- Consulte d'abord `MIGRATION_SPRINT7_GUIDE.md`
- Vérifie les logs Cloudflare et Supabase
- Contacte l'équipe tech si bloquant

---

**Refactoring effectué par :** Cursor AI Agent  
**Validé par :** En attente de tests utilisateur  
**Date de déploiement prévue :** À définir après validation

---

✅ **Le code est prêt. La migration peut commencer dès que tu as vérifié les données existantes.** 🚀

