# Checklist de déploiement Cloudflare Pages

## ✅ Étapes à suivre

### 1. Configuration dans Cloudflare Pages Dashboard

Allez sur https://dash.cloudflare.com/ > Pages > Votre projet

#### a) Vérifier les Build Settings

Dans **Settings** > **Builds & deployments** :

- **Framework preset** : Next.js (Static HTML Export)
- **Build command** : `npm run build`
- **Build output directory** : `out`
- **Root directory** : `/` (laisser vide)
- **Node version** : 18 ou supérieur

#### b) Configurer les variables d'environnement

Dans **Settings** > **Environment variables**, ajoutez :

**Pour Production ET Preview :**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
OPENAI_API_KEY=sk-votre-key
OPENAI_MODEL=gpt-4o-mini
RESEND_API_KEY=re_votre-key
MAIL_FROM=noreply@votredomaine.com
```

⚠️ **Important** : Vérifiez que `MAIL_FROM` correspond à un domaine vérifié dans Resend.

### 2. Préparer la base de données Supabase

Si pas encore fait, exécutez dans l'éditeur SQL de Supabase :

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

-- Configurer RLS (Row Level Security)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

ALTER TABLE demo_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on demo_quota" ON demo_quota
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access on analyses" ON analyses
  FOR ALL USING (true) WITH CHECK (true);
```

### 3. Pousser le code

Les commandes seront exécutées automatiquement pour vous :
- `git add .`
- `git commit -m "Robustification du code + configuration déploiement"`
- `git push origin main`

### 4. Vérification après déploiement

Une fois le déploiement terminé dans Cloudflare Pages :

#### a) Tester les endpoints API

```bash
# Remplacez YOUR_DOMAIN par votre domaine Cloudflare Pages

# Test /api/join
curl -X POST https://YOUR_DOMAIN/api/join \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","prenom":"Test","type_utilisateur":"Particulier"}'

# Test /api/analyse
curl -X POST https://YOUR_DOMAIN/api/analyse \
  -H "Content-Type: application/json" \
  -d '{"annonce":"Test annonce voiture","email":"test@example.com"}'
```

#### b) Vérifier les logs

- Dashboard Cloudflare Pages > Votre projet > **Functions** > **Logs**
- Recherchez les erreurs éventuelles

#### c) Tester l'interface

1. Visitez votre domaine
2. Testez le formulaire d'inscription
3. Testez l'analyse d'annonce
4. Vérifiez `/mon-espace`

### 5. En cas de problème

**Erreur "Function not found"**
- Vérifiez que les fichiers `functions/api/*.ts` sont bien dans le repository

**Erreur "Missing environment variable"**
- Vérifiez que toutes les variables sont définies dans Cloudflare Pages
- Vérifiez l'environnement (Production vs Preview)

**Erreur Supabase**
- Vérifiez que les tables sont créées
- Vérifiez que RLS est configuré correctement
- Vérifiez les clés API

**Erreur OpenAI**
- Vérifiez que votre clé API est valide
- Vérifiez votre quota OpenAI

**Erreur Resend**
- Vérifiez que votre domaine est vérifié dans Resend
- Vérifiez que `MAIL_FROM` utilise le bon domaine

### 6. URL du projet

Votre repository : https://github.com/Nominoe-bzh/saas-ia-automobile

---

## 🎉 Prêt à déployer !

Confirmez que vous êtes prêt, et je lancerai le commit + push automatiquement.

