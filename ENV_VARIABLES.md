# Variables d'environnement

Ce document liste toutes les variables d'environnement nécessaires pour faire fonctionner l'application **Check Ton Véhicule**.

## Configuration Cloudflare Pages

### Variables pour les Functions API

Ces variables doivent être configurées dans **Cloudflare Pages** pour que les fonctions API fonctionnent :
- Allez dans votre projet > **Settings** > **Environment Variables**
- Ajoutez les variables pour les environnements **Production**, **Preview** et **Development**
- Ces variables sont utilisées par les fonctions dans `functions/api/*`

**Variables requises pour les Functions :**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour `/api/rapport`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optionnel, défaut: `gpt-4o-mini`)
- `RESEND_API_KEY`
- `MAIL_FROM`

## Variables requises

### Supabase (Base de données)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Où les trouver :**
- Dans votre projet Supabase : **Settings** > **API**
- `SUPABASE_URL` : Project URL
- `SUPABASE_ANON_KEY` : anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` : service_role key (⚠️ gardez-le secret)

### OpenAI (Analyse IA)

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Où les trouver :**
- Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
- Générez une clé API dans **API Keys**
- `OPENAI_MODEL` : modèle à utiliser (par défaut : `gpt-4o-mini`)

### Resend (Envoi d'emails)

```bash
RESEND_API_KEY=re_your-resend-api-key-here
MAIL_FROM=noreply@yourdomain.com
```

**Où les trouver :**
- Créez un compte sur [Resend](https://resend.com/)
- Générez une clé API dans **API Keys**
- Vérifiez votre domaine dans **Domains**
- `MAIL_FROM` : email d'envoi (doit être un domaine vérifié)

### Next.js (Frontend - optionnel)

```bash
NEXT_PUBLIC_API_BASE=
```

**Usage :**
- **En développement local** : laisser vide (les routes `/api/*` ne fonctionnent pas avec `output: 'export'`)
- **En production** : 
  - Si votre frontend et vos Cloudflare Pages Functions sont sur le même domaine : laisser vide
  - Si vos fonctions sont sur un domaine différent : URL complète (ex: `https://api.yourdomain.com`)
  - Utilisé uniquement dans `/mon-espace` pour les appels à `/api/historique` et `/api/rapport`
  - La page d'accueil (`/`) utilise les routes relatives qui seront gérées par Cloudflare Pages

## Développement local

### Frontend Next.js

Pour le développement local avec Next.js :

1. Créez un fichier `.env.local` à la racine du projet
2. Ajoutez uniquement `NEXT_PUBLIC_API_BASE` si nécessaire (voir section ci-dessus)
3. ⚠️ **Ne commitez jamais** `.env.local` dans git (déjà dans `.gitignore`)

**Note importante :** Avec `output: 'export'` dans `next.config.ts`, les routes API Next.js ne fonctionnent pas en local. Les fonctions API sont déployées sur Cloudflare Pages.

### Cloudflare Pages Functions

Les variables d'environnement pour les fonctions API (`functions/api/*`) doivent être configurées dans **Cloudflare Pages** :

1. Allez dans votre projet Cloudflare Pages
2. **Settings** > **Environment Variables**
3. Ajoutez toutes les variables listées ci-dessus (sauf `NEXT_PUBLIC_API_BASE` qui est pour le frontend)
4. Configurez pour chaque environnement (Production, Preview, Development)

## Schéma de base de données Supabase

L'application utilise les tables suivantes :

### Table `waitlist`
```sql
- email (text, primary key)
- prenom (text)
- type_utilisateur (text)
- created_at (timestamp)
```

### Table `demo_quota`
```sql
- email (text, primary key)
- count (integer)
- updated_at (timestamp)
```

### Table `analyses`
```sql
- id (uuid, primary key)
- email (text)
- input_raw (text)
- output_json (jsonb)
- model (text)
- created_at (timestamp)
```

## Sécurité

⚠️ **Important :**
- Ne partagez jamais vos clés API publiquement
- Utilisez des clés différentes pour développement et production
- Le `SUPABASE_SERVICE_ROLE_KEY` a des privilèges élevés, gardez-le secret
- Vérifiez régulièrement vos quotas d'API (OpenAI, Resend)

## Architecture de déploiement

L'application utilise une architecture hybride :

1. **Frontend Next.js** : Déployé en statique (`output: 'export'`)
   - Pages : `/`, `/mon-espace`, `/mon-espace/rapport`
   - Utilise `NEXT_PUBLIC_API_BASE` uniquement pour les pages mon-espace

2. **Backend Cloudflare Pages Functions** : Déployé sur Cloudflare Pages
   - Routes API : `/api/analyse`, `/api/historique`, `/api/rapport`, `/api/join`
   - Utilise toutes les variables d'environnement (sauf `NEXT_PUBLIC_API_BASE`)

3. **Base de données Supabase** : Hébergée sur Supabase
   - Tables : `waitlist`, `demo_quota`, `analyses`

## Support

En cas de problème avec la configuration, vérifiez :

1. **Variables d'environnement :**
   - Que toutes les variables sont définies dans Cloudflare Pages
   - Que les clés API sont valides et non expirées
   - Que `MAIL_FROM` correspond à un domaine vérifié dans Resend

2. **Logs et debugging :**
   - Consultez les logs dans **Cloudflare Pages Dashboard** > **Functions** > **Logs**
   - Vérifiez les erreurs dans la console du navigateur (F12)
   - Testez les endpoints API directement avec curl ou Postman

3. **Problèmes courants :**
   - **Erreur CORS** : Vérifiez que les headers CORS sont corrects (déjà configurés dans le code)
   - **Erreur 500** : Vérifiez les logs Cloudflare pour identifier l'erreur
   - **Email non envoyé** : Vérifiez que le domaine est vérifié dans Resend
   - **Quota dépassé** : Vérifiez les quotas OpenAI et Resend
