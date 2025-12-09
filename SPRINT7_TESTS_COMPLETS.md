# ✅ TESTS COMPLETS SPRINT 7 - MONÉTISATION

---

## 📋 **PRÉ-REQUIS (À VÉRIFIER AVANT DE COMMENCER)**

### ✅ **1. Migration SQL Supabase**

**Action : Ouvre Supabase Dashboard → SQL Editor**

Vérifie que les tables suivantes existent :
- [ ] Table `subscriptions` (colonnes : `user_id`, `plan_type`, `credits`, `credits_consumed`, `valid_until`, `status`)
- [ ] Table `payments` (colonnes : `user_id`, `stripe_checkout_session_id`, `amount_cents`, `plan_type`, `credits`, `valid_until`, `status`)
- [ ] Fonction RPC `consume_credit` (dans **Database** → **Functions**)

**Si ces éléments n'existent pas :**
1. Ouvre le fichier `supabase_migration_sprint7_refactor.sql`
2. Copie tout le contenu
3. Exécute-le dans **SQL Editor**

---

### ✅ **2. Variables d'environnement Cloudflare**

**Action : Ouvre Cloudflare Dashboard → Workers & Pages → Ton projet → Settings → Environment variables**

Vérifie que ces variables existent :
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_SINGLE` (ex: `price_1xxx`)
- [ ] `STRIPE_PRICE_PACK` (ex: `price_1yyy`)
- [ ] `STRIPE_PRICE_UNLIMITED` (ex: `price_1zzz`)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Si des variables manquent :** Ajoute-les maintenant.

---

### ✅ **3. Build Cloudflare réussi**

- [ ] Le dernier build sur Cloudflare Pages est **vert** (succès)
- [ ] Le site est accessible sur `https://www.checktonvehicule.fr`

---

## 🧪 **TEST 1 : VÉRIFICATION DES PAGES FRONTEND**

### **1.1 - Page d'accueil**

**URL :** `https://www.checktonvehicule.fr`

**Vérifications :**
- [ ] La page se charge sans erreur
- [ ] Le formulaire d'analyse est visible
- [ ] Il y a un lien ou bouton vers `/pricing` (ex: "Voir les formules payantes")

---

### **1.2 - Page Pricing**

**URL :** `https://www.checktonvehicule.fr/pricing`

**Vérifications :**
- [ ] La page affiche **3 plans** :
  - **Analyse Unique** (4,9 €) - 1 crédit
  - **Pack 5 Analyses** (14,9 €) - 5 crédits valables 1 an
  - **Pack Illimité** (59 €) - Analyses illimitées pendant 30 jours
- [ ] Chaque plan a un bouton **"Choisir ce plan"**
- [ ] Les prix affichés correspondent exactement à ceux de Stripe

---

### **1.3 - Pages de redirection Stripe**

**URL Success :** `https://www.checktonvehicule.fr/billing/success`
**URL Cancel :** `https://www.checktonvehicule.fr/billing/cancel`

**Vérifications :**
- [ ] Les deux pages se chargent sans erreur (même sans `session_id` dans l'URL)
- [ ] La page `/billing/success` affiche un message de confirmation
- [ ] La page `/billing/cancel` affiche un message d'annulation

---

## 🧪 **TEST 2 : FLUX COMPLET - PLAN "ANALYSE UNIQUE" (SINGLE)**

### **2.1 - Sélection du plan**

1. Va sur `https://www.checktonvehicule.fr/pricing`
2. Clique sur **"Choisir ce plan"** pour **Analyse Unique (4,9 €)**
3. Entre un **email de test** (ex: `test.single@example.com`)
4. Clique sur **Continuer vers le paiement**

**Vérifications :**
- [ ] Tu es redirigé vers **Stripe Checkout**
- [ ] Le montant affiché est **4,90 €**
- [ ] L'email pré-rempli correspond à celui que tu as saisi

---

### **2.2 - Paiement Stripe (Mode Test)**

**Utilise cette carte de test :**
- Numéro : `4242 4242 4242 4242`
- Date d'expiration : N'importe quelle date future (ex: `12/25`)
- CVC : N'importe quel 3 chiffres (ex: `123`)
- Email : Confirme l'email de test

**Clique sur "Payer"**

**Vérifications :**
- [ ] Le paiement est accepté
- [ ] Tu es redirigé vers `https://www.checktonvehicule.fr/billing/success`
- [ ] Un message de succès s'affiche

---

### **2.3 - Vérification dans Stripe Dashboard**

**Action : Ouvre Stripe Dashboard → Payments**

**Vérifications :**
- [ ] Le paiement de **4,90 €** apparaît avec le statut **Succeeded**
- [ ] Le **Customer email** correspond à ton email de test

**Action : Ouvre Stripe Dashboard → Webhooks → Événements récents**

**Vérifications :**
- [ ] Un événement `checkout.session.completed` est présent
- [ ] Le statut du webhook est **200 OK** (pas d'erreur)

---

### **2.4 - Vérification dans Supabase**

**Action : Ouvre Supabase Dashboard → Table Editor**

#### **Table `auth.users`**
- [ ] Un utilisateur existe avec l'email `test.single@example.com`
- [ ] Note le `id` de cet utilisateur (UUID)

#### **Table `subscriptions`**
- [ ] Une ligne existe avec :
  - `user_id` = UUID de l'utilisateur
  - `plan_type` = `SINGLE`
  - `credits` = `1`
  - `credits_consumed` = `0`
  - `valid_until` = `null` (pas d'expiration)
  - `status` = `active`

#### **Table `payments`**
- [ ] Une ligne existe avec :
  - `user_id` = UUID de l'utilisateur
  - `amount_cents` = `490` (4,90 €)
  - `plan_type` = `SINGLE`
  - `credits` = `1`
  - `status` = `succeeded`

---

### **2.5 - Utilisation du crédit (Analyse)**

1. Retourne sur `https://www.checktonvehicule.fr`
2. Entre l'**email de test** (`test.single@example.com`)
3. Entre une **immatriculation de test** (ex: `AB-123-CD`)
4. Remplis les autres champs (kilométrage, prix, etc.)
5. Soumets le formulaire

**Vérifications :**
- [ ] L'analyse se lance (spinner de chargement)
- [ ] Le résultat de l'analyse s'affiche
- [ ] **Aucune erreur de quota** n'apparaît

**Action : Retourne dans Supabase → Table `subscriptions`**

**Vérifications :**
- [ ] `credits` = `1` (inchangé)
- [ ] `credits_consumed` = `1` (incrémenté)
- [ ] `status` = `active`

---

### **2.6 - Test du quota épuisé**

1. Essaie de faire une **2ème analyse** avec le même email (`test.single@example.com`)

**Vérifications :**
- [ ] Une erreur `QUOTA_EXCEEDED` s'affiche
- [ ] Un message invite à acheter plus de crédits
- [ ] Un bouton **"Voir les formules payantes"** apparaît (lien vers `/pricing`)

---

## 🧪 **TEST 3 : FLUX COMPLET - PLAN "PACK 5 ANALYSES" (PACK)**

### **3.1 - Sélection du plan**

1. Va sur `https://www.checktonvehicule.fr/pricing`
2. Clique sur **"Choisir ce plan"** pour **Pack 5 Analyses (14,9 €)**
3. Entre un **nouvel email de test** (ex: `test.pack@example.com`)
4. Clique sur **Continuer vers le paiement**

**Vérifications :**
- [ ] Tu es redirigé vers **Stripe Checkout**
- [ ] Le montant affiché est **14,90 €**

---

### **3.2 - Paiement Stripe**

**Utilise la carte de test :** `4242 4242 4242 4242`

**Clique sur "Payer"**

**Vérifications :**
- [ ] Le paiement est accepté
- [ ] Tu es redirigé vers `/billing/success`

---

### **3.3 - Vérification dans Supabase**

**Action : Ouvre Supabase → Table `subscriptions`**

**Vérifications :**
- [ ] Une ligne existe avec :
  - `user_id` = UUID de `test.pack@example.com`
  - `plan_type` = `PACK`
  - `credits` = `5`
  - `credits_consumed` = `0`
  - `valid_until` = Date dans **365 jours** (environ 1 an)
  - `status` = `active`

**Action : Ouvre Supabase → Table `payments`**

**Vérifications :**
- [ ] Une ligne existe avec :
  - `amount_cents` = `1490` (14,90 €)
  - `plan_type` = `PACK`
  - `credits` = `5`

---

### **3.4 - Utilisation des crédits**

1. Fais une analyse avec l'email `test.pack@example.com`

**Vérifications après l'analyse :**
- [ ] `credits` = `5` (inchangé)
- [ ] `credits_consumed` = `1`

2. Fais **4 autres analyses** avec le même email

**Vérifications finales :**
- [ ] `credits` = `5`
- [ ] `credits_consumed` = `5`

3. Essaie une **6ème analyse**

**Vérifications :**
- [ ] Erreur `QUOTA_EXCEEDED` s'affiche
- [ ] Message : "Tous vos crédits ont été utilisés"

---

## 🧪 **TEST 4 : FLUX COMPLET - PLAN "ILLIMITÉ" (UNLIMITED)**

### **4.1 - Sélection du plan**

1. Va sur `https://www.checktonvehicule.fr/pricing`
2. Clique sur **"Choisir ce plan"** pour **Pack Illimité (59 €)**
3. Entre un **nouvel email de test** (ex: `test.unlimited@example.com`)
4. Clique sur **Continuer vers le paiement**

**Vérifications :**
- [ ] Tu es redirigé vers **Stripe Checkout**
- [ ] Le montant affiché est **59,00 €**

---

### **4.2 - Paiement Stripe**

**Utilise la carte de test :** `4242 4242 4242 4242`

**Clique sur "Payer"**

**Vérifications :**
- [ ] Le paiement est accepté
- [ ] Tu es redirigé vers `/billing/success`

---

### **4.3 - Vérification dans Supabase**

**Action : Ouvre Supabase → Table `subscriptions`**

**Vérifications :**
- [ ] Une ligne existe avec :
  - `user_id` = UUID de `test.unlimited@example.com`
  - `plan_type` = `UNLIMITED`
  - `credits` = `null` (illimité)
  - `credits_consumed` = `0`
  - `valid_until` = Date dans **30 jours**
  - `status` = `active`

**Action : Ouvre Supabase → Table `payments`**

**Vérifications :**
- [ ] Une ligne existe avec :
  - `amount_cents` = `5900` (59,00 €)
  - `plan_type` = `UNLIMITED`
  - `credits` = `null`

---

### **4.4 - Utilisation illimitée**

1. Fais **5 analyses** avec l'email `test.unlimited@example.com`

**Vérifications après chaque analyse :**
- [ ] Aucune erreur de quota
- [ ] L'analyse s'exécute normalement

**Action : Vérifie dans Supabase → Table `subscriptions`**

**Vérifications :**
- [ ] `credits` = `null` (reste illimité)
- [ ] `credits_consumed` = `5` (incrémenté à chaque analyse)
- [ ] `status` = `active`

---

## 🧪 **TEST 5 : ACHAT MULTIPLE (AJOUT DE CRÉDITS)**

### **5.1 - Achat d'un 2ème pack avec le même email**

**Objectif :** Vérifier que les crédits s'additionnent.

1. Va sur `https://www.checktonvehicule.fr/pricing`
2. Clique sur **"Pack 5 Analyses"**
3. **Utilise le même email** que pour le Test 3 (ex: `test.pack@example.com`)
4. Effectue le paiement

**Vérifications dans Supabase → Table `subscriptions` :**
- [ ] `credits` = `10` (5 + 5)
- [ ] `credits_consumed` = `5` (inchangé depuis le Test 3)
- [ ] Pas de nouvelle ligne créée (même `user_id`, mise à jour de la ligne existante)

---

## 🧪 **TEST 6 : QUOTA DÉMO (EMAIL SANS PAIEMENT)**

### **6.1 - Utilisation du quota démo**

1. Va sur `https://www.checktonvehicule.fr`
2. Entre un **nouvel email** (ex: `demo@example.com`) qui n'a JAMAIS payé
3. Fais une analyse

**Vérifications :**
- [ ] L'analyse fonctionne (1ère analyse gratuite)
- [ ] Aucune ligne n'est créée dans la table `subscriptions` (car pas d'inscription)

2. Essaie une **2ème analyse** avec le même email

**Vérifications :**
- [ ] Erreur `QUOTA_EXCEEDED` s'affiche
- [ ] Message : "Vous avez atteint la limite de la démo gratuite"
- [ ] Bouton vers `/pricing` apparaît

---

## 🧪 **TEST 7 : EMAIL ILLIMITÉ SPÉCIAL**

### **7.1 - Test de l'email admin**

**Email spécial :** `saas.ia.automobile@gmail.com`

1. Va sur `https://www.checktonvehicule.fr`
2. Entre l'email `saas.ia.automobile@gmail.com`
3. Fais **10 analyses** d'affilée

**Vérifications :**
- [ ] Aucune erreur de quota
- [ ] Toutes les analyses s'exécutent
- [ ] La réponse API contient `"unlimited": true`

---

## 🧪 **TEST 8 : EXPIRATION DU PLAN**

### **8.1 - Simuler une expiration**

**Action manuelle dans Supabase :**

1. Ouvre **Table Editor** → `subscriptions`
2. Trouve la ligne de `test.pack@example.com`
3. Édite la colonne `valid_until` et mets une **date passée** (ex: `2024-01-01`)
4. Sauvegarde

**Test d'analyse :**

1. Essaie de faire une analyse avec `test.pack@example.com`

**Vérifications :**
- [ ] Erreur `QUOTA_EXCEEDED` ou `PLAN_EXPIRED` s'affiche
- [ ] Message : "Votre abonnement a expiré"

---

## 📊 **RÉSUMÉ DES TESTS**

| Test | Objectif | Statut |
|------|----------|--------|
| 1 | Pages frontend (accueil, pricing, success, cancel) | [ ] |
| 2 | Plan SINGLE (achat + consommation + épuisement) | [ ] |
| 3 | Plan PACK (achat + consommation multiple) | [ ] |
| 4 | Plan UNLIMITED (achat + utilisation illimitée) | [ ] |
| 5 | Ajout de crédits (achat multiple) | [ ] |
| 6 | Quota démo (utilisateur gratuit) | [ ] |
| 7 | Email illimité admin | [ ] |
| 8 | Expiration de plan | [ ] |

---

## 🆘 **EN CAS DE PROBLÈME**

### **Erreur : "Prix Stripe non configuré"**
**Solution :** Vérifie les variables d'environnement Cloudflare (`STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_PACK`, `STRIPE_PRICE_UNLIMITED`)

### **Erreur : Webhook Stripe échoue (HTTP 400)**
**Solution :**
1. Vide le cache Cloudflare (**Caching** → **Purge Everything**)
2. Attends 1 minute
3. Refais un paiement test

### **Erreur : "User not found" dans les logs webhook**
**Solution :** L'email n'existe pas dans `auth.users`. Pour créer un utilisateur, fais d'abord une analyse (cela crée l'email dans la table `user_analyses`).

### **Erreur : "Fonction consume_credit introuvable"**
**Solution :** Le script SQL n'a pas été exécuté. Relis la section **PRÉ-REQUIS**.

---

## ✅ **VALIDATION FINALE**

Une fois tous les tests effectués avec succès :
- [ ] Tous les paiements Stripe sont en statut **Succeeded**
- [ ] Tous les webhooks Stripe sont en statut **200 OK**
- [ ] Les crédits s'ajoutent et se consomment correctement dans Supabase
- [ ] Les quotas gratuits et payants fonctionnent comme prévu
- [ ] Les pages de redirection sont opérationnelles

---

**🎉 SI TOUS LES TESTS PASSENT, LE SPRINT 7 EST VALIDÉ ! 🎉**

