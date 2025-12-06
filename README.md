# Check Ton Véhicule

Application SaaS d'analyse IA pour véhicules d'occasion. Analyse d'annonces, détection de risques, et aide à la négociation.

## 🚀 Technologies

- **Frontend** : Next.js 16 (Static Export), React 19, TypeScript, Tailwind CSS
- **Backend** : Cloudflare Pages Functions
- **Base de données** : Supabase (PostgreSQL)
- **IA** : OpenAI API (GPT-4o-mini)
- **Email** : Resend
- **Analytics** : Plausible

## 📋 Prérequis

- Node.js 18+ et npm
- Compte Cloudflare avec accès à Pages
- Compte Supabase
- Compte OpenAI avec clé API
- Compte Resend avec domaine vérifié

## 🛠️ Installation locale

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build

# Linter
npm run lint
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide complet de déploiement
- **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** - Configuration des variables d'environnement

## 🚢 Déploiement

### Déploiement sur Cloudflare Pages

1. **Préparer la base de données** : Suivez les instructions dans `DEPLOYMENT.md`
2. **Configurer les variables d'environnement** : Voir `ENV_VARIABLES.md`
3. **Connecter votre repository** à Cloudflare Pages
4. **Configurer le build** :
   - Build command: `npm run build`
   - Build output: `out`
   - Framework: Next.js (Static HTML Export)

Pour plus de détails, consultez **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## 📁 Structure du projet

```
web/
├── functions/api/          # Cloudflare Pages Functions
│   ├── analyse.ts         # Analyse IA d'annonces
│   ├── historique.ts      # Historique des analyses
│   ├── rapport.ts         # Détail d'un rapport
│   └── join.ts            # Inscription liste d'attente
├── src/app/               # Next.js App Router
│   ├── page.tsx           # Landing page
│   └── mon-espace/        # Espace utilisateur
├── public/                # Assets statiques
└── out/                   # Build output (généré)
```

## 🔧 Configuration

Toutes les variables d'environnement sont documentées dans **[ENV_VARIABLES.md](./ENV_VARIABLES.md)**.

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run lint` - Vérification du code

## 🐛 Dépannage

Consultez la section "Dépannage" dans **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## 📄 Licence

Propriétaire - Tous droits réservés
