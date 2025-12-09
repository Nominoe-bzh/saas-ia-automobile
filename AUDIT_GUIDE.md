# 🔍 GUIDE D'AUDIT SPRINT 7 - MONÉTISATION

---

## 📋 **CONTEXTE**

Ce guide documente l'audit complet du Sprint 7 demandé par **GEMINI** (Auditeur/Consultant) et exécuté par **CURSOR** (Ingénieur de Développement Logiciel).

---

## 🎯 **OBJECTIF DE L'AUDIT**

Valider le fonctionnement **Business** et **Data** de la monétisation :

1. ✅ **Infrastructure BDD** : Tables, RLS, schéma, fonction RPC
2. ✅ **Flux de paiement** : Stripe Checkout → Webhook → Crédits
3. ✅ **Protection** : API bloque les utilisateurs sans crédit

---

## 🚀 **MÉTHODE 1 : AUDIT AUTOMATISÉ (RECOMMANDÉ)**

### **Prérequis**

1. Node.js 20+ installé
2. Accès aux variables d'environnement (Supabase + Stripe)

### **Étapes d'exécution**

#### **1. Créer un fichier `.env.local`**

Crée un fichier `.env.local` à la racine du projet avec ces variables :

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_SINGLE=price_xxxxx
STRIPE_PRICE_PACK=price_xxxxx
STRIPE_PRICE_UNLIMITED=price_xxxxx

# Base URL
BASE_URL=https://www.checktonvehicule.fr
```

**Où trouver ces valeurs ?**
- **SUPABASE_URL** et **SUPABASE_SERVICE_ROLE_KEY** : Supabase Dashboard → Settings → API
- **STRIPE_SECRET_KEY** : Stripe Dashboard → Developers → API keys
- **STRIPE_PRICE_XXX** : Stripe Dashboard → Products → copier les Price IDs

#### **2. Installer les dépendances (si ce n'est pas déjà fait)**

```bash
npm install
```

#### **3. Exécuter le script d'audit**

```bash
node audit-sprint7.mjs
```

#### **4. Suivre les instructions**

Le script va :
1. Vérifier l'infrastructure Supabase (tables, RLS, RPC)
2. Te demander si tu veux tester le flux de paiement (interaction manuelle requise)
3. Générer un lien de paiement Stripe test
4. Attendre que tu complètes le paiement
5. Vérifier que les crédits ont été ajoutés
6. Tester la protection de l'API (quota 0)
7. Générer un **rapport final** avec un score global

---

## 🧪 **MÉTHODE 2 : AUDIT MANUEL (SANS SCRIPT)**

Si tu préfères vérifier manuellement, suis ce plan :

### **ÉTAPE 1 : VÉRIFICATION DE L'INFRASTRUCTURE**

#### **1.1 - Tables créées**

**Action :** Va sur **Supabase Dashboard** → **Table Editor**

**Vérifie que ces tables existent :**
- [ ] `subscriptions` (colonnes : user_id, plan_type, credits, credits_consumed, valid_until, status)
- [ ] `payments` (colonnes : user_id, stripe_checkout_session_id, amount_cents, plan_type, status)

**Vérifie que ces tables ont été supprimées :**
- [ ] `paid_plans` (ancienne table obsolète)

#### **1.2 - Policies RLS actives**

**Action :** Pour chaque table (`subscriptions`, `payments`), clique sur **Policies**

**Vérifie que ces policies existent :**
- [ ] "service_role can do everything" (pour service_role)
- [ ] "Users can view their own subscriptions" (pour authenticated)
- [ ] "Users can view their own payments" (pour authenticated)

#### **1.3 - Schéma de la table subscriptions**

**Action :** Clique sur la table `subscriptions` et regarde les colonnes

**Colonnes attendues :**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key vers auth.users)
- `plan_type` (text : FREE, SINGLE, PACK, UNLIMITED)
- `credits` (integer, nullable pour UNLIMITED)
- `credits_consumed` (integer, default 0)
- `valid_until` (timestamptz, nullable)
- `status` (text : active, expired, cancelled)
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `created_at` (timestamptz, auto)
- `updated_at` (timestamptz, auto)

#### **1.4 - Fonction RPC consume_credit**

**Action :** Va sur **Database** → **Functions**

**Vérifie que cette fonction existe :**
- [ ] `consume_credit(p_user_id uuid)` → returns boolean

---

### **ÉTAPE 2 : TEST DU FLUX DE PAIEMENT**

#### **2.1 - Créer un utilisateur de test**

**Option A : Via l'API Supabase Admin (recommandé)**
```bash
curl -X POST 'https://xxxxx.supabase.co/auth/v1/admin/users' \
  -H 'apikey: SERVICE_ROLE_KEY' \
  -H 'Authorization: Bearer SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "email_confirm": true}'
```

**Option B : Via l'interface**
1. Va sur **Authentication** → **Users** → **Add user**
2. Entre un email : `test.audit@example.com`
3. Valide l'email

**Note le `user_id` (UUID) de l'utilisateur créé.**

#### **2.2 - Générer un lien de paiement Stripe**

**Via l'API :**
```bash
curl -X POST 'https://www.checktonvehicule.fr/api/billing/create-checkout-session' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test.audit@example.com",
    "planType": "SINGLE",
    "userId": "UUID_DE_L_UTILISATEUR"
  }'
```

**Résultat attendu :**
```json
{
  "ok": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxxxx",
  "sessionId": "cs_test_xxxxx"
}
```

#### **2.3 - Effectuer le paiement test**

1. Ouvre le `checkoutUrl` dans ton navigateur
2. Utilise la **carte de test Stripe** : `4242 4242 4242 4242`
3. Date : `12/25`, CVC : `123`
4. Complète le paiement

#### **2.4 - Vérifier les crédits dans Supabase**

**Action :** Va sur **Supabase** → **Table Editor** → `subscriptions`

**Vérifie qu'une ligne existe avec :**
- [ ] `user_id` = UUID de ton utilisateur test
- [ ] `plan_type` = `SINGLE`
- [ ] `credits` = `1`
- [ ] `credits_consumed` = `0`
- [ ] `valid_until` = `null` (pas d'expiration)
- [ ] `status` = `active`

**Action :** Va sur **Table Editor** → `payments`

**Vérifie qu'une ligne existe avec :**
- [ ] `user_id` = UUID de ton utilisateur test
- [ ] `amount_cents` = `490` (4,90 €)
- [ ] `plan_type` = `SINGLE`
- [ ] `status` = `succeeded`

---

### **ÉTAPE 3 : TEST DE PROTECTION**

#### **3.1 - Créer un utilisateur SANS crédit**

**Action :** Crée un nouvel utilisateur (comme à l'étape 2.1), mais **NE FAIS PAS de paiement**.

**Option manuelle : Créer une subscription avec 0 crédit**
```sql
INSERT INTO subscriptions (user_id, plan_type, credits, credits_consumed, status)
VALUES ('UUID_DE_L_UTILISATEUR', 'FREE', 0, 0, 'active');
```

#### **3.2 - Tenter une analyse avec 0 crédit**

**Via l'API :**
```bash
curl -X POST 'https://www.checktonvehicule.fr/api/analyse' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test.quota0@example.com",
    "immatriculation": "AB-123-CD",
    "kilometrage": "50000",
    "prixAchat": "15000",
    "carteGrise": "Présente",
    "contrôleTechnique": "En cours de validité"
  }'
```

**Résultat attendu :**
```json
{
  "ok": false,
  "error": "QUOTA_EXCEEDED",
  "message": "Vous avez épuisé vos crédits..."
}
```

**❌ SI l'analyse se lance MALGRÉ 0 crédit → ÉCHEC CRITIQUE DE SÉCURITÉ**

---

## 📊 **RAPPORT FINAL**

Une fois tous les tests effectués, remplis ce tableau :

| Test | Description | Statut |
|------|-------------|--------|
| 1.1 | Tables `subscriptions` et `payments` existent | [ ] SUCCÈS / [ ] ÉCHEC |
| 1.2 | RLS Policies actives sur les tables | [ ] SUCCÈS / [ ] ÉCHEC |
| 1.3 | Schéma `subscriptions` conforme | [ ] SUCCÈS / [ ] ÉCHEC |
| 1.4 | Fonction RPC `consume_credit` existe | [ ] SUCCÈS / [ ] ÉCHEC |
| 2.1 | Création utilisateur de test | [ ] SUCCÈS / [ ] ÉCHEC |
| 2.2 | Génération lien de paiement Stripe | [ ] SUCCÈS / [ ] ÉCHEC |
| 2.3 | Paiement test Stripe réussi | [ ] SUCCÈS / [ ] ÉCHEC |
| 2.4 | Crédits ajoutés dans Supabase | [ ] SUCCÈS / [ ] ÉCHEC |
| 3.1 | Utilisateur sans crédit créé | [ ] SUCCÈS / [ ] ÉCHEC |
| 3.2 | API bloque l'analyse (QUOTA_EXCEEDED) | [ ] SUCCÈS / [ ] ÉCHEC |

**Score global :** ___/10 tests réussis

---

## 🚨 **ANOMALIES STRUCTURELLES DÉTECTÉES ?**

Si un des tests suivants ÉCHOUE, c'est une **anomalie structurelle critique** :

- [ ] Table `subscriptions` manquante → **Exécuter le script SQL de migration**
- [ ] Table `payments` manquante → **Exécuter le script SQL de migration**
- [ ] Fonction RPC `consume_credit` manquante → **Exécuter le script SQL de migration**
- [ ] API non protégée (analyse avec 0 crédit fonctionne) → **Bug critique de sécurité**

**Solution :** Si une de ces anomalies est détectée, exécute immédiatement le script SQL :
```bash
# Fichier : supabase_migration_sprint7_refactor.sql
# Supabase Dashboard → SQL Editor → Colle le contenu → Run
```

---

## ✅ **VALIDATION FINALE**

**Pour valider le Sprint 7, TOUS les tests doivent être en SUCCÈS.**

Si 1 ou plusieurs tests échouent :
1. Note exactement quel(s) test(s) échouent
2. Copie les messages d'erreur
3. Signale à CURSOR (Ingénieur) pour correction immédiate

---

## 📞 **CONTACT**

- **GEMINI** (Auditeur) : Revue des résultats et recommandations
- **CURSOR** (Ingénieur) : Corrections techniques et débogage
- **CHATGPT** (Stratège) : Ajustements business si nécessaire

---

**Date de l'audit :** 2025-12-09  
**Version du Sprint :** 7 (Monétisation)  
**Build Cloudflare :** ✅ Réussi

