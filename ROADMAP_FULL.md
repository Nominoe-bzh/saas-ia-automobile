Voici **la VERSION FINALE**, entièrement régénérée, complète, exhaustive,
**compatible Next.js 16**, **API-first**, **mobile-ready**, **Cloudflare Edge-ready**,
et 100 % exploitable par **Cursor**, **Gemini**, **Notion**, **GitHub**.

---

# 📘 **SAAS IA AUTOMOBILE — PLAN TECHNIQUE COMPLET (18 SPRINTS)**

### Architecture : **Next.js 16 + Edge Runtime + Cloudflare + Supabase + Stripe + OpenAI**

### Doctrine : **API-first · Mobile-ready · Front interchangeable · Aucune logique métier en UI**

---

# 🟥 DOCTRINE GÉNÉRALE

*(À respecter strictement dans TOUS les sprints)*

## 🔐 1. AUTH (WEB + MOBILE)

Tous les endpoints `/api/...` doivent pouvoir authentifier :

### ✔️ Via Cookies Supabase (Web)

`sb-access-token`, `sb-refresh-token`

### ✔️ Via Bearer Token (Mobile)

Header :

```
Authorization: Bearer <supabase_access_token>
```

### 📌 Helper OBLIGATOIRE

Créer `lib/getAuthenticatedUser.ts`

Fonctions :

* Lire cookies
* Sinon lire Bearer
* Vérifier token via Supabase
* Retourner `userId` ou 401

---

## ⚠️ 2. STRIPE + CLOUDFLARE — RÈGLE CRITIQUE

### ❌ INTERDIT

```
import crypto from "crypto"
```

### ✅ OBLIGATOIRE

```ts
const rawBody = await request.text();
await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
```

### 📌 Ajouter systématiquement dans TOUS les endpoints API :

```ts
export const runtime = "edge";
export const dynamic = "force-dynamic"; // obligatoire pour webhooks
```

---

## 🧱 3. DOCTRINE API-FIRST

### Le front **ne doit jamais** :

* gérer les crédits
* vérifier les abonnements
* analyser les données
* appeler directement Supabase pour logique métier

### Le front **doit uniquement** :

* appeler les APIs
* afficher le résultat

### L’app mobile 2026 doit pouvoir :

* réutiliser les mêmes endpoints
* sans changement backend

---

# 🚀 **SPRINT 1 — Initialisation Projet (Next.js 16 Edition)**

## 🎯 Objectif

Mettre en place l’architecture backend + front minimal + auth mobile-ready + API Edge.

## 🔧 Actions

### Backend

* Initialiser **Next.js 16 App Router**
* Ajouter `export const runtime = "edge"` dans chaque API
* Configurer Supabase server-side client
* Configurer OpenAI SDK
* Configurer variables d’environnement

### Auth (mobile-ready)

Créer fichier :

```
lib/getAuthenticatedUser.ts
```

Ce module :

1. Lit cookies Supabase
2. Sinon lit header Bearer
3. Vérifie via Supabase Auth
4. Retourne userId

### Front

* Installer Tailwind v4
* Installer shadcn/ui
* Layout public
* Layout privé
* Page `/` placeholder

---

# 🚀 **SPRINT 2 — Design System + UI Shell (Front interchangeable)**

## 🎯 Objectif

Créer une interface totalement indépendante de la logique métier.

## Composants

* Button
* Input
* Textarea
* Card
* Badge
* Spinner
* Container
* PageHeader

## Pages UI Shell

* `/analyse`
* `/historique`
* `/mon-espace`

## Contraintes

* ❌ Zero logique métier
* ❌ Aucun appel direct Supabase
* ✔️ Theming centralisé Tailwind

---

# 🚀 **SPRINT 3 — API Extraction d’Annonce (IA + Parsing)**

## 🗄️ Table

```
analyses (
  id uuid pk,
  user_id uuid,
  raw_text text,
  extracted_json jsonb,
  created_at timestamptz
)
```

RLS :

```
user_id = auth.uid()
```

---

## API : POST `/api/analyse/extract`

```ts
export const runtime = "edge";
```

### Input

```json
{
  "sourceType": "text" | "url",
  "content": "..."
}
```

### Process

* Auth (cookies + bearer)
* Scraping HTML si URL
* Extraction texte
* OpenAI → extraction JSON
* Validation JSON
* Insert Supabase

### Output

```json
{
  "analysisId": "...",
  "extracted": {...}
}
```

---

# 🚀 **SPRINT 4 — Analyse Complète IA (Prix, Risques, Verdict)**

## Mises à jour table `analyses`

Ajouter :

```
ia_price integer,
market_score integer,
risk_factors jsonb,
recommended_actions jsonb,
verdict text
```

---

## API : POST `/api/analyse/full`

```ts
export const runtime = "edge";
```

### Input

```json
{
  "analysisId": "uuid"
}
```

### Output

```json
{
  "analysisId": "...",
  "verdict": "NEGOCIER",
  "market_score": 82,
  "risk_factors": {...}
}
```

---

# 🚀 **SPRINT 5 — Historique Utilisateur via API**

## API : GET `/api/analyses/my?page=1&pageSize=20`

```ts
export const runtime = "edge";
```

### Output

```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

---

# 🚀 **SPRINT 6 — Génération PDF Expert**

## Table

```
reports (
  id uuid,
  user_id uuid,
  analysis_id uuid,
  pdf_url text,
  created_at timestamptz
)
```

## API : POST `/api/reports/generate`

```ts
export const runtime = "edge";
```

Process :

1. Vérifier user
2. Récup analyse
3. Générer PDF (pdf-lib / react-pdf)
4. Stocker dans Supabase Storage
5. Retourner URL

---

# 🚀 **SPRINT 7 — Stripe + Plans + Crédits (Edge-safe + Mobile-ready)**

*(Version consolidée Gemini + ChatGPT)*

---

## ⚠️ RÈGLES OBLIGATOIRES

### Stripe webhook :

```ts
export const runtime = "edge";
export const dynamic = "force-dynamic";

const rawBody = await request.text();
const event = await stripe.webhooks.constructEventAsync(
  rawBody,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

---

## Tables

### payments

```
id uuid,
user_id uuid,
plan_type text,
amount integer,
currency text,
stripe_session_id text,
created_at timestamptz
```

### subscriptions

```
id uuid,
user_id uuid,
plan_type text,
credits_remaining integer,
valid_until timestamptz,
stripe_customer_id text,
stripe_subscription_id text,
created_at timestamptz
```

---

## Plans

* `single` → 1 crédit
* `pack5` → 5 crédits
* `unlimited_30d` → accès 30 jours

---

## API

### 1️⃣ POST `/api/billing/create-checkout-session`

### 2️⃣ POST `/api/billing/webhook`

Doit :

* enregistrer paiement
* mettre à jour crédits + abonnement
* aucune logique frontend

---

### 3️⃣ Vérification dans `/api/analyse/full`

Cas :

| Plan            | Action      |
| --------------- | ----------- |
| unlimited actif | OK          |
| crédits > 0     | décrémenter |
| rien            | 403         |

---

# 🚀 **SPRINT 8 — Dashboard Utilisateur + API_CONTRACT.md**

## API : GET `/api/user/overview`

Retourne :

```json
{
  "credits": {...},
  "subscription": {...},
  "recentAnalyses": [...],
  "recentReports": [...]
}
```

## Créer : `API_CONTRACT.md`

Document exhaustif de :

* inputs
* outputs
* erreurs
* schémas JSON

---

# 🚀 **SPRINT 9 — SEO Automatique 50 Pages**

## Table

```
seo_pages (
  slug text pk,
  html_content text,
  last_generated timestamptz
)
```

## API

* GET `/api/seo/page`
* POST `/api/seo/generate`

---

# 🚀 **SPRINT 10 — API B2B White-label**

## Tables

`organizations`, `api_keys`, `b2b_usage`

## API B2B

POST `/api/b2b/evaluations`
GET `/api/b2b/evaluations/:id`

Auth via `x-api-key`.

---

# 🚀 **SPRINT 11 — Dashboard B2B**

API : GET `/api/b2b/dashboard`

Front : tableau + charts consommant uniquement l'API.

---

# 🚀 **SPRINT 12 — Module Entretien IA**

## Table

```
maintenance_profiles (
  id uuid,
  user_id uuid,
  vehicle JSONB,
  advice JSONB,
  created_at timestamptz
)
```

## API

POST `/api/maintenance/generate`

---

# 🚀 **SPRINT 13 — Module Revente IA**

## Table

```
resale_profiles (...)
```

## API

POST `/api/revente/estimate`

---

# 🚀 **SPRINT 14 — Monitoring & Observabilité**

* Sentry Edge
* Logs structurés
* Dashboard usage IA
* Retry policies

---

# 🚀 **SPRINT 15 — Attribution Marketing**

## Table

`attribution_events`

## API

POST `/api/attribution/event`

---

# 🚀 **SPRINT 16 — Optimisation Coûts IA**

* Caching via KV Storage
* Embeddings pour matching
* Prompt compression
* Modèles mixés (GPT-4.1 + 4.1-mini)

---

# 🚀 **SPRINT 17 — Internationalisation**

Paramètre obligatoire dans toutes API IA :

```
country: "FR" | "BE" | "CH" | "DE" | "UK"
```

---

# 🚀 **SPRINT 18 — Scalabilité Finalisée**

* Index SQL
* Optimisation Next.js 16
* Audit RLS
* Stress tests API

---

# 🟢 DOCUMENT COMPLET — FIN

Ce document est prêt pour :

* **Cursor**
* **Gemini**
* **GitHub `/docs/architecture/sprints.md`**
* **Notion**
