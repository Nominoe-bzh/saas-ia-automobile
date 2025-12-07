# Guide de déploiement - Check Ton Véhicule

Ce guide vous accompagne pour déployer l'application sur Cloudflare Pages.

## Prérequis

1. **Compte Cloudflare** avec accès à Pages
2. **Compte Supabase** avec base de données configurée
3. **Compte OpenAI** avec clé API
4. **Compte Resend** avec domaine vérifié
5. **Repository Git** (GitHub, GitLab, ou Bitbucket)

## Étape 1 : Préparation de la base de données Supabase

### Créer les tables

Connectez-vous à votre projet Supabase et exécutez ces requêtes SQL dans l'éditeur SQL :

```sql
-- Table waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  prenom TEXT NOT NULL,
  type_utilisateur TEXT NOT NULL CHECK (type_utilisateur IN ('Particulier', 'Pro', 'Concessionnaire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table demo_quota
CREATE TABLE IF NOT EXISTS demo_quota (
  email TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table analyses
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  input_raw TEXT NOT NULL,
  output_json JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_analyses_email ON analyses(email);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
```

### Configurer les politiques RLS (Row Level Security)

Si vous utilisez RLS, créez des politiques pour permettre l'accès :

```sql
-- Pour waitlist (insertion publique)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Pour demo_quota (lecture/écriture publique)
ALTER TABLE demo_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on demo_quota" ON demo_quota
  FOR ALL USING (true) WITH CHECK (true);

-- Pour analyses (lecture/écriture publique)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on analyses" ON analyses
  FOR ALL USING (true) WITH CHECK (true);
```

## Étape 2 : Configuration locale

### 1. Vérifier le build

```bash
# Installer les dépendances
npm install

# Tester le build localement
npm run build

# Vérifier que le dossier out/ est créé
ls -la out/
```

### 2. Tester les fonctions API localement (optionnel)

Pour tester les fonctions Cloudflare Pages en local, installez Wrangler :

```bash
npm install -g wrangler
```

Puis créez un fichier `wrangler.toml` (voir section suivante).

## Étape 3 : Configuration Cloudflare Pages

### 1. Créer un nouveau projet

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sélectionnez **Pages** dans le menu
3. Cliquez sur **Create a project**
4. Connectez votre repository Git (GitHub, GitLab, ou Bitbucket)

### 2. Configuration du build

Dans les paramètres du projet Cloudflare Pages, configurez :

**Build settings :**
- **Framework preset** : `Next.js (Static HTML Export)`
- **Build command** : `npm run build`
- **Build output directory** : `out`
- **Root directory** : `/` (ou laisser vide)

**Environment variables :**

Ajoutez toutes les variables listées dans `ENV_VARIABLES.md` :

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
RESEND_API_KEY=re_your-key
MAIL_FROM=noreply@yourdomain.com
```

⚠️ **Important** : Configurez ces variables pour **Production**, **Preview** et **Development**.

### 3. Déploiement automatique

Cloudflare Pages détectera automatiquement :
- Les fichiers dans `functions/` comme Cloudflare Pages Functions
- Le dossier `out/` comme sortie statique
- Les routes API dans `functions/api/`

## Étape 4 : Configuration des routes

Le fichier `_redirects` (déjà créé) gère les redirections pour le routing SPA.

## Étape 5 : Premier déploiement

### Via Git (recommandé)

1. Commitez et poussez votre code :
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Cloudflare Pages détectera automatiquement le push et lancera un build

3. Surveillez le déploiement dans le dashboard Cloudflare Pages

### Via Wrangler CLI (alternative)

```bash
# Installer Wrangler
npm install -g wrangler

# Se connecter
wrangler login

# Déployer
wrangler pages deploy out --project-name=check-ton-vehicule
```

## Étape 6 : Vérification post-déploiement

### 1. Tester les endpoints API

```bash
# Test de l'endpoint analyse
curl -X POST https://your-domain.pages.dev/api/analyse \
  -H "Content-Type: application/json" \
  -d '{"annonce": "Test annonce", "email": "test@example.com"}'

# Test de l'endpoint join
curl -X POST https://your-domain.pages.dev/api/join \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "prenom": "Test", "type_utilisateur": "Particulier"}'
```

### 2. Vérifier les logs

- Allez dans **Cloudflare Pages** > Votre projet > **Functions** > **Logs**
- Vérifiez qu'il n'y a pas d'erreurs

### 3. Tester le frontend

1. Visitez votre domaine Cloudflare Pages
2. Testez le formulaire d'inscription
3. Testez la démo d'analyse IA
4. Vérifiez la page `/mon-espace`

## Étape 7 : Configuration du domaine personnalisé (optionnel)

1. Dans Cloudflare Pages, allez dans **Custom domains**
2. Ajoutez votre domaine
3. Suivez les instructions DNS

## Dépannage

### Erreur : "Function not found"

- Vérifiez que les fichiers dans `functions/api/` sont bien présents
- Vérifiez que les noms de fichiers correspondent aux routes (`analyse.ts` → `/api/analyse`)

### Erreur : "Environment variable not found"

- Vérifiez que toutes les variables sont définies dans Cloudflare Pages
- Vérifiez que les variables sont définies pour l'environnement correct (Production/Preview)

### Erreur : "CORS error"

- Les headers CORS sont déjà configurés dans le code
- Vérifiez que vous n'avez pas de proxy ou de middleware qui modifie les headers

### Build échoue

- Vérifiez les logs de build dans Cloudflare Pages
- Testez le build localement : `npm run build`
- Vérifiez que toutes les dépendances sont dans `package.json`

## Commandes utiles

```bash
# Build local
npm run build

# Linter
npm run lint

# Vérifier les types TypeScript
npx tsc --noEmit

# Tester les fonctions localement avec Wrangler
wrangler pages dev out --local
```

## Prochaines étapes

Une fois déployé :

1. ✅ Configurer le domaine personnalisé
2. ✅ Mettre en place le monitoring (Cloudflare Analytics)
3. ✅ Configurer les alertes pour les erreurs
4. ✅ Mettre en place un backup de la base de données
5. ✅ Configurer les quotas et limites d'API

## Support

En cas de problème :
1. Consultez les logs dans Cloudflare Pages Dashboard
2. Vérifiez `ENV_VARIABLES.md` pour la configuration
3. Testez les endpoints individuellement avec curl/Postman




