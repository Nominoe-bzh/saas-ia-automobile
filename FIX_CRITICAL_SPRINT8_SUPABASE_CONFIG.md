# 🚨 FIX CRITIQUE SPRINT 8 : CONFIGURATION SUPABASE MANQUANTE

**Date :** 10 Décembre 2025  
**Gravité :** 🔴 **CRITIQUE - BLOQUANT PRODUCTION**  
**Status :** ⏳ EN ATTENTE DE CONFIGURATION

---

## 🐛 ANOMALIE DÉTECTÉE

### **Symptôme :**
```
Page /login affiche : "Supabase not configured"
```

### **Cause Racine :**
Les variables d'environnement **publiques** (`NEXT_PUBLIC_*`) ne sont **PAS configurées** dans Cloudflare Pages.

**Analyse du code :**
✅ Le code dans `src/utils/supabase/client.ts` est **CORRECT** - il utilise bien :
- `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

❌ Ces variables sont **absentes** dans Cloudflare, donc le client mock est retourné.

---

## ✅ SOLUTION : CONFIGURATION CLOUDFLARE PAGES

### **ÉTAPE 1 : Récupérer les valeurs depuis Supabase**

1. Va sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Copie les valeurs suivantes :

| Variable | Valeur à copier | Section Supabase |
|----------|-----------------|------------------|
| **NEXT_PUBLIC_SUPABASE_URL** | `https://xxxxx.supabase.co` | **Project URL** |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **Project API keys** → **anon public** |

⚠️ **ATTENTION :** Prends bien la clé **anon** (publique), PAS la clé **service_role** (secrète) !

---

### **ÉTAPE 2 : Ajouter les variables dans Cloudflare Pages**

1. Va sur **Cloudflare Dashboard**
2. Sélectionne **Pages** → **check-ton-vehicule** (ou le nom de ton projet)
3. Va dans **Settings** → **Environment Variables**
4. Ajoute les **2 variables** suivantes :

#### **Variable 1 : NEXT_PUBLIC_SUPABASE_URL**
```
Nom : NEXT_PUBLIC_SUPABASE_URL
Valeur : https://xxxxx.supabase.co
Environnement : Production ET Preview
```

#### **Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Nom : NEXT_PUBLIC_SUPABASE_ANON_KEY
Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environnement : Production ET Preview
```

⚠️ **IMPORTANT :** Coche bien **Production** ET **Preview** pour que les variables soient disponibles dans les deux environnements !

---

### **ÉTAPE 3 : Redéployer**

Une fois les variables ajoutées dans Cloudflare :

**Option A : Redéploiement automatique**
1. Va dans **Deployments**
2. Clique sur le dernier déploiement
3. Clique sur **Retry deployment** (ou **Redeploy**)

**Option B : Push Git (force le rebuild)**
```bash
git commit --allow-empty -m "Trigger redeploy with Supabase env vars"
git push origin main
```

**Temps d'attente :** 2-3 minutes

---

## 📋 CHECKLIST COMPLÈTE DE VALIDATION

### **Test 1 : Vérification des variables**

**Page à ouvrir :** `https://www.checktonvehicule.fr/login`

**Console Browser (F12) :**
```javascript
// Colle ceci dans la console
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Défini' : 'Manquant')
```

**Résultat attendu :**
```
NEXT_PUBLIC_SUPABASE_URL: https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: Défini
```

❌ **Si tu vois `undefined`** → Les variables ne sont pas encore chargées, attends 2-3 minutes après le redéploiement

---

### **Test 2 : Création de compte**

**Page :** `https://www.checktonvehicule.fr/login`

**Actions :**
1. Clique sur "Pas encore de compte ? Créer un compte"
2. Entre un email : `test+sprint8@checktonvehicule.fr`
3. Entre un mot de passe : `TestSpring8!`
4. Clique sur "Créer un compte"

**Résultat attendu :**
```
✅ Message : "Compte créé ! Vérifiez votre email pour confirmer votre inscription."
✅ Pas d'erreur "Supabase not configured"
```

❌ **Si erreur persiste** → Variables toujours pas chargées ou mauvaises valeurs

---

### **Test 3 : Connexion par lien magique**

**Page :** `https://www.checktonvehicule.fr/login`

**Actions :**
1. Entre ton email dans le champ "Email"
2. Clique sur "✨ Connexion par email magique"

**Résultat attendu :**
```
✅ Message : "Un lien magique a été envoyé à votre email !"
✅ Email reçu dans ta boîte mail
```

---

### **Test 4 : Connexion avec mot de passe**

**Prérequis :** Compte créé + email confirmé

**Page :** `https://www.checktonvehicule.fr/login`

**Actions :**
1. Entre email + mot de passe
2. Clique sur "Se connecter"

**Résultat attendu :**
```
✅ Message : "Connexion réussie ! Redirection..."
✅ Redirection vers /dashboard après 1 seconde
```

---

### **Test 5 : Header - Badge de crédits**

**Prérequis :** Utilisateur connecté

**Page :** N'importe quelle page (ex: `/`)

**Observation :**
Dans le header (en haut), tu dois voir :

```
🚗 Check Ton Véhicule    💎 0 Crédits    Dashboard    Tarifs    Déconnexion
                          ^^^^^^^^^^^^^
                          Badge visible
```

**Résultat attendu :**
```
✅ Badge "💎 X Crédits" affiché (X = nombre de crédits)
✅ Badge cliquable → redirige vers /dashboard
```

---

### **Test 6 : Page Dashboard**

**Prérequis :** Utilisateur connecté

**Page :** `https://www.checktonvehicule.fr/dashboard`

**Observation :**

**Section 1 : Mon Solde**
```
✅ Affiche le nombre de crédits (ex: 0)
✅ Affiche "FREE" ou le type de plan
✅ Bouton "Recharger" présent
```

**Section 2 : Mes Analyses**
```
✅ Message "Aucune analyse pour le moment" (si aucune analyse)
✅ Ou liste des analyses (si existantes)
```

**Section 3 : Mes Factures**
```
✅ Message "Aucun paiement enregistré" (si aucun paiement)
✅ Ou liste des paiements (si existants)
```

---

### **Test 7 : API Backend**

**Prérequis :** Utilisateur connecté

**Console Browser (F12) :**
```javascript
// Récupère le token
const token = (await supabase.auth.getSession()).data.session?.access_token

// Appelle l'API
fetch('/api/user/overview', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```

**Résultat attendu :**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  },
  "credits": {
    "remaining": 0,
    "consumed": 0,
    "planType": "FREE",
    "isUnlimited": false,
    "status": "active"
  },
  "subscription": { ... },
  "history": {
    "analyses": [],
    "payments": []
  }
}
```

---

### **Test 8 : Achat de crédits (End-to-End)**

**Page :** `https://www.checktonvehicule.fr/pricing`

**Actions :**
1. Clique sur "Choisir ce plan" pour "Analyse Unique" (4,9€)
2. Entre ton email
3. Redirection vers Stripe Checkout
4. Paye avec la carte test : `4242 4242 4242 4242`
5. Redirection vers `/billing/success`
6. Va sur `/dashboard`

**Résultat attendu :**
```
✅ Badge header : "💎 1 Crédit"
✅ Dashboard section "Mon Solde" : 1 crédit
✅ Dashboard section "Mes Factures" : Paiement de 4,90 € affiché
```

---

## 📊 RÉSUMÉ DES VARIABLES (COPIE-COLLER)

### **Variables Frontend (Cloudflare Pages) :**

```bash
# Variables publiques (exposées au navigateur)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Variables Backend (Cloudflare Pages - Functions) :**

```bash
# Déjà configurées (ne pas modifier)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_SINGLE=price_xxxxx
STRIPE_PRICE_PACK=price_xxxxx
STRIPE_PRICE_UNLIMITED=price_xxxxx

OPENAI_API_KEY=sk-xxxxx
```

---

## 🔐 SÉCURITÉ : POURQUOI NEXT_PUBLIC_ ?

### **Variables avec `NEXT_PUBLIC_` :**
- ✅ Exposées au navigateur
- ✅ Nécessaires pour l'auth côté client
- ✅ Sécurisées par Supabase RLS
- ✅ Utilisées dans : Header, Login, Dashboard

### **Variables SANS `NEXT_PUBLIC_` :**
- 🔒 Jamais exposées au navigateur
- 🔒 Utilisées uniquement dans les Cloudflare Functions
- 🔒 Contiennent des clés secrètes (SERVICE_ROLE_KEY, STRIPE_SECRET_KEY)

---

## ⚠️ ERREURS COMMUNES

### **Erreur 1 : "Supabase not configured" persiste après redéploiement**

**Causes possibles :**
1. Variables ajoutées seulement en "Preview" au lieu de "Production"
2. Cache browser → Vider le cache (Ctrl+Shift+R)
3. Redéploiement pas terminé → Attendre 2-3 minutes

---

### **Erreur 2 : "Invalid JWT" après connexion**

**Cause :** Tu as utilisé la clé `service_role` au lieu de la clé `anon`

**Solution :** Remplace `NEXT_PUBLIC_SUPABASE_ANON_KEY` par la bonne clé (celle qui commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` et qui est marquée **anon public** dans Supabase)

---

### **Erreur 3 : Variables visibles dans le code source**

**Réponse :** C'est **NORMAL** ! Les variables `NEXT_PUBLIC_*` sont **publiques par design**. Elles sont sécurisées par :
- Supabase RLS (Row Level Security)
- Clé anon (limitée en permissions)
- Pas de secret sensible (comme `service_role`)

---

## 🎯 TIMELINE DE CORRECTION

| Étape | Durée | Action |
|-------|-------|--------|
| **1** | 2 min | Récupérer les variables depuis Supabase Dashboard |
| **2** | 2 min | Ajouter les variables dans Cloudflare Pages |
| **3** | 2-3 min | Redéploiement automatique (ou push Git) |
| **4** | 5 min | Tests de validation (checklist complète) |
| **TOTAL** | **~12 min** | Sprint 8 100% fonctionnel |

---

## 📝 COMMANDES UTILES

### **Vérifier les variables en production (Browser Console) :**
```javascript
console.table({
  'SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Manquant',
  'SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant'
})
```

### **Forcer un redéploiement :**
```bash
git commit --allow-empty -m "fix: Add Supabase public env vars"
git push origin main
```

---

**Rapport généré automatiquement par Cursor AI Agent**  
**Date : 10 Décembre 2025**  
**Status : ⏳ EN ATTENTE DE CONFIGURATION CLOUDFLARE**

