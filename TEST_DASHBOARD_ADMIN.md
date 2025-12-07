# Guide de test - Dashboard Admin

## ⏳ Attendre la fin du build (~2-3 minutes)

Dans Cloudflare Pages, attendez que le statut passe à :
- ✅ **Success** (vert)

## 🧪 Tests à effectuer

### Test 1 : Dashboard Admin avec API Plausible

**URL :** https://www.checktonvehicule.fr/admin

**Étapes :**
1. Ouvrez le lien dans votre navigateur
2. Entrez le mot de passe : `admin2025`
3. Cliquez sur "Se connecter"

**Résultat attendu :**
- ✅ Les statistiques Plausible s'affichent :
  - Visiteurs uniques
  - Pages vues
  - Taux de rebond
  - Durée moyenne
- ✅ Liste des événements personnalisés (si du trafic récent)
- ✅ Pas de message d'erreur "PLAUSIBLE_API_KEY not configured"

**Si erreur 401 :**
- Votre clé API Plausible est invalide
- Vérifiez qu'elle a la permission `stats:read:*`

**Si "No data" :**
- Normal s'il n'y a pas encore de trafic aujourd'hui
- Changez la période vers "7 derniers jours"

---

### Test 2 : Tracking des événements

**En navigation privée :**

1. **Test inscription :**
   - Allez sur https://www.checktonvehicule.fr
   - Remplissez le formulaire d'inscription
   - Cliquez sur "Je m'inscris"
   - **Event tracké :** `Signup`

2. **Test analyse démo :**
   - Collez une annonce dans la zone de texte
   - Cliquez sur "Analyser avec l'IA"
   - **Events trackés :** 
     - `Demo_Analyse_Started` (au clic)
     - `Demo_Analyse_Success` (si réussi)
     - Ou `Demo_Analyse_Error` (si erreur)

3. **Test historique :**
   - Allez sur https://www.checktonvehicule.fr/mon-espace
   - Entrez un email et cliquez sur "Voir mes analyses"
   - **Events trackés :**
     - `Historique_Consulted`
     - `Historique_Loaded` (si des analyses trouvées)

4. **Test rapport :**
   - Si vous avez des analyses, cliquez sur "Voir le rapport"
   - **Events trackés :**
     - `Rapport_Viewed`
     - `Rapport_Loaded`

---

### Test 3 : Vérifier les events dans Plausible

**URL :** https://plausible.io/checktonvehicule.fr

**Étapes :**
1. Allez dans votre dashboard Plausible
2. Cliquez sur **"Goal conversions"** dans le menu
3. Attendez 1-2 minutes (délai de traitement)
4. Vous devriez voir apparaître les nouveaux events

**Events à surveiller :**
- Signup
- Demo_Analyse_Started
- Demo_Analyse_Success / Demo_Analyse_Error
- Historique_Consulted / Historique_Loaded
- Rapport_Viewed / Rapport_Loaded

---

### Test 4 : Sélection de période dans le dashboard

**Retournez sur :** https://www.checktonvehicule.fr/admin

**Testez les 4 boutons de période :**
- Aujourd'hui
- 7 derniers jours
- 30 derniers jours
- Ce mois-ci

**Résultat attendu :**
- ✅ Les statistiques se mettent à jour
- ✅ Pas de message d'erreur
- ✅ Les chiffres changent selon la période

---

## ✅ Checklist finale

- [ ] Dashboard admin accessible et fonctionnel
- [ ] Statistiques Plausible s'affichent
- [ ] Events trackés lors des actions
- [ ] Events visibles dans Plausible.io
- [ ] Sélection de période fonctionne

## 🐛 Problèmes courants

**Dashboard vide :**
- Pas encore de trafic → testez avec "7 derniers jours"
- Vérifiez que votre site a eu du trafic récemment

**"PLAUSIBLE_API_KEY not configured" :**
- La variable n'est pas dans l'environnement Production
- Ou le build n'a pas récupéré les nouvelles variables

**Events non trackés :**
- Vérifiez la console navigateur (F12)
- Le script Plausible doit être chargé (pa-*.js)
- Attendez 1-2 minutes, délai normal de traitement

---

**Une fois tous les tests OK, votre dashboard admin est pleinement opérationnel ! 🎉**


