# Audit approfondi — GlucoMeal.ai

_Date : 8 octobre 2026 — périmètre : tout le dépôt (`server.ts`, `src/`, règles Firebase, configuration Vercel/PWA, dépendances, tests, documentation)._

## 0. Synthèse

GlucoMeal.ai calcule des **doses d'insuline** à partir d'estimations de glucides. Toute erreur de calcul ou toute donnée inventée peut donc conduire à une hypoglycémie sévère (surdosage) ou à une hyperglycémie (sous-dosage). C'est le critère qui fixe la gravité de chaque constat ci-dessous.

| Gravité | Nombre | Thèmes principaux |
|---|---|---|
| 🔴 Critique | 6 | Glucides inventés quand l'IA échoue, hypoglycémie non détectée, prise de contrôle des codes de synchronisation (avec injection de ratios d'insuline), API de synchronisation sans authentification, correspondance d'aliments erronée, absence de garde-fous sur le profil |
| 🟠 Élevé | 9 | Données CGM périmées, secret Nightscout exposé, portail médecin non protégé, statistiques cliniques inventées, benchmark simulé présenté comme réel, auto-titration trop agressive, plafond de 20 UI identique pour un enfant, erreurs d'analyse non affichées, photos trop lourdes pour Vercel |
| 🟡 Moyen | 11 | Dépendances vulnérables, parseur de texte fragile, injection de prompt, CORS, en-têtes de sécurité, limiteur de débit, Storage rules absentes, etc. |
| 🔵 Faible / qualité | 10 | Bundle de 2,7 Mo, artefact `api/index.js` désynchronisé, `lang="en"`, README inexact, couverture de tests, etc. |

**État de la chaîne technique** (vérifié lors de cet audit) :
- `tsc --noEmit` : ✅ aucune erreur
- `vitest run` : ✅ 28/28 tests (le README annonce 23/23)
- `vite build` : ✅, mais un seul chunk JS de **2,77 Mo** (745 Ko gzip)
- `npm audit --omit=dev` : ❌ **10 vulnérabilités** (1 critique, 6 élevées, 3 modérées)

**Verdict :** en l'état, l'application ne devrait pas être utilisée pour décider d'une dose d'insuline réelle. Les points P0 (section 6) doivent être corrigés en priorité. En parallèle, il faut clarifier le statut réglementaire (un calculateur de bolus est un dispositif médical).

---

## 1. 🔴 Constats critiques

### C1. Des glucides inventés sont renvoyés quand l'IA échoue (risque de surdosage)
- `server.ts:497-498` : si Gemini échoue ou si la clé est absente, l'analyse **photo** renvoie `buildFallbackAnalysis('Couscous tunisien traditionnel')`, c'est-à-dire un couscous fictif de **92 g de glucides** (`server.ts:751-819`), avec la note « _Analyse effectuée avec la base alimentaire certifiée GlucoMeal_ ».
- `server.ts:1149-1150` : un texte non reconnu (ex. « salade verte et poisson grillé ») renvoie le même plat de 92 g.
- `server.ts:743-744` : même repli par défaut pour une étiquette nutritionnelle illisible.
- `server.ts:647` : un code-barres vide est remplacé par `6191234567890`, un EAN fictif (« Boga Cidre, SFBT Tunisie (Certifié) »).
- `server.ts:1364-1389` : un code-barres inconnu reçoit 25 g de glucides par défaut. Les valeurs manquantes d'OpenFoodFacts (`server.ts:1316`) ou de l'OCR (`server.ts:711`) sont remplacées par 20 g/100 g.

**Scénario :** une personne photographie une salade pendant une panne de Gemini. L'application affiche 92 g, confiance « medium », et propose environ 9 UI avec un ratio 1/10. Résultat : hypoglycémie sévère.

**Correctif :** ne jamais fabriquer de résultat. Renvoyer une erreur explicite (HTTP 503/422, `{ error, fallback_required: true }`) et proposer une saisie manuelle. Si un repli est conservé, il doit être vide (0 élément), clairement étiqueté « non analysé », et bloquer le calcul du bolus tant que l'utilisateur n'a pas confirmé chaque aliment.

### C2. Une hypoglycémie réelle peut être masquée dans l'écran de bolus
- `src/components/PortionAdjustmentView.tsx:98-108` : la détection d'hypoglycémie utilise la valeur **brute** saisie.
- `src/utils/storage.ts:253-263` : `calculatePersonalizedBolus` **normalise** la valeur (en g/L, toute valeur > 5 est divisée par 100).

**Scénario (reproduit) :** le profil est en g/L et le patient tape `65` (habitude du mg/dL).
- Calcul : 65 → 0,65 g/L, correction = 0, bolus repas complet = **6 UI**.
- Affichage : pas d'alerte hypo, mais un message « _Glycémie supérieure à la cible (+64.00 g/L)_ ». Le protocole de resucrage n'apparaît jamais et le bouton reste vert, « Valider le repas ».

**Correctif :** faire porter la détection d'hypo sur `bolusCalculation.currentGlucose` (la valeur normalisée), ou mieux, faire renvoyer `isHypoglycemia` par `calculatePersonalizedBolus` lui-même. En cas d'hypo, la dose doit être 0 ou nécessiter une confirmation explicite. Ajouter un test unitaire pour ce cas.

### C3. Codes de synchronisation Firestore : lecture, écrasement et suppression par n'importe qui, avec injection de ratios d'insuline
- `firestore.rules:78-85` : `syncCodes/{code}` autorise `get`, `create`, `update` et `delete` pour **tout utilisateur connecté**, y compris un compte anonyme créé librement. Le champ `creatorUid` n'est jamais vérifié et `expiresAt` n'est appliqué nulle part (ni règle, ni TTL).
- `src/services/firebase.ts:370-375` : le code est choisi par l'utilisateur ou généré avec `Math.random()`, qui n'est pas cryptographique (≈ 41 bits, parfois moins).
- `src/utils/cloudSync.ts:490` : un `pull` **remplace le profil thérapeutique local** (`saveUserProfile(record.userProfile)`) sans aucune validation de plage (voir C6).

**Chaîne d'attaque :** un attaquant qui connaît ou devine un code écrase le document avec `icRatios.lunch = 1` (1 UI pour 1 g). Au prochain « Restaurer » de la victime, son ratio est remplacé et 60 g de glucides donnent 60 UI, plafonnées à 20 UI. Résultat : surdosage massif. Le dossier contient aussi des données de santé (repas, glycémies, nom, e-mail du parent, secret Nightscout, voir H2) lisibles par toute personne qui connaît le code.

**Correctif :**
1. Règles : `create` seulement si `request.resource.data.creatorUid == request.auth.uid`. `update`/`delete` seulement si `resource.data.creatorUid == request.auth.uid`. `get` seulement si `request.time < resource.data.expiresAt` (stocké en `timestamp`). Activer une politique TTL Firestore.
2. Générer le code avec `crypto.getRandomValues` (≥ 80 bits) et refuser les codes personnalisés.
3. Lors d'un `pull`, **ne jamais écraser automatiquement le profil d'insuline** : afficher un écran de comparaison et demander une confirmation explicite, avec validation de plage.
4. À terme, remplacer le partage par code par le mécanisme `delegates` déjà présent dans les règles (lien authentifié et révocable).

### C4. API Express `/api/sync/*` : aucune authentification, écrasement libre, énumération non limitée
- `server.ts:133-160` : `POST /api/sync/push` accepte n'importe quel `syncCode` et **écrase** l'enregistrement existant, sans authentification.
- `server.ts:163-175` : `GET /api/sync/pull/:code` renvoie le dossier complet.
- `server.ts:48` : la clé du limiteur de débit est `${req.path}:${ip}`, et le chemin **contient le code**. Chaque tentative de code obtient donc son propre compteur, ce qui rend le limiteur inopérant contre la force brute.
- `server.ts:94-96` : sur Vercel, le stockage est `/tmp/cloud_sync_db.json`. Il est éphémère, propre à chaque instance (les données disparaissent ou divergent), en clair et sans chiffrement.
- `src/utils/cloudSync.ts:416-425` : le client envoie **systématiquement** une copie miroir vers cette API.

**Correctif :** supprimer cette API (Firestore suffit). À défaut, exiger un ID token Firebase (`Authorization: Bearer`, vérifié avec `firebase-admin`), lier chaque enregistrement à l'uid, utiliser un limiteur indexé par IP (et non par chemin) et un stockage durable chiffré.

### C5. Correspondance d'aliments par sous-chaîne bidirectionnelle : glucides faux
- `src/data/tunisianFoodDatabase.ts:2884-2890` (alias) et `2958-2969` (noms) testent `query.includes(x) || x.includes(query)` et renvoient la **première** entrée qui correspond.

**Résultats mesurés pendant l'audit (`findFoodInDatabase`) :**

| Nom renvoyé par l'IA | Aliment retenu | Glucides/100 g | Réel approx. |
|---|---|---|---|
| `Sucre` | Boisson gazeuse **sans sucre** | **0,1** | 100 |
| `Huile d'olive` | Bazine au kadid | **22** | 0 |
| `Lait` | Droo (crème de sorgho) | **16** | ≈ 5 |
| `Fromage` | Tajine au poulet et fromage | 5 | ≈ 0-2 |
| `Sauce tomate` | Kefta en sauce | 6 | ≈ 5-8 |
| `Eau` | Morceau d'agneau | 0 | 0 (correct par hasard) |

**Correctif :** classer les correspondances (exacte > alias exact > début de mot > sous-chaîne), exiger une longueur minimale et des frontières de mots, puis ajouter une **table de tests de non-régression** (≥ 100 noms courants → id attendu). Quand la correspondance est faible, marquer l'élément `confidence: 'low'` et le signaler à l'écran.

### C6. Le profil thérapeutique n'a aucun garde-fou de plage
- `src/utils/storage.ts:125-160` (`sanitizeUserProfile`) accepte tout nombre `> 0` : un ratio de 0,1 g/UI, un ISF de 0,4 en mg/dL, une cible de 1,0 en mg/dL, etc. Les attributs HTML `min`/`max` (`UserProfileModal.tsx`) ne protègent que le formulaire, pas l'import JSON (`storage.ts:345-359`), le pull cloud (C3) ni le portail médecin (H3).
- `src/components/UserProfileModal.tsx:713` : un champ ISF vidé devient `0.4` même en mg/dL, soit une correction × 100.

**Reproduit :** profil en mg/dL, ISF = 0,4, glycémie 180 → 200 UI calculées, ramenées à 20 UI par le plafond.

**Correctif :** des bornes cliniques dépendantes de l'unité dans `sanitizeUserProfile` (ex. ratio 2-50 g/UI ; ISF 0,1-2 g/L ou 10-200 mg/dL ; cible 0,8-1,6 g/L ou 80-160 mg/dL), avec un rejet explicite plutôt qu'une correction silencieuse, et une vérification de cohérence entre l'unité et l'ordre de grandeur de l'ISF et de la cible.

---

## 2. 🟠 Constats élevés

### H1. Une lecture CGM périmée est utilisée comme glycémie actuelle
`src/utils/cgmService.ts:96-137` prend `entries[0]` sans vérifier son âge, et `PortionAdjustmentView.tsx:178-180` l'injecte directement dans le calcul. Si le transmetteur est déconnecté depuis 3 h, la correction est calculée sur une valeur vieille de 3 h.
**Correctif :** refuser une valeur de plus de 10-15 min, afficher l'âge de la mesure et tenir compte de la tendance (`down_fast` → pas de correction).
De plus, la lecture BLE (`cgmService.ts:386-397`) suppose un décalage horaire présent (offset 12) et une unité en kg/L sans lire les `flags`. Elle date aussi la mesure avec `new Date()` (`:423`) au lieu de l'horodatage de l'appareil. Enfin, la caractéristique 0x2A18 est en notification et non en lecture (`readValue` échouera sur la plupart des lecteurs).

### H2. Le secret Nightscout est stocké en clair et diffusé
- `src/App.tsx:160-166` copie `cgmConfig` (avec `apiKey`) dans le profil patient. Le profil part ensuite dans `localStorage`, dans le document `syncCodes` (lisible par toute personne connaissant le code, voir C3) et dans `/tmp` sur le serveur (C4).
- `cgmService.ts:74-76` envoie le secret **en clair** dans `api-secret`, alors que Nightscout attend son empreinte SHA-1. Soit l'authentification échoue, soit l'utilisateur colle l'empreinte, qui donne aussi les droits administrateur.
- `cgmService.ts:135-136` invente des métadonnées (`mardScore: '8.5%'`, `batteryLevel: 98`), ce qui contredit le principe affiché « aucune valeur inventée ».

**Correctif :** utiliser un **jeton Nightscout en lecture seule** (`?token=` / rôle `readable`), l'exclure du profil synchronisé et ne jamais le transmettre au serveur. Supprimer les valeurs inventées.

### H3. Le « portail médecin » n'est pas protégé et peut modifier les ratios
`src/components/DoctorPortalView.tsx:104` compare le code saisi aux codes en dur `DR-GLUCO-2026` / `MEDIC-TUNISIE`. Ces codes sont **affichés dans l'interface** (`:197-224`, bouton « Accès démo immédiat »). Une fois le portail déverrouillé, `onUpdateProfile` (`:128`, `:372`) modifie les ratios d'insuline. Un enfant ou n'importe quel tiers peut donc les changer.
**Correctif :** une vraie identité praticien (compte Firebase avec un rôle), la délégation via `users/{uid}/delegates`, une trace des modifications (qui, quand, ancienne et nouvelle valeur) et la validation du patient ou du parent.

### H4. Statistiques cliniques inventées en l'absence de données
`DoctorPortalView.tsx:87-95` : sans mesure, l'écran affiche **TIR 75 %, TAR 20 %, TBR 5 %** et une glycémie moyenne de 140 mg/dL, soit une HbA1c estimée de 6,7 %. Même avec des données, le « TIR » et la « GMI » sont calculés à partir de quelques glycémies post-prandiales et non de données CGM sur 24 h. C'est méthodologiquement faux et c'est présenté au médecin comme un « AGP ».
`cgmService.ts:215-218` : une glycémie post-prandiale `NaN` est remplacée par 1,2 g/L, donc classée « 🎯 Cible atteinte ».
**Correctif :** afficher « — / données insuffisantes », renommer les indicateurs (« % de contrôles post-prandiaux dans la cible ») et réserver TIR/GMI aux données CGM continues.

### H5. Benchmark « métrologique » simulé à partir de la vérité terrain
- `src/utils/benchmarkEvaluator.ts:110-128` : sans prédiction réelle, la valeur « prédite » vaut `carbs_g × (1 ± 4-9 %)`. Le seuil de 15 % est donc **toujours** respecté.
- `server.ts:329-350` : le « Live Vision Tester » fait de même quand Gemini est indisponible, tout en renvoyant `model: 'gemini-2.5-flash'`.
- `src/types/benchmark.ts:806` : `TUNISIAN_DATASET_100` est **généré** par variations de portions, alors que le README (l. 163) affirme « _Plus de 100 repas tunisiens pesés sur balance de précision de laboratoire_ ».
- Le « Certificat d'audit métrologique ISO 15197 » (`MetrologicalAuditModal.tsx`) renvoie à une norme qui concerne les **lecteurs de glycémie** et non l'estimation des glucides.

**Correctif :** supprimer toute prédiction simulée (ou l'étiqueter « SIMULATION », sans certificat), séparer les données réelles des données synthétiques, et retirer les allégations « certifié » / ISO tant qu'aucune validation indépendante n'existe.

### H6. Auto-titration trop agressive et biaisée
`src/utils/autoTitration.ts` :
- Une recommandation est émise dès **2** contrôles (`:145`). Avec 1 hyper sur 2 (50 %), l'application propose de renforcer l'insuline de 14 % (`:177-181`).
- Tout l'historique est pris en compte, sans fenêtre temporelle, sans vérifier que le bolus a bien été fait ni que les glucides ont été corrigés.
- Les créneaux horaires diffèrent de `getCurrentMealSlot` (`autoTitration.ts:52-55`, déjeuner jusqu'à 16 h, contre `storage.ts:212-215`, jusqu'à 15 h).
- La moyenne post-prandiale (`:130`) divise par toutes les mesures, y compris celles sans valeur.
- Un changement d'unité ne convertit pas l'historique `post_prandial_glucose`. Combiné à C2 (une valeur `65` en g/L est classée « hyper »), une **hypo réelle peut pousser à augmenter l'insuline**.

**Correctif :** au moins 5 à 7 contrôles sur les 14 derniers jours, une seule recommandation par semaine et par créneau, une baisse prioritaire et une hausse plafonnée à 10 %, la normalisation des unités, et une validation par un soignant.

### H7. Le plafond de sécurité de 20 UI est identique pour tous
`storage.ts:218` : `MAX_SAFE_BOLUS_UNITS = 20` s'applique aussi à un **profil enfant** (`childProfile`), pour qui 20 UI peuvent être mortelles. L'insuline active (IOB) n'est pas prise en compte, ce qui permet d'empiler les corrections, et une glycémie sous la cible ne réduit pas le bolus.
**Correctif :** un plafond configurable par le soignant (par défaut, fonction du poids ou de la dose journalière totale), un suivi de l'IOB à partir des bolus enregistrés, et une correction négative ou un blocage sous la cible.

### H8. Les erreurs d'analyse ne sont ni vérifiées ni affichées
`src/App.tsx:191-222` (et les 4 autres modes, `:235`, `:277`, `:324`, `:367`) : `response.ok` n'est jamais testé. Une réponse 429 ou 500 crée un repas avec `total_carbs: undefined`, d'où un bolus `NaN`. Si une exception survient, elle n'est que journalisée dans la console : aucun message pour l'utilisateur et l'écran reste dans l'état `analyzing`.
**Correctif :** tester `response.ok`, valider le schéma de la réponse (zod ou équivalent), afficher l'erreur et revenir à l'accueil.

### H9. Photos envoyées sans redimensionnement (limite de 4,5 Mo sur Vercel)
`PhotoInputModal.tsx:119-127` lit le fichier complet (`readAsDataURL`). Une photo de smartphone de 4 à 8 Mo devient 5,5 à 11 Mo en base64, au-delà de la limite de corps de requête des fonctions Vercel (≈ 4,5 Mo). La réponse 413 n'est pas du JSON, donc l'échec est silencieux (H8). `express.json({ limit: '20mb' })` (`server.ts:69`) est trompeur.
**Correctif :** redimensionner côté client (côté max ≈ 1280 px, JPEG/WebP de qualité 0,8) avant l'envoi, et fixer une limite serveur cohérente (≈ 4 Mo).

---

## 3. 🟡 Constats moyens

| # | Constat | Emplacement | Correctif |
|---|---|---|---|
| M1 | **Dépendances vulnérables** : `proxy-addr` (critique, usurpation d'IP), `qs`, `body-parser`, `@grpc/grpc-js`, `source-map-js`, **`xlsx` 0.18.5** (pollution de prototype, ReDoS, sans correctif sur npm) | `package.json` | `npm audit fix` ; remplacer `xlsx` par la version officielle du CDN SheetJS (≥ 0.20.2) ou par `exceljs` |
| M2 | Parseur local fragile : « pomme de terre » donne « Pomme » (fruit, 17 g) ; « 500 g de pâtes et un coca » donne un soda de **500 ml** (`includes('500')`) ; un pain sans quantité vaut 2 × 35 g ; « lablabi avec pain » ajoute du pain en plus du lablabi complet (risque de double comptage) ; `includes('ص')` (une seule lettre) est du code fragile | `server.ts:821-1162` | Tokenisation par mots, tests table-driven |
| M3 | Injection de prompt : le texte utilisateur est interpolé tel quel (`"${inputText}"`) ; aucune borne sur `estimated_weight_g` renvoyé par le modèle (seulement `max(10, …)`) | `server.ts:519`, `:459`, `:605` | Passer l'entrée dans un `part` séparé, limiter sa longueur, borner les poids (ex. 5-1500 g) et signaler les valeurs aberrantes |
| M4 | Messages internes divulgués (`details: err.message`) | `server.ts:218`, `:747` | Message générique et identifiant de corrélation |
| M5 | CORS `*` sur toutes les routes, y compris `/api/sync/*` et `/api/analyze-meal` (le quota Gemini peut être consommé depuis n'importe quel site) | `server.ts:34-36` | Restreindre à l'origine de production ; ajouter App Check |
| M6 | En-têtes de sécurité incomplets : pas de CSP, pas de HSTS, pas de `Permissions-Policy` ; `X-XSS-Protection` est obsolète ; ces en-têtes ne s'appliquent qu'à l'API (le front statique Vercel n'en reçoit aucun) | `server.ts:29-41`, `vercel.json` | Ajouter `headers` dans `vercel.json` |
| M7 | Limiteur en mémoire : `Map` jamais purgée (fuite mémoire), état non partagé entre instances serverless, `trust proxy` non configuré | `server.ts:44-67` | Store partagé (Upstash/Redis ou Vercel KV), purge, `app.set('trust proxy', …)` |
| M8 | Aucune règle Firebase **Storage** versionnée, alors que des photos de repas y sont envoyées (`users/{uid}/meals/...`) ; `getDownloadURL` crée des URL publiques permanentes | `firebase.json`, `src/services/firebase.ts:327-346` | Ajouter `storage.rules` (propriétaire seulement, type et taille limités) |
| M9 | App Check désactivé (`recaptchaSiteKey: ""`) : création illimitée de comptes anonymes et écriture dans `syncCodes` | `firebase-applet-config.json` | Activer App Check (reCAPTCHA Enterprise) et l'imposer sur Firestore et Storage |
| M10 | Données de santé (catégorie particulière RGPD art. 9 ; loi tunisienne 2004-63) envoyées à Gemini, Vercel Analytics et Firestore **sans écran de consentement ni politique de confidentialité** ; aucune fonction de suppression du compte côté cloud (`clearAllMeals` ne supprime que les données locales, `storage.ts:117-120`) | global | Consentement explicite, politique de confidentialité, suppression complète, minimisation des données |
| M11 | Modèles Gemini figés (`gemini-2.5-flash`, repli `gemini-2.0-flash`) : vérifier leur cycle de vie (le 2.0 est en fin de vie) ; aucun délai d'expiration sur les appels Gemini | `server.ts:270`, `:570` | Modèle configurable par variable d'environnement, `AbortSignal` avec délai |

---

## 4. 🔵 Faible / qualité

1. **Bundle unique de 2,77 Mo** (`recharts`, `xlsx`, `@zxing`, `firebase`, `motion`) : lent sur mobile en 3G/4G. Utiliser `React.lazy` pour Benchmark, DoctorPortal, MedicalReport et Barcode, et `manualChunks`.
2. **`api/index.js` est un artefact de build versionné et désynchronisé** : il manque la garde « texte vide » et la gestion `voiceLang` présentes dans `server.ts`. Vercel le régénère, mais le dépôt induit en erreur. L'ajouter au `.gitignore`.
3. `index.html` : `lang="en"` alors que le contenu est en français et en arabe (accessibilité, SEO). Mettre `lang="fr"` et le changer dynamiquement en `ar`/`dir="rtl"`.
4. `package.json` : `"name": "react-example"`, version `0.0.0` ; `vite` et `@vitejs/plugin-react` sont dans `dependencies` (et `vite` en double).
5. README : badge « 23/23 » (28 tests en réalité) ; allégations « certifié INNT/CIQUAL », « moteur déterministe certifié », « ISO 15197 » non étayées (voir H5).
6. Couverture de tests limitée à 3 fichiers (`autoTitration`, `bolusSafety`, `cgmService`). Rien ne teste `findFoodInDatabase`, `parseTextLocally`, les endpoints Express, la normalisation des unités dans l'interface (C2), ni les règles Firestore (`@firebase/rules-unit-testing`).
7. `getLearnedPortionForFood` (`activeLearning.ts`) utilise aussi une correspondance par sous-chaîne bidirectionnelle : une portion apprise pour « Pain » s'applique à « Pain tabouna », « Pain au chocolat », etc.
8. `subscribeToMeals` / `fetchUserDataFromFirestore` trient par `created_at`, alors que les règles acceptent aussi `timestamp` seul : ces repas seraient invisibles.
9. Service worker : nom de cache fixe (`glucomeal-cache-v1`) et revalidation en arrière-plan qui met en cache toute réponse 200 sans vérifier le type. Versionner le cache à chaque build.
10. Le code mort et les commentaires « AI Studio » (`vite.config.ts`, `.env.example`, `metadata.json`) entretiennent une confusion entre l'environnement AI Studio et la production Vercel.

---

## 5. Points positifs

- Le calcul glucides = poids × glucides/100 g est déterministe et séparé de l'IA : la bonne architecture.
- Les règles Firestore partent d'un refus par défaut (`match /{document=**} { allow read, write: if false; }`) et valident les identifiants et certains champs.
- Un plafond de bolus, la détection d'une erreur d'unité et un protocole de resucrage existent déjà ; il faut seulement les rendre cohérents (C2, H7).
- Les lectures CGM refusent toute simulation dans le chemin principal.
- L'interface est bilingue français/arabe, avec la prise en charge du RTL et de la Derja.
- Le typage TypeScript ne présente aucune erreur.

---

## 6. Plan d'action priorisé

**P0 : avant toute utilisation réelle (sécurité des patients)**
1. C1 : supprimer tous les replis qui inventent des glucides ; une erreur explicite bloque le bolus.
2. C2 : détecter l'hypo sur la valeur normalisée et l'imposer dans `calculatePersonalizedBolus`, avec un test.
3. C3 + C4 : verrouiller `syncCodes` par `creatorUid` et expiration, générer les codes avec `crypto`, désactiver ou authentifier `/api/sync/*`, ne plus écraser le profil d'insuline lors d'un pull.
4. C6 : bornes cliniques dans `sanitizeUserProfile`.
5. C5 : refondre `findFoodInDatabase` et ajouter les tests de non-régression.
6. H3 : retirer le déverrouillage du portail médecin par code public, ou au minimum empêcher toute modification de ratio depuis ce portail.

**P1 : sous 2 à 4 semaines**
- H1 (fraîcheur CGM), H2 (jeton Nightscout en lecture seule, hors synchronisation), H4 (supprimer les statistiques inventées), H7 (plafond adapté et IOB), H8 + H9 (gestion des erreurs, redimensionnement des photos), M1 (`npm audit fix` et remplacement de `xlsx`), M8 + M9 (Storage rules, App Check).

**P2 : qualité et conformité**
- H5 (benchmark honnête, retrait des allégations), H6 (titration prudente), M2 à M7, M10 (RGPD/consentement), section 4.

**Réglementaire :** un logiciel qui calcule une dose d'insuline relève des dispositifs médicaux (UE : MDR, règle 11, probablement classe IIb ; États-Unis : FDA, *insulin bolus calculator*). Avant toute diffusion publique : avertissement clair (« outil d'aide, ne remplace pas l'avis médical »), analyse de risques (ISO 14971), cycle de vie logiciel (IEC 62304) et aucune allégation « certifié » sans certification.
