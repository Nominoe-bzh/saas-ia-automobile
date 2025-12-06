# Configuration du Dashboard Admin

## 📊 Nouvelles fonctionnalités

### 1. Tracking Plausible amélioré

Nouveaux événements trackés automatiquement :

**Page d'accueil**
- `Signup` : Inscription à la liste d'attente
  - Props: `source: 'landing'`, `role: 'Particulier|Pro|Concessionnaire'`
- `Demo_Analyse_Started` : Démarrage d'une analyse démo
  - Props: `hasEmail: boolean`, `annonceLength: number`
- `Demo_Analyse_Success` : Analyse réussie
  - Props: `hasEmail`, `score`, `profilAchat`, `nbRisques`
- `Demo_Analyse_Error` : Erreur lors de l'analyse
  - Props: `errorType`, `statusCode`

**Mon espace**
- `Historique_Consulted` : Consultation de l'historique
- `Historique_Loaded` : Historique chargé
  - Props: `nbAnalyses: number`

**Rapports**
- `Rapport_Viewed` : Consultation d'un rapport
  - Props: `rapportId` (8 premiers caractères)
- `Rapport_Loaded` : Rapport chargé
  - Props: `score`, `hasRisques`

### 2. Dashboard Admin (`/admin`)

Interface d'administration avec :
- Statistiques Plausible en temps réel
- Événements personnalisés
- Sélection de période (jour, 7j, 30j, mois)
- Protection par mot de passe

## 🔐 Configuration requise

### 1. Créer une clé API Plausible

1. Allez sur https://plausible.io/settings
2. Cliquez sur **API keys** dans le menu
3. Cliquez sur **+ New API key**
4. Donnez un nom : `Check Ton Vehicule - Admin Dashboard`
5. Permissions requises : `stats:read:*`
6. Copiez la clé générée

### 2. Ajouter la clé dans Cloudflare Pages

Dans votre projet Cloudflare Pages :
1. **Settings** > **Environment variables**
2. Ajoutez pour **Production** et **Preview** :

```
PLAUSIBLE_API_KEY=votre-cle-api-ici
PLAUSIBLE_SITE_ID=checktonvehicule.fr
```

### 3. Configurer le mot de passe admin

Le mot de passe par défaut est : `admin2025`

Pour le changer :
1. Ouvrez `src/app/admin/page.tsx`
2. Ligne ~45, modifiez :
```typescript
if (password === 'VOTRE_NOUVEAU_MOT_DE_PASSE') {
```

**⚠️ Important** : Pour une vraie sécurité, implémentez une authentification avec base de données.

## 📈 Utilisation du dashboard

### Accéder au dashboard

1. Allez sur https://www.checktonvehicule.fr/admin
2. Entrez le mot de passe
3. Les statistiques se chargent automatiquement

### Statistiques disponibles

- **Visiteurs uniques** : Nombre de visiteurs distincts
- **Pages vues** : Nombre total de pages consultées
- **Taux de rebond** : % de visiteurs qui quittent après 1 page
- **Durée moyenne** : Temps moyen passé sur le site

### Événements personnalisés

Liste de tous les événements trackés avec :
- Nombre de visiteurs ayant déclenché l'événement
- Nombre total d'occurrences
- Pourcentage par rapport aux visiteurs totaux

### Sélection de période

Changez la période d'analyse :
- **Aujourd'hui** : Statistiques du jour
- **7 derniers jours** : Une semaine glissante
- **30 derniers jours** : Un mois glissant
- **Ce mois-ci** : Mois calendaire en cours

## 🚀 Déploiement

Les fichiers créés/modifiés :
- ✅ `src/app/page.tsx` - Tracking amélioré landing
- ✅ `src/app/mon-espace/page.tsx` - Tracking historique
- ✅ `src/app/mon-espace/rapport/page.tsx` - Tracking rapports
- ✅ `src/app/admin/page.tsx` - Dashboard admin (nouveau)
- ✅ `functions/api/admin/stats.ts` - API Plausible (nouveau)

Prêt à committer et déployer !

## 🔍 Vérifications post-déploiement

### 1. Vérifier le tracking

1. Visitez votre site en navigation privée
2. Effectuez des actions (inscription, analyse, etc.)
3. Attendez 1-2 minutes
4. Vérifiez dans Plausible.io que les événements apparaissent

### 2. Tester le dashboard admin

1. Allez sur `/admin`
2. Connectez-vous avec le mot de passe
3. Vérifiez que les stats s'affichent
4. Testez les différentes périodes

### 3. En cas de problème

**"PLAUSIBLE_API_KEY not configured"**
- Vérifiez que la variable est bien dans Cloudflare Pages
- Vérifiez l'environnement (Production vs Preview)

**"Plausible API error (401)"**
- Votre clé API est invalide
- Regénérez une nouvelle clé dans Plausible

**"No data"**
- Pas encore de trafic sur la période sélectionnée
- Vérifiez que le tracking fonctionne (F12 > Network > pa-*.js)

## 📊 Métriques importantes à surveiller

### KPIs business
- Nombre d'inscriptions (event `Signup`)
- Taux de conversion démo → inscription
- Nombre d'analyses lancées (`Demo_Analyse_Started`)
- Taux de succès des analyses

### KPIs techniques
- Taux d'erreur (`Demo_Analyse_Error`)
- Erreurs quota (`errorType: 'quota_exceeded'`)
- Taux de rebond par page

### Engagement
- Pages vues par visite
- Durée moyenne de session
- Pages les plus consultées
- Taux de retour sur `/mon-espace`

---

**Prêt à déployer !** 🚀

