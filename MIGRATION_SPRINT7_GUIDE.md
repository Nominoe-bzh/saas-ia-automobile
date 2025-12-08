# 🔧 GUIDE DE MIGRATION SPRINT 7 - REFACTORING MONÉTISATION

---

## 📋 **RÉSUMÉ DES CHANGEMENTS**

### **Ancien système (à supprimer) :**
- Table `paid_plans` (basée sur email, crédits manuels)
- Table `payments` (structure simple)
- Logique de crédits dans `/api/analyse` (manuelle, risque de race conditions)

### **Nouveau système (conforme au Business Plan) :**
- Table `subscriptions` (basée sur `user_id`, avec trigger auto pour plan FREE)
- Table `payments` (refactorisée avec colonnes enrichies)
- Fonction RPC `consume_credit()` (consommation atomique côté DB)
- Gestion des 3 types de plans : **SINGLE**, **PACK**, **UNLIMITED**

---

## 🚀 **ÉTAPES DE MIGRATION (À SUIVRE DANS L'ORDRE)**

### **ÉTAPE 1 : Exécuter le script SQL dans Supabase**

1. Va sur **Supabase Dashboard** → **SQL Editor**
2. Ouvre le fichier `supabase_migration_sprint7_refactor.sql`
3. Copie/colle tout le contenu dans l'éditeur SQL
4. **IMPORTANT** : Vérifie qu'il n'y a **que des données de test** dans `paid_plans` et `payments` (le script va les supprimer)
5. Clique sur **"Run"**

**Ce que fait ce script :**
- Supprime les anciennes tables `paid_plans` et `payments`
- Crée la nouvelle table `subscriptions` avec colonnes `user_id`, `plan_type`, `credits`, `valid_until`, etc.
- Crée la nouvelle table `payments` (refactorisée)
- Crée un **trigger** qui ajoute automatiquement un plan FREE à chaque nouvel utilisateur inscrit
- Crée la fonction RPC `consume_credit()` pour gérer la consommation atomique
- Active la RLS (Row Level Security) avec politiques adaptées

---

### **ÉTAPE 2 : Mettre à jour les variables d'environnement Cloudflare**

1. Va sur **Cloudflare Dashboard** → **Workers & Pages** → ton projet → **Settings** → **Environment variables**

2. **Renomme/Ajoute les variables Stripe :**

   **Anciennes variables (à supprimer) :**
   - `STRIPE_PRICE_PACK5`
   - `STRIPE_PRICE_PACK30`

   **Nouvelles variables (à ajouter) :**
   - `STRIPE_PRICE_SINGLE` = `price_xxx` (garde la même valeur si elle existe déjà)
   - `STRIPE_PRICE_PACK` = `price_xxx` (utilise l'ancien STRIPE_PRICE_PACK5)
   - `STRIPE_PRICE_UNLIMITED` = `price_xxx` (utilise l'ancien STRIPE_PRICE_PACK30 OU crée un nouveau Price dans Stripe)

3. **Vérifie que toutes les variables suivantes existent :**
   - ✅ `STRIPE_SECRET_KEY`
   - ✅ `STRIPE_WEBHOOK_SECRET`
   - ✅ `STRIPE_PRICE_SINGLE`
   - ✅ `STRIPE_PRICE_PACK`
   - ✅ `STRIPE_PRICE_UNLIMITED`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `RESEND_API_KEY`
   - ✅ `MAIL_FROM`
   - ✅ `OPENAI_API_KEY`

4. **Applique les changements aux 2 environnements :**
   - Production
   - Preview (si activé)

---

### **ÉTAPE 3 : Mettre à jour les Price IDs dans Stripe (si nécessaire)**

Si tu veux que le **Pack Illimité** soit vraiment un abonnement mensuel (et pas un paiement unique) :

1. Va sur **Stripe Dashboard** → **Products**
2. Crée un nouveau produit : **"Pack Illimité - Analyses IA"**
3. Ajoute un **Price** :
   - Type : **Subscription** (récurrent) OU **One-time** (paiement unique)
   - Montant : **59,00 €**
   - Période : **Mensuel** (si abonnement)
4. Copie le **Price ID** (ex: `price_1XXXXX`)
5. Mets à jour `STRIPE_PRICE_UNLIMITED` dans Cloudflare avec ce nouveau Price ID

---

### **ÉTAPE 4 : Déployer les changements**

Tous les fichiers ont été modifiés localement. Il faut maintenant commit + push :

```bash
git add .
git commit -m "Refactor Sprint 7: Subscriptions + RPC + 3 plan types"
git push origin main
```

Cloudflare va automatiquement redéployer le site (attendre 2-3 minutes).

---

### **ÉTAPE 5 : Vérifier le déploiement**

1. Va sur **Cloudflare Dashboard** → **Workers & Pages** → ton projet → **Deployments**
2. Attends que le dernier déploiement soit **"Active"** (pastille verte)
3. Clique sur **"View deployment"** pour voir les logs

---

## 🧪 **TESTS DE VALIDATION (OBLIGATOIRE)**

### **Test 1 : Inscription d'un nouvel utilisateur**

**Objectif :** Vérifier que le trigger crée automatiquement un plan FREE.

1. Inscris un **nouvel utilisateur** (si tu n'as pas encore d'auth UI, tu peux le faire via Supabase Auth UI)
2. Va sur **Supabase** → Table **`subscriptions`**
3. **Résultat attendu :** Une nouvelle ligne avec :
   - `user_id` = UUID de l'utilisateur
   - `plan_type` = `FREE`
   - `credits` = `0`
   - `status` = `active`

---

### **Test 2 : Achat d'un plan payant**

**Objectif :** Vérifier que le webhook crée/met à jour l'abonnement.

1. Va sur **https://www.checktonvehicule.fr/pricing**
2. Entre un email de test (ex: `test.refactor@example.com`)
3. Choisis **Pack Illimité** (59€)
4. Utilise la carte test : `4242 4242 4242 4242`
5. Finalise le paiement

**Vérifications :**

#### Dans Stripe :
- Dashboard → **Webhooks** → **engaging-finesse** → **Event deliveries**
- Le dernier événement doit être **HTTP 200** ✅
- Clique dessus et regarde les logs : tu dois voir `"🚀 WEBHOOK STRIPE V3 - REFACTORED WITH SUBSCRIPTIONS TABLE"`

#### Dans Supabase - Table `payments` :
- Nouvelle ligne avec :
  - `user_id` = UUID de l'utilisateur (récupéré depuis l'email)
  - `plan_type` = `UNLIMITED`
  - `credits` = `null`
  - `valid_until` = Date dans 30 jours
  - `status` = `succeeded`

#### Dans Supabase - Table `subscriptions` :
- La ligne de l'utilisateur doit avoir été mise à jour :
  - `plan_type` = `UNLIMITED`
  - `credits` = `null`
  - `valid_until` = Date dans 30 jours
  - `status` = `active`

---

### **Test 3 : Consommation d'un crédit via RPC**

**Objectif :** Vérifier que l'API `/api/analyse` utilise bien la RPC.

1. Va sur **https://www.checktonvehicule.fr**
2. Entre l'email utilisé pour l'achat (ex: `test.refactor@example.com`)
3. Colle une annonce LeBonCoin
4. Lance l'analyse

**Vérifications :**

#### Dans la console navigateur (F12) :
- La réponse de l'API doit contenir :
  ```json
  {
    "ok": true,
    "quota": {
      "source": "paid",
      "message": "Plan illimité",
      "remaining": null,
      "unlimited": true
    }
  }
  ```

#### Dans Supabase - Table `subscriptions` :
- Le champ `credits_consumed` doit avoir été incrémenté de 1
- Le champ `credits` doit rester `null` (car plan illimité)

---

### **Test 4 : Achat d'un Pack 5 (crédits limités)**

1. Refais un achat avec un **nouvel email**
2. Choisis **Pack 5 Analyses** (14,9€)
3. Finalise le paiement

**Vérifications dans Supabase - Table `subscriptions` :**
- `plan_type` = `PACK`
- `credits` = `5`
- `valid_until` = Date dans 365 jours (1 an)

Fais une analyse avec cet email :
- Les `credits` doivent passer de `5` → `4`
- Le champ `credits_consumed` doit passer de `0` → `1`

---

## 🔄 **CORRESPONDANCE DES PLANS (ANCIEN → NOUVEAU)**

| **Ancien système**                | **Nouveau système**         | **Stripe Price ID à utiliser**         |
|-----------------------------------|-----------------------------|----------------------------------------|
| `single` (1 crédit, 4,9€)         | `SINGLE` (1 crédit, ∞)      | `STRIPE_PRICE_SINGLE`                  |
| `pack5` (5 crédits, 14,9€)        | `PACK` (5 crédits, 1 an)    | `STRIPE_PRICE_PACK` (ancien PACK5)     |
| `pack30` (30 crédits, 59€)        | `UNLIMITED` (illimité, 30j) | `STRIPE_PRICE_UNLIMITED` (ancien PACK30) |

---

## 📝 **FICHIERS MODIFIÉS PAR LE REFACTORING**

### **Nouveaux fichiers :**
- ✅ `supabase_migration_sprint7_refactor.sql`
- ✅ `MIGRATION_SPRINT7_GUIDE.md` (ce fichier)

### **Fichiers refactorisés :**
- ✅ `functions/api/billing/webhook.ts` (gestion des 3 types de plans + subscriptions)
- ✅ `functions/api/billing/create-checkout-session.ts` (nouveaux planType + metadata)
- ✅ `functions/api/analyse.ts` (appel RPC `consume_credit` au lieu de logique manuelle)
- ✅ `src/app/pricing/page.tsx` (nouveaux IDs de plans : SINGLE, PACK, UNLIMITED)

---

## ⚠️ **POINTS D'ATTENTION**

### **1. Utilisateurs existants avec des crédits dans l'ancien système**

Si des utilisateurs réels (pas de test) avaient des crédits dans l'ancienne table `paid_plans`, **ces crédits seront perdus** car la table est supprimée.

**Solution de migration douce (si nécessaire) :**
Avant d'exécuter le script SQL, tu peux :
1. Exporter les données de `paid_plans` en CSV
2. Après avoir créé la nouvelle table `subscriptions`, réinjecter manuellement les crédits restants pour chaque utilisateur

### **2. Webhook Stripe : récupération du `user_id`**

Actuellement, le webhook récupère le `user_id` depuis l'email (requête sur `auth.users`).

**Amélioration future :** Passer le `user_id` directement dans les metadata de la session Stripe (si l'utilisateur est authentifié au moment du paiement).

### **3. Plan FREE auto-créé**

Le trigger `on_auth_user_created` s'active **uniquement pour les nouveaux utilisateurs inscrits APRÈS l'exécution du script**.

Pour les utilisateurs existants, il faudra peut-être créer manuellement une ligne dans `subscriptions` avec `plan_type = 'FREE'`.

---

## ✅ **CHECKLIST FINALE**

- [ ] Script SQL exécuté dans Supabase
- [ ] Variables d'environnement Cloudflare mises à jour (STRIPE_PRICE_PACK, STRIPE_PRICE_UNLIMITED)
- [ ] Code commit + push sur GitHub
- [ ] Déploiement Cloudflare actif
- [ ] Test 1 : Inscription → Plan FREE auto-créé
- [ ] Test 2 : Achat UNLIMITED → Webhook OK + Supabase OK
- [ ] Test 3 : Analyse avec plan illimité → RPC OK + credits_consumed incrémenté
- [ ] Test 4 : Achat PACK → Crédits ajoutés → Consommation OK

---

## 🆘 **EN CAS DE PROBLÈME**

### **Erreur : Fonction RPC introuvable**

```
ERROR: function consume_credit does not exist
```

**Solution :** Vérifie que le script SQL a bien été exécuté et que la fonction RPC a été créée. Relis la section "ÉTAPE 5" du script SQL.

---

### **Erreur : Table subscriptions introuvable**

```
ERROR: relation "public.subscriptions" does not exist
```

**Solution :** Le script SQL n'a pas été exécuté ou a échoué. Regarde les logs d'erreur dans Supabase SQL Editor.

---

### **Webhook Stripe toujours en erreur 400**

**Solution :** Vide le cache de Cloudflare :
1. Dashboard Cloudflare → **Caching** → **Configuration**
2. **Purge Everything**
3. Attends 1 minute puis refais un paiement test

---

## 📞 **SUPPORT**

Si tu rencontres un problème bloquant :
1. Copie l'erreur exacte (logs Stripe, logs Cloudflare, ou erreur Supabase)
2. Envoie-moi une capture d'écran
3. Je diagnostiquerai et proposerai un fix immédiat

---

**Bonne migration ! 🚀**

