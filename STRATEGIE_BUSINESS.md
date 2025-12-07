# SaaS IA Automobile — "Acheter, entretenir et revendre un véhicule d'occasion, en toute confiance grâce à l'IA."

## Dossier stratégique complet — Business Plan 2025–2035

**Présenté par :** Johan [Nom] — Fondateur, Mon Expert Online Business IA

**Version :** Investisseur / Partenaire B2B — Dernière mise à jour : 2025

**Secteurs :** IA, Automobile, SaaS, API White-Label, Automation

**Signature :** "L'IA qui sécurise vos décisions automobiles."

© 2025 — Document confidentiel

---

## Table des matières

- [EXECUTIVE SUMMARY (1 PAGE)](#executive-summary-1-page)
- [SECTION I — MARCHÉ, VISION, PROPOSITION DE VALEUR](#section-i--marché-vision-proposition-de-valeur)
- [SECTION II — MARCHÉ, PERSONAS, TAM/SAM/SOM, CONCURRENCE](#section-ii--marché-personas-tamsomsom-concurrence)
- [SECTION III — PRODUIT (B2C & B2B), SPÉCIFICATIONS & UX](#section-iii--produit-b2c--b2b-spécifications--ux)
- [SECTION IV — IA & DONNÉES (QUALITÉ, COÛT, ROBUSTESSE)](#section-iv--ia--données-qualité-coût-robustesse)
- [SECTION V — ARCHITECTURE, SÉCURITÉ & CONFORMITÉ](#section-v--architecture-sécurité--conformité)
- [SECTION VI — GO-TO-MARKET (B2C & B2B) AVEC MODE D'EMPLOI](#section-vi--go-to-market-b2c--b2b-avec-mode-demploi)
- [SECTION VII — MODÈLE ÉCONOMIQUE, TARIFS, UNIT ECONOMICS](#section-vii--modèle-économique-tarifs-unit-economics)
- [SECTION VIII — PLAN FINANCIER (12 MOIS, 10 ANS), SCÉNARIOS & STOP-LOSS](#section-viii--plan-financier-12-mois-10-ans-scénarios--stop-loss)
- [SECTION IX — OPÉRATIONS & GOUVERNANCE "SANS MOI"](#section-ix--opérations--gouvernance-sans-moi)
- [SECTION X — RISQUES, PARADES & INDICATEURS D'ALERTE](#section-x--risques-parades--indicateurs-dalerte)
- [ANNEXES](#annexes)
- [CONCLUSION](#conclusion)

---

## Executive Summary (1 page)

**Problème.** Acheter une voiture d'occasion est risqué (état, historique, juste prix). Les plateformes publient des annonces mais n'apportent pas de conseil neutre ; les garages/marchands manquent d'un rapport standardisé pour rassurer leurs clients.

**Solution.** Un copilote IA : tu poses une annonce (ou son URL) → l'IA produit un rapport pédagogique : score A→E, bande de prix, prix cible, plan de négociation, risques mécaniques/légaux, checklist d'achat, plan d'entretien, PDF lisible.

La même intelligence est proposée en API marque blanche (PDF au logo du professionnel), facturée à l'usage.

**Business model.**

- **B2C :** packs/abonnements (19–39 €/mois ou 29 €/an). LTV cible 120–140 €.
- **B2B :** Plans 99/299/999 €/mois + overage par rapport (marge 80–90 %). Churn < 5 % (verrouillage par intégration).
- **Marge nette :** 55–70 % (selon phase).

**Taille & traction visées.** Marché adressable francophone + DE/UK (phases). Objectifs réalistes :

- **M12 :** 500 B2C, 0–10 B2B → 4–5 k€ MRR net.
- **M36 :** 2 000 B2C + 10 B2B → 15–20 k€ MRR net.
- **M60 :** 4 000 B2C + 30 B2B → 30–40 k€ MRR net.

**Coût & risque.** Démarrage 7 600 € (dev, marketing, légal) + 10–12 k€ de trésorerie de sécurité. Architecture serverless (coûts fixes < 150 €/mois à faible volume). Stop-loss : si M6 < 1 000 € MRR, gel puis décision.

**Avantage compétitif.** Positionnement neutre & pédagogique, rapport clair pour décision, API WL "clé en main", coûts IA maîtrisés, automatisation (support/billing/ops).

---

## SECTION I — Marché, Vision, Proposition de valeur

### 1. Constat & opportunité

- **Asymétrie d'information :** l'acheteur particulier ne sait pas évaluer le risque ni le juste prix.
- **Plateformes ≠ conseil :** elles diffusent, mais n'expliquent pas (pas d'IA explicative neutre).
- **Pros :** veulent un outil rapide pour qualifier et un PDF rassurant pour signer plus vite.
- **Tendance :** normalisation de l'usage IA (2025–2030) → adoption progressive.

### 2. Vision à 10 ans

Devenir le **référentiel IA européen indépendant** pour tout le cycle VO : **Acheter → Entretenir → Revendre**.

**Valeurs :** neutralité, pédagogie, traçabilité (rapports remis au client final).

### 3. Proposition de valeur (B2C / B2B)

- **B2C :** Copilote IA = rapport lisible + plan d'action (prix cible, négociation, checklist).
- **B2B (API WL) :** Intelligence plug-and-play = même rapport, au logo du partenaire, facturé à l'usage.

### 4. Différenciation

1. **Rapports pédagogiques** (pas de jargon, décisions guidées).
2. **Neutralité** (pas vendeur, pas de conflit d'intérêt).
3. **Automatisation** (90 % des tâches récurrentes).
4. **Moat :** dataset propriétaire (rapports+feedback) + intégrations (API WL).

---

## SECTION II — Marché, Personas, TAM/SAM/SOM, Concurrence

### 1. Géographies & phasage

- **Phase 1 :** Europe francophone (FR/BE/CH/LU).
- **Phase 2 :** DE (mobile.de, TÜV culture technique), UK (GBP, miles).
- **Internationalisation :** textes/monnaies/unités dès le design.

### 2. Personas & cas d'usage

- **Acheteur prudent (B2C) :** veut prix cible, risques et checklist avant de se déplacer.
- **Parent/Familial (B2C) :** priorise fiabilité/coûts d'entretien et sécurité.
- **Garage indépendant (B2B) :** rapport standard pour convaincre et justifier.
- **Courtier/mandataire (B2B) :** ROI = plus de clôtures et panier moyen (services additionnels).

### 3. TAM / SAM / SOM (méthode pédagogique)

- **TAM (UE VO) :** ≈ 22 M transactions/an (ordre de grandeur).
- **Filtre "prêt à payer IA"** (0,1–0,3 % de TAM) → SAM ≈ 22 000–66 000 utilisateurs/an.
- **SOM (objectif réalisable 10 ans) :** 8–12 k B2C + 80–300 B2B (contrats actifs).

Hypothèse prudente fondée sur : adoption IA grand public, compétitivité prix, frictions locales (langue, marques, fiscalité).

### 4. Concurrence (qualitative)

- **Plateformes** (LaCentrale, AutoScout24, mobile.de, AutoTrader) : audiences fortes mais pas d'IA neutre.
- **Services historiques** (Carfax/CarVertical) : data historique, pas de guidage IA complet (prix cible + négo + PDF pédagogique).
- **Atout clé :** assistant explicatif + marque blanche = peu de substituts directs.

---

## SECTION III — Produit (B2C & B2B), Spécifications & UX

### 1. Parcours utilisateur (B2C)

1. **Entrée :** URL ou texte d'annonce + budget/usage.
2. **Analyse (4–5 s) :** scoring, prix marché, prix cible, arguments de négo.
3. **Rapport :** PDF lisible (A→E, risques, checklist, entretien).
4. **Actions :** Sauvegarder, comparer, partager, demander aide pro.
5. **Rétention :** Abo Véhicule (rappels entretien + estimation revente).

### 2. Fonctionnalités (B2C)

- **Score global** + sous-scores (mécanique, légal, entretien, prix).
- **Bande de prix** (min/med/max) + prix cible (et offre initiale).
- **5 risques majeurs** (preuve/gravité/action).
- **Checklist d'achat** + plan d'entretien prévisionnel.
- **PDF exportable**, mode "imprimer pour le vendeur".

### 3. Fonctionnalités (B2B / API White-Label)

- **Endpoints :** `POST /v1/evaluations`, `GET /v1/evaluations/{id}`, `GET /v1/evaluations/{id}/pdf?branding=OrgX`.
- **Branding :** logo/couleurs/coordonnées sur PDF.
- **Portail :** clé API, quotas, factures, webhooks, logs d'usage.
- **Facturation :** abonnement + metered (1 crédit = 1 rapport).
- **SLA :** Pro 99,5 %, Enterprise 99,9 %.

### 4. Back-office & outils "sans moi"

- **Console admin** (incident, coûts, usage, remboursements).
- **Macros de support** + assistant IA (FAQ).
- **Dashboards :** MRR/LTV/CAC, churn, NPS, SLO (latence/validité JSON).

---

## SECTION IV — IA & Données (qualité, coût, robustesse)

### 1. Stratégie IA

- **Chaîne :** pré-parse annonce → features → LLM court et contrôlé (JSON schema) → vérifications métiers → rendu PDF.
- **Coût :** 0,06–0,10 €/rapport (prompts courts, truncation, cache d'input, pré-traitement Mistral/OSS).
- **Robustesse :** validation bornée (prix), facts gate (évite hallucinations), contrôle JSON (99 %+).

### 2. Évaluation & tests

- **Jeux d'annonces de référence** (marques, moteurs, boîtes, kilométrage).
- **Metrics :** exactitude prix ±delta, cohérence, taux JSON valide, latence P95.
- **MLOps light :** journalisation coûts tokens / latence / erreurs, rollbacks versionnés.

### 3. Données & vie privée

- **Minimisation** (pas de PII sensibles), hachage e-mails, purge traces 90 jours (hors facturation).
- **RGPD :** base légale "exécution du contrat", DPA, droits (export/suppression ≤ 30 j).
- **Hébergement UE** (DB), Stripe pour cartes (PCI externalisé).

---

## SECTION V — Architecture, Sécurité & Conformité

### 1. Architecture (texte)

- **Front :** Next.js + Cloudflare Pages (CDN, SEO).
- **API :** Cloudflare Workers (multi-tenant, quotas, rate-limit, logs).
- **DB/Auth :** Supabase Postgres (+ RLS org_id/user_id).
- **LLM :** GPT-4o-mini + Mistral (pré-traitement/cost control) + fallback OSS.
- **Billing :** Stripe (subs + metered), Resend (emails), Sentry + UptimeRobot (observabilité).

### 2. Sécurité (résumé whitepaper)

- **Chiffrement :** TLS 1.2+, AES-256 repos, secrets KV/env, rotation 90 j.
- **RLS stricte** (isolation par org/user).
- **Logs :** masquage PII, request_id, alertes Telegram.
- **Désastres :** backups quotidiens, RPO 24 h, RTO < 2 h.
- **LLM :** anti prompt-injection, whitelists, JSON forcé (schemas), redaction PII.

### 3. Conformité

- **RGPD :** DPIA (registre, risques, mesures résiduelles), consentement cookies, mentions légales/CGU/CGV.
- **SLA/contrats :** crédits service si SLA non atteint, résiliation en cas d'abus, rétention 90 j pour traces non comptables.

---

## SECTION VI — Go-To-Market (B2C & B2B) avec mode d'emploi

### 1. B2C — Acquisition & rétention (pédagogique)

- **SEO :** 50 pages "evergreen" (guides par modèle, coûts entretien, checklists).
  - Cadence : 4 pages/mois ; objectif 3–5 k visites/mois (12 mois).
- **PPC :** Google (intentions "acheter [modèle] d'occasion"), CPA ≤ 30 €.
- **Freemium :** 3 analyses offertes contre e-mail (Free→Pay 3–5 %).
- **Emails :** séquences J1 / J3 / J7 / J30 (preuves chiffrées, cas réels).
- **Rétention :** Abo Véhicule (rappels entretien + estimation revente).

### 2. B2B — Prospection & signature

- **Landing "For Partners"** + docs publiques (OpenAPI) + clé test.
- **Offre :** essai 100 rapports gratuit, call 15 min si besoin.
- **Ciblage :** garages indépendants, courtiers VO.
- **Objectifs :** 2 pilotes M+8, 10 Pro M+12, 30 M+18.

### 3. CAC & canaux (repères)

- **SEO** 5–10 €, **PPC** 20–40 €, **Partenariats** 10–25 €, **B2B** 100–250 €/compte.
- **Règle :** LTV/CAC ≥ 3. Payback idéal < 4 mois.

---

## SECTION VII — Modèle économique, Tarifs, Unit Economics

### 1. Tarifs (lancement)

- **B2C :** Pack 1 (15 €), Std 19 €/mois (10 analyses), Pro 39 €/mois (30 analyses + checklists), Abo Véhicule 29 €/an.
- **B2B :** 99/299/999 €/mois + overage 0,90 / 0,75 / 0,60 €/rapport.

### 2. Unit economics (pédagogique)

- **ARPU B2C** ≈ 22 €/mois ; **Durée** ≈ 6,5 mois → **LTV 143 €**.
- **Coût IA :** 0,06–0,10 €/rapport ; frais paiement 1,4–2,9 % ; support (IA + macros).
- **Marge nette :** 55–60 % (an 1), 60–70 % (an 3+).
- **B2B :** marge variable 80–90 % (intégration = faible churn).

---

## SECTION VIII — Plan financier (12 mois, 10 ans), Scénarios & Stop-loss

### 1. 12 mois (synthèse mensuelle)

- **Opex** < 150 €/mois (infra) + marketing 300–700 €/mois (tests prudents M4→M12).
- **Décaissements initiaux (12 mois)** ≈ 7 600 € (Outils/Dev/Marketing/Légal).
- **Objectif M12 :** 500 B2C, 0–10 B2B → ~15 k€ CA/mois, ~8 k€ nets.

### 2. 10 ans (annuel, scénario "réaliste")

| Année | B2C   | B2B | CA total  | Résultat net (marge) |
|-------|-------|-----|-----------|---------------------|
| 1     | 500   | 0   | 65 k€     | 35,8 k€ (55%)       |
| 3     | 2 000 | 10  | 307,9 k€  | 184,7 k€ (60%)      |
| 5     | 4 000 | 30  | 663,6 k€  | 431,4 k€ (65%)      |
| 10    | 8 000 | 80  | 1,423 M€  | 925,0 k€ (65%)      |

**Valorisation repère micro-SaaS :** MRR net × (16–36) (à ajuster selon croissance/risques).

### 3. Scénarios

- **Haut :** ARPU 25 €, durée 7 mois, 120 B2B → CA 2,0–2,4 M€, marge 68–70 %.
- **Bas :** ARPU 19 €, durée 5,5 mois, 40 B2B → CA 0,9–1,1 M€, marge 55–60 %.

### 4. Stop-loss & critères "famille d'abord"

- **Stop-loss M6 :** si MRR < 1 000 €, gel des dépenses ; décision.
- **Seuil confort** (avant transition carrière) : ≥ 5 000 € nets/mois stables 6 mois.

---

## SECTION IX — Opérations & Gouvernance "Sans moi"

### 1. Organisation & rôles

- **Fondateur :** PO/vision, analytics, accords B2B, arbitrages.
- **Freelances (ponctuels) :** UI/UX, QA, contenu SEO, légal.
- **IA internes :** support, génération contenu, reporting.

### 2. SOP (procédures)

- **Release :** staging → canary → prod, rollback instantané, changelog client.
- **Support :** IA → macros → humain (SLA 24–48 h), NPS mensuel.
- **Incident :** alertes, page statut, RCA < 72 h, prévention.

### 3. Temps hebdomadaire (objectif)

- **M0–M3 :** 25–30 h/sem (mise en place).
- **M4–M6 :** 12–15 h/sem (stabilisation).
- **M7–M18 :** 8–10 h/sem (croissance).
- **> M18 :** 4–6 h/sem (maturité).

### 4. KPI & tableaux de bord

**MRR net** (+8 %/mois), **LTV/CAC** ≥ 3, **churn** B2C < 15 % / B2B < 5 %, **coût IA** ≤ 0,10 €, **uptime** ≥ 99,5 %, **NPS** ≥ 30.

---

## SECTION X — Risques, Parades & Indicateurs d'alerte

| Risque | Impact | Parade | Indicateurs |
|--------|--------|--------|-------------|
| Conversion faible | CA ↓ | Preuve € (prix cible vs annonce), pack 3, garantie | CTR, Free→Pay, heatmaps |
| Churn haut | MRR instable | Abo Véhicule + Entretien | Rétention M2/M3 |
| Coût IA ↑ | marge ↓ | prompts courts, cache, fallback OSS | €/rapport, tokens |
| SEO lent | acquisition chère | PPC + outil gratuit | Trafic organique, CPA |
| Concurrence | pression prix | API WL, dataset, marque | win/loss, parts de voix |
| Charge > prévue | burn-out | automations, délégation | heures/sem, backlog |

---

## ANNEXES

### Annexe A — Modèle Financier Mensuel (12 mois) : P&L détaillé + Cash

#### A.1. Hypothèses de départ (M1)

- **Prix & mix B2C :** Pack 1 (15 €) 20 %, Abonnement Std (19 €/mois) 60 %, Pro (39 €/mois) 20 %.
- **ARPU B2C** (moyenne pondérée) ≈ 22 €/mois (avec remises/packs).
- **Lancement B2B :** pipeline construit dès M7, premières facturations M9 (pilotes).
- **Coût IA/rapport :** 0,08 € (moyenne) ; 3,5 rapports/mois/abonné B2C moyen (Std+Pro).
- **Infra :** 120 €/mois (Supabase 25, Cloudflare 25, Sentry Team 29, Resend 15, divers 26).
- **Marketing (M1–M3) :** 300 €/mois (tests PPC légers + contenus SEO).
- **Marketing (M4–M12) :** 1 050 €/mois (SEO 400, Google 300, Meta 200, partenariats 150).
- **Frais paiement :** 2,5 % + 0,25 € / transaction (moyenne marché).
- **Freelances ponctuels** (M2, M5, M8, M11) : UI/SEO/QA 400 € ces mois-là.
- **Support :** 0 € → 200 €/mois (M8→) si besoin de renfort (partiel).

#### A.2. P&L mensuel (M1 → M12)

| Mois | B2C actifs fin | B2B (comptes) | MRR B2C € | MRR B2B € | MRR total € | COGS € | Marge brute € | OPEX € | Résultat op. € |
|------|----------------|---------------|-----------|-----------|-------------|--------|---------------|--------|----------------|
| M1   | 50             | 0             | 1 100     | 0         | 1 100       | 115    | 985           | 420    | 565            |
| M2   | 80             | 0             | 1 760     | 0         | 1 760       | 180    | 1 580         | 820*   | 760            |
| M3   | 120            | 0             | 2 640     | 0         | 2 640       | 270    | 2 370         | 300    | 2 070          |
| M4   | 160            | 0             | 3 520     | 0         | 3 520       | 360    | 3 160         | 1 050  | 2 110          |
| M5   | 190            | 0             | 4 180     | 0         | 4 180       | 420    | 3 760         | 1 450* | 2 310          |
| M6   | 220            | 0             | 4 840     | 0         | 4 840       | 485    | 4 355         | 1 050  | 3 305          |
| M7   | 280            | 0             | 6 160     | 0         | 6 160       | 615    | 5 545         | 1 050  | 4 495          |
| M8   | 320            | 0             | 7 040     | 0         | 7 040       | 700    | 6 340         | 1 250* | 5 090          |
| M9   | 360            | 4 (pilotes)   | 7 920     | 1 596     | 9 516       | 845    | 8 671         | 1 050  | 7 621          |
| M10  | 420            | 6 (mix)       | 9 240     | 2 394     | 11 634      | 1 030  | 10 604        | 1 050  | 9 554          |
| M11  | 460            | 8 (mix)       | 10 120    | 3 192     | 13 312      | 1 160  | 12 152        | 1 450* | 10 702         |
| M12  | 500            | 10 (mix)      | 11 000    | 3 990     | 14 990      | 1 290  | 13 700        | 1 050  | 12 650         |

*OPEX inclut un pic freelance (+400 €) aux mois signalés.

**Notes :**

- COGS calcule : coût IA (0,08 € × 3,5 rapports × B2C actifs + usage B2B) + frais paiement.
- Résultat op. ≈ EBITDA (hors amortissements/impôts). Marge nette annuelle ≈ 55 % (année 1).

#### A.3. Trésorerie / Cash (cumul sur 12 mois)

- **Décaissements initiaux** 7 600 € : Outils/Infra 1 950, Dev/QA 2 200, Marketing 2 450, Légal 1 000.
- **Flux opérationnels positifs** dès M3–M4 (selon pub).
- **Trésorerie de sécurité :** 10–12 k€ (non engagée sans accord).

---

### Annexe B — Hypothèses B2C (modèle, comportements, LTV)

#### B.1. Segments B2C & mix produit

- **"Chasseur d'opportunité" (35 %) :** achète vite, sensible au prix — privilégie Pack 1 + Std 19 € 1–2 mois.
- **"Prudent planificateur" (45 %) :** compare 3–6 annonces, reste 3–6 mois — Std 19 €.
- **"Exigeant Pro-am" (20 %) :** veut de la profondeur — Pro 39 € 3–4 mois.

#### B.2. ARPU & LTV

- **ARPU 22 €** = 0,2×15 + 0,6×19 + 0,2×39 (arrondi après remises et packs).
- **Durée moyenne :** 6,5 mois (rétention soutenue par Entretien + Abo Véhicule).
- **LTV** = 22 × 6,5 = 143 € (réaliste).

#### B.3. Comportements & usage

- **Rapports/mois :** 2–5 (moyenne 3,5) ; pics le week-end.
- **Fonctions clés utilisées :** prix cible (98 %), checklist (80 %), PDF (70 %), plan entretien (55 %).
- **Événements de valeur ("aha moment") :** obtenir prix cible et arguments de négo.

#### B.4. Rétention & churn

- **Churn initial élevé** (usage ponctuel) → mitigé par Entretien (rappels + coûts prévisionnels).
- **Cible plateau M+5 :** 30–40 % des cohortes actives (cf. Annexe F).
- **Actions :** e-mails J7/J14 avec avant/après et "prochain pas".

---

### Annexe C — Hypothèses B2B (API WL) : pipeline, ARPA, usage

#### C.1. Pipeline & cycles

- **Target :** garages indépendants (5–25 ventes VO/mois), courtiers VO, mandataires.
- **Cycle :** 1–2 visios (15–30 min), essai 100 rapports gratuit, signature Starter/Pro.
- **Ratios (phase 1) :**
  - Leads qualifiés → essais : 35 %
  - Essais → payants : 25 %
  - Payants → Pro (3 mois) : 40 %

#### C.2. ARPA & usage

- **Starter** 99 € / 100 crédits (1 crédit = 1 rapport) ; dépassement : 0,90 €.
- **Pro** 299 € / 400 crédits ; dépassement : 0,75 €.
- **Enterprise** 999 € / 2 000 crédits ; dépassement : 0,60 €.
- **ARPA moyen** 299 € + 100 € d'overage au bout de 90 jours (quand l'intégration est bien faite).

#### C.3. Churn & lock-in

- **Churn visé** < 5 %/mois (intégration = verrouillage).
- **Switching cost :** rebrancher signature, reporting, formation commerciale, PDF WL.
- **Upsell :** Enterprise si > 1 000 rapports/mois.

---

### Annexe D — CAC par Canal & Budget Publicitaire (M4 → M12)

#### D.1. Structure d'acquisition (B2C)

| Canal | Budget mensuel | CPC/CPM cible | CTR | Conv. Landing | Free→Pay | CAC estimé |
|-------|----------------|---------------|-----|---------------|----------|-----------|
| SEO contenu | 400 € | — | — | 10–18 % | 3–5 % | 5–10 € |
| Google Ads | 300 € | CPC 0,40–0,80 € | 3–8 % | 12–20 % | 3–5 % | 25–35 € |
| Meta Ads | 200 € | CPM 6–14 € | 1–2 % | 8–12 % | 2–3 % | 20–30 € |
| Partenariats | 150 € | Forfait | — | — | — | 10–25 € |

**Objectif :** CAC moyen ≤ 25 € (pondéré).

#### D.2. Structure d'acquisition (B2B)

| Source | Coût/unité | Conv. essai | Conv. payant | CAC par compte |
|--------|------------|-------------|--------------|----------------|
| Outbound email ciblé | 1,5 €/lead | 10–15 % | 20–30 % | 100–200 € |
| LinkedIn InMail | 3,0 €/lead | 10–12 % | 15–25 % | 150–250 € |
| Webinaires/partenaires | 250 €/event | — | 15–30 % | 150–300 € |

---

### Annexe E — Funnel & Conversions (B2C) : repères & leviers

#### E.1. Funnel cible (B2C)

1. **Impressions → Clics :** CTR 3–8 % (Google Ads) / 1–2 % (Meta).
2. **Clics → Essais :** 12–18 % (landing claire, preuve sociale, démo).
3. **Essais → Payants :** 3–5 % (pack 3, garantie satisfaction, "prix cible" en avant).
4. **M1 → M2 :** 70–80 % (Entretien, e-mails J7/J14).
5. **M2 → M3 :** 65–72 % (PDF partageable, comparateur d'annonces).

#### E.2. Leviers d'optimisation

- **Proposition de valeur :** "Économisez 500–2 000 € grâce au prix cible IA."
- **Preuve :** cas réels (avant/après négociation), NPS, avis.
- **Design landing :** 1 CTA principal, vidéo 60–90 s, FAQ, confiance (logos partenaires).
- **Onboarding :** importer 1ère annonce sans compte → capter l'email après l'aperçu.

---

### Annexe F — Cohortes & Rétention (B2C)

#### F.1. Matrice de cohortes (exemple pédagogique)

| Cohorte | M+1 | M+2 | M+3 | M+4 | M+5 | M+6 |
|---------|-----|-----|-----|-----|-----|-----|
| Janv    | 78% | 62% | 52% | 45% | 38% | 34% |
| Fév     | 77% | 61% | 51% | 44% | 37% | 33% |
| Mars    | 79% | 63% | 53% | 46% | 39% | 35% |

**Cible :** plateau 30–40 % à M+5–M+6.

**Actions :**

- **Entretien** (rappels périodiques + coût d'entretien personnalisé).
- **E-mail M+2 :** "Quand revendre au meilleur prix ?" → module Revente.
- **Upsell Abo Véhicule** (29 €/an) après achat.

---

### Annexe G — Modèle de Coûts IA (LLM) & Optimisation

#### G.1. Formule générale

```
Coût/rapport = (Tokens_in × Prix_in + Tokens_out × Prix_out) × (1 + overhead)
```

Overhead = appels auxiliaires + parsing + stockage.

#### G.2. Budget tokens par étape (exemple)

- **Prétraitement** (Mistral/OSS) : 600–1 000 in (0 € si OSS)
- **Analyse LLM :** 2 200–3 200 in / 400–700 out
- **Validation / post-process :** 200 in / 200 out

**Total :** 3 000–4 500 in / 600–900 out → 0,01–0,03 € bruts (selon tarifs), + overhead (PDF/infra) → 0,05–0,10 €.

#### G.3. Réduction des coûts (leviers)

- **Prompts courts** (sections atomiques, few-shot minimal).
- **Cache d'entrée** (hash de l'annonce → éviter ré-analyses identiques).
- **Troncature** (prix/texte superflu).
- **Validation locale** (bandes de prix bornées, contrôles types).
- **Batch PDF** (générer à la demande / file d'attente).

---

### Annexe H — Coûts Serverless, SLO & Capacité

#### H.1. Opex infra (prévision)

- **Cloudflare Pages/Workers :** 0–25 € (palier gratuit puis à l'usage).
- **Supabase** (Postgres+Auth) : 25–50 €.
- **Sentry Team :** 29 €. **Resend :** palier gratuit → 15–25 €.
- **Divers** (DNS, stockage, analytics) : 10–20 €.

#### H.2. SLO & Monitoring

- **Latence P95** < 5 s ; **JSON valide** ≥ 98 % ; **Uptime** ≥ 99,5 %.
- **Alertes :** seuils erreurs > 1 % (5 min), latence > 6 s (P95), quotas B2B à 80 %.
- **Capacity :** 100 req/min sans dégradation sur plan Pro ; mise à l'échelle horizontale native (Cloudflare).

---

### Annexe I — RGPD / DPIA (complet opérationnel)

#### I.1. Finalités & bases légales

- **B2C :** exécution du contrat (évaluer l'annonce, produire rapport).
- **B2B :** exécution du contrat ; intérêt légitime pour logs de sécurité.
- **Marketing :** consentement (newsletters, cookies analytics).

#### I.2. Catégories de données & minimisation

- **Identifiants** (email), préférences, annonces (texte/URL), logs techniques (request_id).
- **Pas de données sensibles requises** (origine, santé…).
- **Pseudonymisation** des identifiants côté logs.

#### I.3. Durées de conservation

- **Données opérationnelles** (rapports) : 90 jours (sauf sauvegarde personnelle client).
- **Logs techniques :** 90 jours.
- **Données de facturation :** 10 ans (obligations fiscales, Stripe).

#### I.4. Droits des personnes (DSAR)

- **Export & suppression** ≤ 30 jours (portail ou e-mail DPO).
- **Rectification & limitation :** via interface compte.
- **DPA** (accord sous-traitant) avec sous-processeurs (hébergeur, email, paiement).

#### I.5. Cartographie de flux

- **Front → API** (TLS) → DB Postgres (UE) ; Stripe pour paiements ; Resend pour emails.
- **LLM :** envoi minimal de champs utiles (redaction PII), pas de stockage long terme hors rapport.

#### I.6. Analyse de risques (extrait)

| Risque | Prob. | Impact | Mesures | Résiduel |
|--------|-------|--------|---------|----------|
| Vol de clé API | M | H | rotation 90 j, scopes, alertes | M |
| Fuite logs | B | M | masquage PII, rétention 90 j | B |
| Droit d'accès en retard | B | M | DSAR automatisé, SLA 30 j | B |

---

### Annexe J — SLA & CGA (modèle contractuel condensé)

#### J.1. SLA

- **Disponibilité :** Pro 99,5 %, Enterprise 99,9 % (mensuel).
- **Crédits :** 5 % (99–99,5), 10 % (98–99), 25 % (< 98).
- **Support :** Pro (J+1 ouvré), Enterprise (J+0, 8×5).
- **Temps d'intervention :** P1 < 1 h, P2 < 4 h, P3 < 2 j.

#### J.2. CGA (extraits)

- **Usage conforme à la loi** ; interdiction de scraping massif non autorisé.
- **Propriété intellectuelle du fournisseur** ; non exclusivité.
- **Résiliation :** 30 j ; pour faute grave : immédiate.
- **Limitation de responsabilité :** plafonnée à 3 mois d'abonnement (sauf faute lourde).

---

### Annexe K — API Étendue : erreurs, pagination, idempotency, webhooks

#### K.1. Erreurs (codes & messages)

| HTTP | code (JSON) | message |
|------|-------------|---------|
| 400 | invalid_request | Champ manquant/format invalide |
| 401 | unauthorized | Clé absente/incorrecte |
| 403 | quota_exceeded | Limite de crédits atteinte |
| 404 | not_found | Ressource introuvable |
| 409 | conflict | Idempotency-Key déjà utilisée |
| 422 | unprocessable_entity | JSON non conforme (schema) |
| 429 | rate_limit_exceeded | Trop de requêtes |
| 5xx | internal_error | Erreur serveur |

#### K.2. Pagination

- `GET /v1/evaluations:list?limit=25&cursor=eyJpZCI6I...`
- Réponse : `{ data: [...], next_cursor: "..." }`

#### K.3. Idempotency

- Header `Idempotency-Key` (UUID v4).
- Même corps + même clé → même résultat (200) ; corps différent → 409 conflict.

#### K.4. Webhooks (sécurité)

- `X-Signature` HMAC-SHA256 du payload + `X-Timestamp`.
- **Retentatives :** 30 s / 120 s / 300 s (max 3).
- **Code de retour attendu :** 2xx.

---

### Annexe L — Sensibilités Prix & Offres (B2C) : élasticité & A/B

#### L.1. Matrice prix (ex. France)

| Offre | Variante A | Variante B | Variante C |
|-------|-----------|-----------|-----------|
| Pack 1 | 15 € | 19 € | 12 € |
| Abonnement Std | 19 € | 25 € | 17 € |
| Abonnement Pro | 39 € | 45 € | 35 € |

**Effets attendus :**

- **+Prix (B) :** ARPU ↑, conversion ↓ (−0,5 à −1,5 pt).
- **−Prix (C) :** ARPU ↓, conversion ↑ (+1 à +2 pts).

**Décision** = MRR = (#clients × ARPU) − Churn × LTV/12.

#### L.2. Plan A/B

- **Durée :** 4 semaines (significatif).
- **KPI :** Free→Pay, ARPU, Rétention M2, MRR.
- **Taille :** min 500 essais/variante.

---

### Annexe M — SEO Plan (12 mois) : clusters, briefs, maillage

#### M.1. Clusters (exemples)

- **Guides Achat par modèle :** "Acheter une Clio 4 d'occasion : checklist & prix".
- **Coûts d'entretien :** "Entretien 308 1.2 PureTech : budget annuel".
- **Revente optimisée :** "Comment revendre sa Megane au meilleur prix ?".
- **IA auto :** "Comment l'IA fixe un prix cible automobile".

#### M.2. Cadence & production

- **4 pages/mois** × 12 = 48–50 pages.
- **Brief type** (1 200–1 800 mots) : intention, structure H2/H3, FAQ, schema.org FAQPage/Article, comparatifs, CTA judicieux.

#### M.3. Maillage interne

- **Pages pilier** (Guides Achat) → pages fille (modèles/versions).
- **Liens contextuels :** "Voir prix cible IA pour ce modèle".

#### M.4. KPI SEO

- **Trafic organique**, positions top 10, CTR, conversions Free→Pay.
- **Objectif 12 mois :** 3–5 k visites/mois → 90–250 payants/mois (3–5 %).

---

### Annexe N — Publicité Payante & A/B (B2C/B2B)

#### N.1. Google Ads (Search)

- **Campagnes :** "acheter [modèle] d'occasion", "prix [modèle] d'occasion", "vérifier une voiture avant achat".
- **Ciblage :** FR + BE/CH/LU francophones.
- **Extensions :** sitelinks "Exemple de rapport", "Prix cible IA".
- **KPI :** CPC 0,40–0,80 €, CTR 3–8 %, CPA ≤ 30 €.

#### N.2. Meta Ads (vidéos courtes)

- **Format UGC :** "Je fais analyser mon annonce par l'IA" (60 s).
- **Ciblage :** intention auto VO, lookalike acheteurs.
- **KPI :** CPM 6–14 €, CTR 1–2 %, CPA ≤ 30 €.

#### N.3. B2B (LinkedIn + Email)

- **Message :** "Rapports IA au logo de votre garage (2 min), 100 gratuits."
- **Tunnel :** landing "For Partners" → clé test → visio 15 min (option).
- **KPI :** essai→payant 20–30 %.

#### N.4. A/B (calendrier)

- **S1–S4 :** prix Std 19 vs 25 ; Pack 1 (15 vs 19).
- **S5–S8 :** landing (preuve sociale en haut vs bas) ; vidéo 30 vs 60 s.
- **S9–S12 :** e-mails J1 (cas réel vs tutoriel), J7 (prix cible vs entretien).

---

### Annexe O — Registre des Risques (développé)

| Risque | Prob. | Impact | Signaux précoces | Parades | Owner |
|--------|-------|--------|------------------|---------|-------|
| Conversion faible | M | H | CTR < 2 %, Free→Pay < 2 % | A/B pricing, preuve € (cas réels), refaire USP | PM |
| Churn élevé B2C | M | M | Rétention M2 < 20 % | Entretien, Abo Véhicule, emails personnalisés | PM |
| Coût IA ↑ | M | M | €/rapport > 0,15 € | prompts courts, cache, fallback OSS | Tech |
| Incidents API | B | H | 5xx > 1 %, latence P95>6s | canary, rollback, DR, SLO | Tech |
| RGPD plaintes | B | H | DSAR en retard | DSAR automatisé, registre, DPO | DPO |
| Concurrence agressive | M | H | baisse win-rate | différenciation WL, dataset, marque | CEO |
| Charge fondateur | M | M | >12 h/sem > 4 sem | délégation/freelances, SOP, "stop adds" | CEO |
| SEO lent | M | M | Trafic < plan 3 mois | +PPC, outils gratuits | Growth |
| Ventes B2B lentes | M | M | essais sans conversion | essai 100 rapports, cas métiers, ROI | Sales |

---

### Annexe P — OpenAPI + SDK (extrait exploitable)

**Principes.** `/v1`, Auth Bearer, Idempotency-Key, rate-limit 60 req/min/org (600 Enterprise), pagination limit/cursor, erreurs `{code,message,details,request_id}`, webhooks (`evaluation.completed`, `evaluation.failed`, `quota.low`, `invoice.paid`, `invoice.payment_failed`).

**Schémas clés (résumé) :**

- **EvaluationRequest :** locale, pricing_currency, criteria (budget/usage), listing (title, price, mileage, fuel, gearbox, first_reg, vin?, url?, notes…).
- **EvaluationResponse :** status, scores (global, mécanique, légal, entretien, prix), prix (annonce/min/med/max/prix_cible), negociation (offre_initiale/max, arguments), risques (type/gravité/preuve/action), checklist, cost (tokens, latency).

**Exemples**

- **cURL :**

```bash
curl -X POST https://api.tonsaas.com/v1/evaluations \
 -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
 -H "Idempotency-Key: $(uuidgen)" \
 -d '{"locale":"fr-FR","pricing_currency":"EUR","listing":{"title":"Clio","price":8990,"mileage_km":89000,"fuel":"petrol","gearbox":"manual"}}'
```

- **JavaScript/TS :** utilitaire fetch (gestion erreurs + idempotency).
- **Python :** `requests.post(..., timeout=15)` + `raise_for_status()`.

**Erreurs & retries.** Backoff exponentiel ; respect Retry-After ; idempotency pour éviter doublons.

---

### Annexe Q — Whitepaper Sécurité (résumé opérationnel)

- **Menaces :** vol de clé, injection prompt/URL, DDoS, supply-chain, exfiltration logs.
- **Gouvernance :** CISO (fondateur), DPO externe ; politiques accès ; rotation clés 90 j.
- **Architecture :** RLS stricte, secrets KV/env, TLS 1.2+, AES-256 repos, backups chiffrés (RPO 24 h / RTO < 2 h).
- **LLM Security :** whitelists, redaction PII, JSON schemas, facts gate pour bornes prix.
- **Observabilité :** request_id, masquage PII, Sentry/UptimeRobot → Telegram.
- **SDLC :** revue code, SAST/DAST, SBOM, Renovate, envs séparés.
- **RGPD :** DPIA, DPA, purge 90 j, DSAR ≤ 30 j, Stripe Tax (TVA).
- **DR & DDoS :** runbooks, bascule modèle, cache "last good", WAF/CDN.
- **Auditabilité :** pentest annuel, remédiations < 30 j.

---

### Annexe R — Modèle financier 10 ans (méthode + tableaux)

**Assumptions "réaliste" :** ARPU B2C 22 €, durée 6,5 m (LTV 143 €) ; B2B 299 €/mois + 100 € usage ; coût IA 0,06–0,10 € ; marge nette 55 % → 65 %.

#### P&L annuel (extrait)

| Année | B2C | B2B | CA total | Résultat net |
|-------|-----|-----|----------|--------------|
| 1 | 500 | 0 | 65 k€ | 35,8 k€ (55%) |
| 3 | 2k | 10 | 307,9 k€ | 184,7 k€ (60%) |
| 5 | 4k | 30 | 663,6 k€ | 431,4 k€ (65%) |
| 10 | 8k | 80 | 1,423 M€ | 925,0 k€ (65%) |

**Scénarios & valorisation :** voir §VIII. Multiple micro-SaaS : 16–36× MRR net.

**Feuille de calcul recommandée (onglets) :** Assumptions, Acquisition (trafic/CTR/conv/CAC), Cohortes, Revenue (B2C/B2B), COGS (LLM/infra), OPEX, P&L mensuel (A1–A2), P&L annuel (A1–A10), KPI (LTV/CAC, Payback, MRR, Churn).

---

### Annexe S — Roadmap technique 24 mois (jalons & critères)

**T1 (M0–M3) — MVP Achat :** API /v1/evaluations, Front, Stripe, Supabase, Sentry.

**DoD :** JSON valide ≥ 98 %, P95 < 5 s, coût ≤ 0,10 €.

**T2 (M4–M6) — Automations & Monitoring :** Support IA, Resend, dashboards KPI, status page, alertes Telegram.

**DoD :** tickets < 5/j, "time-to-first-value" < 2 min.

**T3 (M7–M9) — Entretien v1 + bêta :** module entretien, PDF+, checklists dynamiques.

**DoD :** Rétention M2 ≥ 25 %, NPS ≥ 30.

**T4 (M10–M12) — API White-Label :** PDF WL, metered billing, sandbox, clés API, docs publiques.

**DoD :** 2 pilotes B2B actifs, SLA 99,5 %.

**T5 (M13–M18) — Revente + SEO :** estimation revente, texte d'annonce, photo-guide ; 30 pages SEO ; analytics contenu.

**DoD :** 3 000 visites/mois, Free→Pay ≥ 3 %.

**T6 (M19–M24) — Scale & International (DE/UK) :** i18n (de-DE/en-GB), miles/GBP, docs locales, multi-devise.

**DoD :** 10–15 B2B Pro, uptime ≥ 99,7 %.

**Gates :** (1) coût/JSON OK → T2 ; (2) support/TTFV OK → T3 ; (3) rétention/NPS OK → T4 ; (4) 2 B2B + SLA OK → T5 ; (5) trafic/conv OK → T6.

---

## Conclusion

Un copilote IA automobile : neutre, pédagogique, automatisé — utile pour les particuliers, bancable en API marque blanche pour les pros.

Architecture légère, coûts bas, marge élevée, plan de croissance prudent et cadre de risque maîtrisé (stop-loss, SOP, sécurité, RGPD).

**Objectif :** bâtir en 12–24 mois un actif SaaS récurrent, extensible à l'Europe, avec une charge hebdomadaire 4–6 h à maturité.

---

## (Facultatif) Prochaines actions recommandées

1. **Sprint 0 (7–10 jours) :** setup repo, Workers, Supabase, Stripe, Sentry, Pages, base UI.
2. **Jeu d'essai :** 100 annonces réelles (QA), métriques latence/JSON/coût.
3. **Landing + freemium :** formulaire "3 analyses gratuites", e-mail J1/J3/J7.
4. **Docs API (public)** + clé test ; outreach garages (pitch + essai 100 rapports).
5. **Tableau de bord MRR/Churn/Coût IA/Temps hebdo** partagé (transparence).
