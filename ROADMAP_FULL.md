# ROADMAP - Check Ton Véhicule
# 18 Sprints de développement

## État actuel du projet (Baseline)

### ✅ Déjà implémenté
- [x] Base Next.js 16 + App Router
- [x] Tailwind CSS configuré
- [x] Déploiement Cloudflare Pages (pas Vercel)
- [x] Intégration OpenAI (GPT-4o-mini)
- [x] Supabase configuré avec tables basiques
- [x] API `/api/analyse` (extraction basique)
- [x] Dashboard admin avec Plausible
- [x] Système de quota (3 analyses gratuites)
- [x] Envoi email via Resend
- [x] Interface landing + démo

### ⚠️ À adapter
- Sprint 1 : Déjà fait (Cloudflare Pages au lieu de Vercel)
- Sprint 2 : Partiellement fait (extraction basique existe)

---

## 🎯 SPRINT 1 : Setup & Fondations
**Status : ✅ 80% COMPLÉTÉ**

### Déjà fait :
- [x] App Next.js 16 + App Router
- [x] Tailwind CSS
- [x] Endpoint `/api/analyse`
- [x] Client OpenAI
- [x] Déploiement Cloudflare Pages
- [x] CI/CD automatique via GitHub

### À finaliser :
- [ ] Installer shadcn-ui
- [ ] Installer axios
- [ ] Créer structure `/lib/openai.ts` propre
- [ ] Migrer arborescence recommandée

**Priorité : Haute**
**Temps estimé : 30 min**

---

## 🎯 SPRINT 2 : Extraction d'annonce automobile (v1)
**Status : ⚠️ 40% COMPLÉTÉ**

### Déjà fait :
- [x] Extraction basique dans `/api/analyse`
- [x] Parsing marque, modèle, année, km, prix

### À faire :
- [ ] Créer Zod schema `AnnouncementSchema` propre
- [ ] Refactorer dans `/lib/parsers/announcement.ts`
- [ ] Améliorer le prompt d'extraction
- [ ] Ajouter validation stricte
- [ ] Tests sur 10 annonces

**Priorité : Haute**
**Temps estimé : 1h**

---

## 🎯 SPRINT 3 : Moteur de Prix Cible (v1)
**Status : ❌ NON COMMENCÉ**

### À faire :
- [ ] Créer module `/lib/pricing.ts`
- [ ] Prompt "price-estimator"
- [ ] Algorithme pondéré (âge, km, modèle, motorisation)
- [ ] UI affichant prix cible + écart
- [ ] Intervalle haute/basse

**Priorité : Haute**
**Temps estimé : 2h**

---

## 🎯 SPRINT 4 : Checklist d'inspection IA
**Status : ⚠️ 30% COMPLÉTÉ**

### Déjà fait :
- [x] Génération basique de questions dans analyse

### À faire :
- [ ] Prompt "checklist-generator" dédié
- [ ] 3 catégories : mécanique / administratif / vendeur
- [ ] UI cards avec checklist
- [ ] Personnalisation selon véhicule

**Priorité : Moyenne**
**Temps estimé : 1h30**

---

## 🎯 SPRINT 5 : Verdict final (Acheter / Négocier / Fuir)
**Status : ⚠️ 60% COMPLÉTÉ**

### Déjà fait :
- [x] Score sur 100 généré
- [x] Profil achat (acheter/negocier/eviter)

### À faire :
- [ ] Jauge visuelle (progress bar)
- [ ] Améliorer règles de décision
- [ ] Affichage plus visuel du verdict

**Priorité : Haute**
**Temps estimé : 45 min**

---

## 🎯 SPRINT 6 : Génération PDF Rapport Expert
**Status : ❌ NON COMMENCÉ**

### À faire :
- [ ] Installer @react-pdf/renderer
- [ ] Créer template PDF
- [ ] Endpoint `/api/report/pdf?id=uuid`
- [ ] Bouton téléchargement dans interface

**Priorité : Moyenne**
**Temps estimé : 2h**

---

## 🎯 SPRINT 7 : Auth + Paiements Stripe
**Status : ❌ NON COMMENCÉ**

### À faire :
- [ ] Setup Stripe
- [ ] Auth utilisateurs (Supabase Auth)
- [ ] Stripe Checkout
- [ ] Webhooks paiement
- [ ] Gestion crédits/abonnements
- [ ] 3 formules de pricing

**Priorité : Haute**
**Temps estimé : 4h**

---

## 🎯 SPRINT 8 : Dashboard utilisateur
**Status : ⚠️ 50% COMPLÉTÉ**

### Déjà fait :
- [x] Page `/mon-espace` avec historique
- [x] Affichage des analyses passées

### À faire :
- [ ] Améliorer l'UI du dashboard
- [ ] Ajouter filtres par date
- [ ] Stats personnelles
- [ ] Gestion crédits restants

**Priorité : Moyenne**
**Temps estimé : 1h30**

---

## 🎯 SPRINT 9-18 : À planifier
**Status : ❌ NON COMMENCÉS**

Les sprints 9 à 18 sont prêts à être implémentés séquentiellement.

---

## 📊 Récapitulatif

**Sprints complétés :** 0/18 (mais fondations solides)
**Sprints en cours :** 5/18 (partiellement implémentés)
**Sprints à faire :** 13/18

**Temps total estimé :** ~40-50 heures de développement

---

## 🎯 Ordre d'implémentation recommandé

### Phase 1 : MVP Complet (Sprints 1-5) - ~5h
Finaliser l'extraction, pricing, verdict visuel

### Phase 2 : Monétisation (Sprints 6-7) - ~6h
PDF + Stripe pour générer du revenu

### Phase 3 : Rétention (Sprint 8) - ~2h
Améliorer dashboard utilisateur

### Phase 4 : Acquisition (Sprint 9) - ~3h
50 pages SEO

### Phase 5 : B2B (Sprints 10-11) - ~5h
API + Dashboard pro

### Phase 6 : Valeur ajoutée (Sprints 12-13) - ~4h
Entretien + Revente

### Phase 7 : Scale (Sprints 14-18) - ~15h
Infrastructure, i18n, marketing, optimisations

---

## 🚀 Proposition de démarrage

**Je vous propose de commencer par :**

**Option A : Compléter les sprints 1-5 (MVP complet)**
- Finalise toutes les features de base
- ~5 heures de dev
- Application immédiatement utilisable à 100%

**Option B : Aller directement sur Sprint 7 (Stripe)**
- Ajoute la monétisation immédiatement
- Capitalise sur le trafic actuel
- ~4 heures de dev

**Option C : Sprint par sprint dans l'ordre**
- Approche méthodique
- Validation continue

**Quelle option préférez-vous ?** Ou voulez-vous que je commence par un sprint spécifique ?


