export interface SpecSection {
  id: string;
  letter: string;
  title: string;
  summary: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export const TECHNICAL_SPECIFICATIONS: SpecSection[] = [
  {
    id: 'spec-a',
    letter: 'A',
    title: 'Architecture Kotlin / Jetpack Compose',
    summary: 'Architecture Android moderne MVVM + Clean Architecture pour le MVP V1.',
    content: `L'application mobile native Android pour GlucoMeal AI est structurée selon les recommandations officielles de Google : Clean Architecture à 3 couches (UI, Domain, Data) avec Jetpack Compose et Coroutines / StateFlow.

1. Couche UI (Jetpack Compose) :
- Single-Activity architecture (MainActivity) avec Navigation Compose.
- Composables modulaires sans logique métier : HomeScreen, CaptureScreen, MealReviewScreen (PortionAdjustment), MealHistoryScreen.
- Intégration de CameraX (PreviewView, ImageCapture) avec bindToLifecycle pour capture instantanée à 45° ou 90°.
- SpeechRecognizer d'Android ou Gemini Live audio pour reconnaissance en direct du dialecte tunisien (Derja).

2. Couche Domain :
- Use Cases déterministes :
  * AnalyzeMealImageUseCase(imageBytes: ByteArray): Flow<Resource<AnalyzedMealDraft>>
  * RecalculateCarbsUseCase(items: List<MealComponent>): MealCarbSummary
  * MatchUserHabitUseCase(mealDraft: AnalyzedMealDraft): HabitAlert?
  * ConfirmMealUseCase(confirmedMeal: ConfirmedMeal): Result<Unit>

3. Couche Data :
- Repositories : MealRepository, FoodDatabaseRepository, OfflineSyncRepository.
- Supabase Kotlin SDK (PostgREST, Auth, Storage) avec Room DB pour mise en cache hors-ligne immédiate.`,
    codeSnippet: {
      language: 'kotlin',
      code: `// ViewModel Compose avec StateFlow réactif
@HiltViewModel
class MealReviewViewModel @Inject constructor(
    private val recalculateCarbsUseCase: RecalculateCarbsUseCase,
    private val confirmMealUseCase: ConfirmMealUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<MealReviewUiState>(MealReviewUiState.Loading)
    val uiState: StateFlow<MealReviewUiState> = _uiState.asStateFlow()

    fun updateItemWeight(itemId: String, newWeightGrams: Int) {
        val current = _uiState.value as? MealReviewUiState.Success ?: return
        val updatedItems = current.meal.items.map { item ->
            if (item.id == itemId) {
                val deterministicCarbs = Math.round(newWeightGrams * (item.carbsPer100g / 100.0)).toInt()
                item.copy(confirmedWeightG = newWeightGrams, calculatedCarbs = deterministicCarbs, isCorrected = true)
            } else item
        }
        val totalCarbs = updatedItems.sumOf { it.calculatedCarbs }
        _uiState.value = current.copy(
            meal = current.meal.copy(items = updatedItems, totalCarbs = totalCarbs)
        )
    }
}`
    }
  },
  {
    id: 'spec-b',
    letter: 'B',
    title: 'Architecture Supabase',
    summary: 'Backend Serverless : PostgreSQL, Auth, Edge Functions et Storage avec politique de confidentialité des photos.',
    content: `Supabase est la colonne vertébrale du MVP V1 :

1. Supabase Auth :
- Authentification par OTP SMS (numéro de téléphone tunisien +216 ou email/mot de passe).
- Sessions sécurisées avec tokens JWT stockés dans l'Android EncryptedSharedPreferences.

2. PostgreSQL 15 + PostgREST :
- Accès direct sécurisé via Row-Level Security (RLS).
- Tables relationnelles pour aliments tunisiens, repas, portions corrigées et historique personnel.

3. Supabase Edge Functions (Deno / TypeScript) :
- /functions/v1/analyze-meal : Proxy sécurisé qui appelle Gemini Vision 3.8 Flash, applique la logique de mapping sur la table foods, et retourne la structure d'estimation.
- Clé Gemini API stockée dans les secrets de l'Edge Function, jamais exposée au client Android.

4. Supabase Storage (Bucket 'meal-photos') :
- Bucket privé avec signed URLs expirant en 15 minutes.
- Règle de confidentialité stricte : toggle utilisateur "Ne pas conserver mes photos" (suppression automatique de l'image après extraction des données nutritionnelles).`,
  },
  {
    id: 'spec-c',
    letter: 'C',
    title: 'Schéma SQL des Tables PostgreSQL',
    summary: 'Structure de la base de données relationnelle avec RLS et relations complètes.',
    content: `Le schéma respecte fidèlement les besoins exprimés dans le cahier des charges et prépare l'extension future vers V2 (Insuline) et V3 (CGM).`,
    codeSnippet: {
      language: 'sql',
      code: `-- 1. Table des aliments de référence
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fr TEXT NOT NULL,
    name_ar TEXT,
    name_tn TEXT,
    category TEXT NOT NULL CHECK (category IN ('feculents', 'legumineuses', 'plats', 'patisseries', 'fruits_legumes', 'produits_industriels', 'boissons')),
    carbs_per_100g NUMERIC(5,2) NOT NULL,
    protein_per_100g NUMERIC(5,2) DEFAULT 0,
    fat_per_100g NUMERIC(5,2) DEFAULT 0,
    fiber_per_100g NUMERIC(5,2) DEFAULT 0,
    default_portion_g INTEGER NOT NULL DEFAULT 100,
    source TEXT NOT NULL DEFAULT 'INNT Tunis',
    confidence TEXT NOT NULL DEFAULT 'high',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des repas validés
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT,
    input_type TEXT NOT NULL CHECK (input_type IN ('photo', 'text', 'voice', 'barcode')),
    total_carbs INTEGER NOT NULL, -- "≈ 87 g" (entier)
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    confidence_score NUMERIC(4,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des composants de chaque repas (avec traçabilité correction IA vs Patient)
CREATE TABLE public.meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    estimated_weight_g INTEGER NOT NULL, -- Poids proposé par l'IA
    confirmed_weight_g INTEGER NOT NULL, -- Poids validé/corrigé par le patient
    carbs_per_100g NUMERIC(5,2) NOT NULL,
    calculated_carbs INTEGER NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des références personnelles et habitudes
CREATE TABLE public.user_habit_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_slug TEXT NOT NULL,
    dish_name TEXT NOT NULL,
    meal_occurrences_count INTEGER DEFAULT 1,
    usual_portion_g INTEGER NOT NULL,
    usual_carbs_min INTEGER NOT NULL,
    usual_carbs_max INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité Row-Level Security (RLS)
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own meals"
ON public.meals FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own meal items"
ON public.meal_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));`
    }
  },
  {
    id: 'spec-d',
    letter: 'D',
    title: 'Pipeline IA Hybride : Photo / Voix / Texte → Glucides',
    summary: 'Séparation stricte : le LLM identifie les aliments et volumes visuels, le moteur déterministe calcule les glucides.',
    content: `Règle d'or absolue pour la sécurité du patient diabétique :
Le modèle d'IA ne doit JAMAIS inventer ou calculer arbitrairement les glucides.

Pipeline en 6 phases :
Phase 1 : Capture & Prétraitement
- Photo normalisée (1024x1024 max), orientation EXIF corrigée.
- Texte ou transcription audio nettoyée (support du dialecte tunisien 'Derja').

Phase 2 : Extraction sémantique (Gemini 3.8 Flash Multimodal)
- Le modèle détecte :
  1. Liste des composants visuels distincts (ex: couscous, pois chiches, poulet, carottes).
  2. Estimation de volume / surface en assiette (diamètre référence ≈ 24 cm, verre ≈ 200 ml).
  3. Poids estimé en grammes pour chaque composant.
  4. Score de confiance visuelle (détection nette vs élément masqué sous la sauce).

Phase 3 : Mapping déterministe avec la Base Alimentaire Tunisienne
- Recherche floue (fuzzy match) et embeddings contre le dictionnaire des 200 aliments tunisiens certifiés.
- Attribution de la valeur certifiée 'carbs_per_100g' et 'confidence_base'.

Phase 4 : Formule mathématique déterministe
  carbs_item = round(confirmed_weight_g * (carbs_per_100g / 100))
  total_carbs = sum(carbs_item)

Phase 5 : Calcul du Score de Confiance Global
  Score global pondéré par la part des glucides de chaque composant :
  - 🟢 Élevée (>= 85%) : Tous les composants riches en glucides sont nets.
  - 🟡 Moyenne (60-84%) : Plat composé avec sauce masquant la semoule ou le pain.
  - 🔴 Faible (< 60%) : Photo floue, plat atypique ou portion incertaine.

Phase 6 : Affichage arrondi bienveillant
  L'application affiche TOUJOURS : 'Glucides estimés ≈ 87 g' et JAMAIS '87.35 g'.`,
  },
  {
    id: 'spec-e',
    letter: 'E',
    title: 'Base Alimentaire Tunisienne & Dataset 100 Repas',
    summary: '200 aliments tunisiens certifiés divisés en 5 groupes + benchmark standardisé.',
    content: `Pour répondre aux spécificités de l'alimentation tunisienne :
- Groupe 1 — Féculents : Baguette, Pain tabouna, Mlawi, Kesra, Pâtes, Couscous, Semoule, Riz, Pommes de terre.
- Groupe 2 — Légumineuses : Pois chiches (indispensables dans le lablabi et couscous), Lentilles, Loubia, Fèves.
- Groupe 3 — Plats cuisinés : Couscous, Lablabi, Ojja, Chakchouka, Mloukhiya, Makrouna bel salsa, Nwasser, Kafteji, Kamounia, Riz djerbien, Brik à l'œuf, Tajine tunisien, Chorba frik.
- Groupe 4 — Pâtisseries & douceurs : Makroudh de Kairouan, Baklawa, Samsa, Bambalouni de Sidi Bou Saïd, Youyou, Assida Zgougou, Bsissa, Zlabia.
- Groupe 5 — Fruits, légumes & industriels : Dattes Deglet Nour de Tozeur, Grenade de Testour, Oranges maltaises, Boga Cidre, Biscuits Saïda.

Le dataset officiel de 100 repas sert de benchmark étalon pour valider les modèles de vision avant déploiement.`,
  },
  {
    id: 'spec-f',
    letter: 'F',
    title: 'Écrans Détaillés et Parcours UX',
    summary: 'Design centré sur l’autonomie du patient, sans friction, avec boutons d’ajustement rapide.',
    content: `1. Écran d'accueil épuré :
- En-tête : Logo GlucoMeal AI, rappel bienveillant.
- Question centrale : "Qu'avez-vous mangé ?"
- 4 gros boutons tactiles accessibles (>48px) :
  * 📷 Photographier mon repas
  * 🎤 Décrire mon repas
  * ⌨️ Écrire mon repas
  * 📦 Scanner un produit
- Section "Derniers repas" : carte compacte avec glucides et rappel d'habitudes.

2. Écran d'Analyse (chargement transparent) :
- "Analyse de votre repas en cours..."
- Affichage progressif des aliments détectés sous forme de chips dynamiques.

3. Écran de Vérification & Ajustement des portions (clé du MVP) :
- Carte par aliment détecté :
  * Nom français + traduction arabe/dialectale.
  * Portion estimée : "≈ 250 g".
  * Contrôles rapides : [ −10 g ] [ − ] [ + ] [ +10 g ] ou toucher pour taper directement.
  * Glucides déduits en temps réel.
  * Indicateur de confiance (vert, jaune, rouge).
- Bouton pour ajouter un aliment manquant (ex: "J'ai aussi pris du pain").

4. Écran de Résultat & Validation :
- Grand bloc central : "GLUCIDES DU REPAS : ≈ 87 g"
- Badge de confiance clair.
- Mention d'habitude si applicable : "Ce repas ressemble à votre couscous habituel (285 g)".
- 2 boutons d'action : [ ✏️ Modifier ] et [ ✓ Valider le repas ].`,
  },
  {
    id: 'spec-g',
    letter: 'G',
    title: 'Spécifications des API',
    summary: 'Endpoints REST pour l’analyse, la recherche d’aliments et la validation.',
    content: `Endpoints fournis par le backend :

1. POST /api/analyze-meal
- Payload :
  {
    "mode": "photo" | "text" | "voice" | "barcode",
    "image": "data:image/jpeg;base64,...",
    "text": "2 tranches de pain tabouna et ojja",
    "audioTranscript": "كلّيت صحن مقرونة و زوز خبزات"
  }
- Réponse :
  {
    "meal_name": "Ojja merguez et pain tabouna",
    "items": [
      {
        "name_fr": "Ojja merguez",
        "estimated_weight_g": 220,
        "carbs_per_100g": 4,
        "calculated_carbs": 9,
        "confidence": "high"
      },
      {
        "name_fr": "Pain Tabouna",
        "estimated_weight_g": 75,
        "carbs_per_100g": 48,
        "calculated_carbs": 36,
        "confidence": "high"
      }
    ],
    "total_carbs": 45,
    "confidence": "high",
    "confidence_score": 92
  }

2. GET /api/foods?query=couscous&category=plats
- Recherche dans la base certifiée tunisienne avec pagination et trigrammes.

3. POST /api/meals/confirm
- Enregistrement du repas avec trace d'apprentissage :
  {
    "meal_id": "uuid",
    "items": [...],
    "corrections": [
      { "food_name": "Pain", "ai_g": 60, "user_g": 40 }
    ]
  }`,
  },
  {
    id: 'spec-h',
    letter: 'H',
    title: 'Système de Confiance et Boucle d’Apprentissage',
    summary: 'Gestion transparente du doute médical et amélioration continue par les corrections patients.',
    content: `1. Triplet de confiance :
- food_confidence : L'aliment est-il formellement identifié ?
- portion_confidence : Le volume et l'assiette permettent-ils une estimation fiable ?
- nutrition_confidence : La recette a-t-elle une composition glucidique stable ?

2. Règle de prudence médicale :
Si le score global est 🔴 Faible (< 60%) :
L'application indique immédiatement :
"Nous ne pouvons pas estimer précisément ce plat (plat complexe ou sauce opaque). Veuillez indiquer vous-même la quantité avant de valider."

3. Boucle d'apprentissage continu (Active Learning) :
Chaque fois qu'un utilisateur ajuste un composant (ex: pain estimé à 60 g corrigé à 40 g), une paire anonymisée est enregistrée :
{ "dish": "tabouna", "ai_estimate": 60, "ground_truth": 40, "delta": -20 }
Ces données permettent de calibrer les portions moyennes locales sans jamais compromettre la sécurité.`,
  },
  {
    id: 'spec-i',
    letter: 'I',
    title: 'Sécurité, Confidentialité & Données de Santé',
    summary: 'Conformité RGPD et protection des données sensibles de diabète.',
    content: `1. Données de santé (catégorie spéciale RGPD) :
- Consentement explicite lors du premier onboarding.
- Chiffrement au repos (AES-256) et en transit (TLS 1.3).
- Pas de revente de données ni d'utilisation publicitaire.

2. Confidentialité des photos :
- Politique par défaut : les photos de repas sont traitées en mémoire éphémère puis supprimées du serveur après extraction des ingrédients.
- Seuls les métadonnées nutritionnelles (aliments, grammes, glucides, date) sont conservées.
- Option explicite : "Conserver mes photos dans mon journal visuel" activable à la demande.

3. Absence de responsabilité médicale automatisée :
- Clause de non-responsabilité clinique claire : "GlucoMeal AI est un outil d'aide au calcul des glucides et ne constitue pas une prescription médicale."
- Pas d'estimation d'insuline dans la V1.`,
  },
  {
    id: 'spec-j',
    letter: 'J',
    title: 'Plan de Développement par Sprints (Roadmap MVP)',
    summary: 'Déploiement en 4 sprints de 2 semaines pour atteindre un produit fonctionnel et validé.',
    content: `Sprint 1 : Base de Données & Benchmark Tunisien (Semaines 1-2)
- Modélisation PostgreSQL Supabase et migration des 200 aliments tunisiens.
- Constitution et pesée de référence du dataset des 100 repas tunisiens.
- Implémentation du moteur de calcul déterministe et tests unitaires.

Sprint 2 : Pipeline IA Vision & Speech (Semaines 3-4)
- Intégration Gemini 3.8 Flash Vision avec prompts structurés pour la cuisine maghrébine.
- Support de la saisie texte et voix (transcription français & Derja).
- Évaluation du taux d'erreur sur le benchmark des 100 repas (Target : Erreur < 15% sur les féculents).

Sprint 3 : UI Jetpack Compose & Écran d'Ajustement (Semaines 5-6)
- Développement des écrans : Home, Caméra, Review des portions avec boutons [-10g / +10g].
- Intégration de la boucle d'apprentissage et de la détection des habitudes personnelles.
- Sauvegarde hors-ligne Room + synchronisation Supabase.

Sprint 4 : Tests Cliniques Patients & Validation (Semaines 7-8)
- Test bêta fermé avec 20 patients diabétiques de type 1 en Tunisie.
- Mesure du KPI principal : passage du temps de comptage manuel de 5-10 min à moins de 45 secondes.
- Audit de sécurité et packaging APK final.`,
  }
];
