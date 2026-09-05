import { AnalyzedMeal, UserProfileDT1, MealSlot, PhysicalActivityLevel, CalculatedBolusSummary } from '../types';
import { syncMealToFirestore, syncProfileToFirestore, deleteMealFromFirestore } from '../services/firebase';

const STORAGE_KEYS = {
  MEALS: 'glucomal_meals_history_v1',
  PROFILE: 'glucomal_user_profile_v1',
  OFFLINE_QUEUE: 'glucomal_offline_queue_v1',
};

// Profil diabétique par défaut basé sur les standards diabétologiques (Insulinothérapie fonctionnelle)
export const DEFAULT_USER_PROFILE: UserProfileDT1 = {
  name: 'Patient DT1',
  glucoseUnit: 'g/L',
  targetGlucose: 1.0, // 1.00 g/L (ou 100 mg/dL)
  isf: 0.4, // 1 UI fait baisser la glycémie de 0.40 g/L (Sensibilité à l'insuline)
  icRatios: {
    morning: 8, // Matin (petit déjeuner) : 1 UI pour 8 g de glucides (résistance hépatique matinale)
    lunch: 10, // Midi (déjeuner) : 1 UI pour 10 g de glucides
    dinner: 12, // Soir (dîner) : 1 UI pour 12 g de glucides
    snack: 10, // Collation : 1 UI pour 10 g de glucides
    iftar: 8, // Iftar Ramadan : 1 UI pour 8 g (charge glucidique élevée)
    sahriya: 9, // Sahriya soirée : 1 UI pour 9 g
    shor: 12, // Shor aube : 1 UI pour 12 g (protection hypo diurne)
  },
  roundingStep: 0.5, // Arrondi standard des stylos d'insuline (demi-unités)
  ramadanMode: false,
};

// Repas par défaut initiaux avec données cliniques complètes (post-prandial, double bolus, index glycémique)
export const INITIAL_DEMO_MEALS: AnalyzedMeal[] = [
  {
    id: 'meal-hist-1',
    user_id: 'user-t1d-1',
    meal_name: 'Couscous agneau et légumes',
    meal_name_ar: 'كسكسي بلحم الخروف والخضار',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    input_type: 'photo',
    total_carbs: 74,
    overall_confidence: 'high',
    confidence_score: 91,
    is_validated: true,
    is_favorite: true,
    average_glycemic_index: 58,
    total_glycemic_load: 43,
    post_prandial_glucose: 1.25,
    post_prandial_timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    post_prandial_evaluation: 'target',
    dual_wave: {
      is_recommended: true,
      immediate_pct: 60,
      immediate_units: 4.8,
      extended_pct: 40,
      extended_units: 3.2,
      duration_hours: 2.5,
      reason: "Présence d'agneau gras et sauce mijotée retardant l'absorption des glucides de la semoule.",
    },
    bolus_calculated: {
      slot: 'lunch',
      icRatio: 10,
      mealBolus: 7.4,
      currentGlucose: 1.2,
      targetGlucose: 1.0,
      isf: 0.4,
      correctionBolus: 0.5,
      totalBolus: 8.0,
    },
    items: [
      {
        id: 'item-1',
        name_fr: 'Couscous (semoule cuite vapeur)',
        name_ar: 'كسكسي مطبوخ',
        category: 'feculents',
        estimated_weight_g: 220,
        confirmed_weight_g: 220,
        carbs_per_100g: 28,
        calculated_carbs: 62,
        confidence: 'high',
        original_ai_weight_g: 220,
        is_corrected: false,
        glycemic_index: 65,
      },
      {
        id: 'item-2',
        name_fr: 'Pois chiches cuits',
        name_ar: 'حمص مسلوق',
        category: 'legumineuses',
        estimated_weight_g: 40,
        confirmed_weight_g: 40,
        carbs_per_100g: 20,
        calculated_carbs: 8,
        confidence: 'high',
        original_ai_weight_g: 40,
        is_corrected: false,
        glycemic_index: 28,
      },
      {
        id: 'item-3',
        name_fr: 'Légumes mijotés',
        name_ar: 'خضار مطبوخة',
        category: 'fruits_legumes',
        estimated_weight_g: 80,
        confirmed_weight_g: 80,
        carbs_per_100g: 5,
        calculated_carbs: 4,
        confidence: 'medium',
        original_ai_weight_g: 80,
        is_corrected: false,
        glycemic_index: 35,
      },
    ],
  },
  {
    id: 'meal-hist-2',
    user_id: 'user-t1d-1',
    meal_name: 'Lablabi complet au thon et œuf',
    meal_name_ar: 'لبلابي تونسي كامل',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    input_type: 'voice',
    total_carbs: 62,
    overall_confidence: 'high',
    confidence_score: 94,
    is_validated: true,
    is_favorite: true,
    average_glycemic_index: 48,
    total_glycemic_load: 30,
    post_prandial_glucose: 1.18,
    post_prandial_timestamp: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    post_prandial_evaluation: 'target',
    bolus_calculated: {
      slot: 'lunch',
      icRatio: 10,
      mealBolus: 6.2,
      correctionBolus: 0,
      totalBolus: 6.0,
    },
    items: [
      {
        id: 'item-1',
        name_fr: 'Pois chiches en bouillon',
        name_ar: 'حمص مسلوق',
        category: 'legumineuses',
        estimated_weight_g: 180,
        confirmed_weight_g: 180,
        carbs_per_100g: 19,
        calculated_carbs: 34,
        confidence: 'high',
        original_ai_weight_g: 180,
        is_corrected: false,
        glycemic_index: 30,
      },
      {
        id: 'item-2',
        name_fr: 'Pain rassis trempé',
        name_ar: 'خبز منقوع',
        category: 'feculents',
        estimated_weight_g: 60,
        confirmed_weight_g: 60,
        carbs_per_100g: 48,
        calculated_carbs: 28,
        confidence: 'medium',
        original_ai_weight_g: 60,
        is_corrected: false,
        glycemic_index: 70,
      },
    ],
  },
  {
    id: 'meal-hist-3',
    user_id: 'user-t1d-1',
    meal_name: 'Ojja merguez avec pain Tabouna',
    meal_name_ar: 'عجة بالمرقاز مع خبز طابونة',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    input_type: 'text',
    total_carbs: 45,
    overall_confidence: 'high',
    confidence_score: 89,
    is_validated: true,
    is_favorite: false,
    average_glycemic_index: 54,
    total_glycemic_load: 24,
    post_prandial_glucose: 1.55,
    post_prandial_timestamp: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    post_prandial_evaluation: 'hyper',
    dual_wave: {
      is_recommended: true,
      immediate_pct: 60,
      immediate_units: 2.5,
      extended_pct: 40,
      extended_units: 1.5,
      duration_hours: 2.5,
      reason: 'Lipides abondants du merguez et de la friture retardant le pic glycémique.',
    },
    bolus_calculated: {
      slot: 'dinner',
      icRatio: 12,
      mealBolus: 3.75,
      correctionBolus: 0,
      totalBolus: 4.0,
    },
    items: [
      {
        id: 'item-1',
        name_fr: 'Pain Tabouna traditionnel',
        name_ar: 'خبز طابونة',
        category: 'feculents',
        estimated_weight_g: 75,
        confirmed_weight_g: 75,
        carbs_per_100g: 48,
        calculated_carbs: 36,
        confidence: 'high',
        original_ai_weight_g: 75,
        is_corrected: false,
        glycemic_index: 68,
      },
      {
        id: 'item-2',
        name_fr: 'Ojja merguez sauce tomate',
        name_ar: 'عجة بالمرقاز',
        category: 'plats',
        estimated_weight_g: 220,
        confirmed_weight_g: 220,
        carbs_per_100g: 4,
        calculated_carbs: 9,
        confidence: 'high',
        original_ai_weight_g: 220,
        is_corrected: false,
        glycemic_index: 38,
      },
    ],
  },
  {
    id: 'meal-hist-4',
    user_id: 'user-t1d-1',
    meal_name: 'Petit-déjeuner : Pain Tabouna, huile d\'olive et café',
    meal_name_ar: 'فطور صباح : خبز طابونة وزيت زيتونة',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    input_type: 'photo',
    total_carbs: 32,
    overall_confidence: 'high',
    confidence_score: 95,
    is_validated: true,
    is_favorite: true,
    average_glycemic_index: 52,
    total_glycemic_load: 17,
    post_prandial_glucose: 1.10,
    post_prandial_timestamp: new Date(Date.now() - 86400000 * 3 + 7200000).toISOString(),
    post_prandial_evaluation: 'target',
    bolus_calculated: {
      slot: 'morning',
      icRatio: 8,
      mealBolus: 4.0,
      correctionBolus: 0,
      totalBolus: 4.0,
    },
    items: [
      {
        id: 'item-1',
        name_fr: 'Pain Tabouna traditionnel',
        name_ar: 'خبز طابونة',
        category: 'feculents',
        estimated_weight_g: 65,
        confirmed_weight_g: 65,
        carbs_per_100g: 48,
        calculated_carbs: 31,
        confidence: 'high',
        original_ai_weight_g: 65,
        is_corrected: true,
        glycemic_index: 60,
      },
      {
        id: 'item-2',
        name_fr: 'Huile d\'olive vierge',
        name_ar: 'زيت زيتون',
        category: 'produits_industriels',
        estimated_weight_g: 15,
        confirmed_weight_g: 15,
        carbs_per_100g: 0,
        calculated_carbs: 0,
        confidence: 'high',
        original_ai_weight_g: 15,
        is_corrected: false,
        glycemic_index: 0,
      },
    ],
  },
  {
    id: 'meal-hist-5',
    user_id: 'user-t1d-1',
    meal_name: 'Collation : Makroudh au miel et thé à la menthe',
    meal_name_ar: 'لمجة : مقروض وعصير أو تاي',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    input_type: 'text',
    total_carbs: 42,
    overall_confidence: 'high',
    confidence_score: 90,
    is_validated: true,
    is_favorite: false,
    average_glycemic_index: 75,
    total_glycemic_load: 31,
    post_prandial_glucose: 1.62,
    post_prandial_timestamp: new Date(Date.now() - 86400000 * 4 + 7200000).toISOString(),
    post_prandial_evaluation: 'hyper',
    bolus_calculated: {
      slot: 'snack',
      icRatio: 10,
      mealBolus: 4.2,
      correctionBolus: 0,
      totalBolus: 4.0,
    },
    items: [
      {
        id: 'item-1',
        name_fr: 'Makroudh artisanal au miel',
        name_ar: 'مقروض بالعسل',
        category: 'patisseries',
        estimated_weight_g: 65,
        confirmed_weight_g: 65,
        carbs_per_100g: 65,
        calculated_carbs: 42,
        confidence: 'high',
        original_ai_weight_g: 65,
        is_corrected: false,
        glycemic_index: 75,
      },
    ],
  },
];

/**
 * Charge l'historique des repas sauvegardés
 */
export function loadSavedMeals(): AnalyzedMeal[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_MEALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) {
      saveMeals(INITIAL_DEMO_MEALS);
      return INITIAL_DEMO_MEALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_MEALS;
  } catch (err) {
    console.error('Erreur lecture repas sauvegardés:', err);
    return INITIAL_DEMO_MEALS;
  }
}

/**
 * Sauvegarde la liste complète des repas
 */
export function saveMeals(meals: AnalyzedMeal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  } catch (err) {
    console.error('Erreur sauvegarde repas:', err);
  }
}

/**
 * Ajoute un repas validé en tête d'historique
 */
export function saveSingleMeal(meal: AnalyzedMeal): AnalyzedMeal[] {
  const current = loadSavedMeals();
  const updated = [meal, ...current.filter((m) => m.id !== meal.id)];
  saveMeals(updated);
  // Synchronisation asynchrone non-bloquante avec Firebase Firestore
  syncMealToFirestore(meal).catch(() => {});
  return updated;
}

/**
 * Bascule l'état favori (étoile) d'un repas
 */
export function toggleFavoriteMeal(mealId: string): AnalyzedMeal[] {
  const current = loadSavedMeals();
  const updated = current.map((m) =>
    m.id === mealId ? { ...m, is_favorite: !m.is_favorite } : m
  );
  saveMeals(updated);
  const target = updated.find((m) => m.id === mealId);
  if (target) {
    syncMealToFirestore(target).catch(() => {});
  }
  return updated;
}

/**
 * Supprime un repas de l'historique
 */
export function deleteMealFromHistory(mealId: string): AnalyzedMeal[] {
  const current = loadSavedMeals();
  const updated = current.filter((m) => m.id !== mealId);
  saveMeals(updated);
  // Suppression synchrone dans Firestore
  deleteMealFromFirestore(mealId).catch(() => {});
  return updated;
}

/**
 * Valide et garantit la structure complète et intègre du profil thérapeutique DT1
 */
export function sanitizeUserProfile(profile?: Partial<UserProfileDT1> | null): UserProfileDT1 {
  if (!profile || typeof profile !== 'object') {
    return { ...DEFAULT_USER_PROFILE };
  }

  const rawRatios: Partial<UserProfileDT1['icRatios']> =
    profile.icRatios && typeof profile.icRatios === 'object' ? profile.icRatios : {};
  const icRatios = {
    morning: Number(rawRatios.morning) > 0 ? Number(rawRatios.morning) : DEFAULT_USER_PROFILE.icRatios.morning,
    lunch: Number(rawRatios.lunch) > 0 ? Number(rawRatios.lunch) : DEFAULT_USER_PROFILE.icRatios.lunch,
    dinner: Number(rawRatios.dinner) > 0 ? Number(rawRatios.dinner) : DEFAULT_USER_PROFILE.icRatios.dinner,
    snack: Number(rawRatios.snack) > 0 ? Number(rawRatios.snack) : DEFAULT_USER_PROFILE.icRatios.snack,
    iftar: Number(rawRatios.iftar) > 0 ? Number(rawRatios.iftar) : (DEFAULT_USER_PROFILE.icRatios.iftar || 8),
    sahriya: Number(rawRatios.sahriya) > 0 ? Number(rawRatios.sahriya) : (DEFAULT_USER_PROFILE.icRatios.sahriya || 9),
    shor: Number(rawRatios.shor) > 0 ? Number(rawRatios.shor) : (DEFAULT_USER_PROFILE.icRatios.shor || 12),
  };

  return {
    ...DEFAULT_USER_PROFILE,
    ...profile,
    name: profile.name?.trim() || DEFAULT_USER_PROFILE.name,
    glucoseUnit: profile.glucoseUnit === 'mg/dL' ? 'mg/dL' : 'g/L',
    targetGlucose: typeof profile.targetGlucose === 'number' && profile.targetGlucose > 0
      ? profile.targetGlucose
      : DEFAULT_USER_PROFILE.targetGlucose,
    isf: typeof profile.isf === 'number' && profile.isf > 0
      ? profile.isf
      : DEFAULT_USER_PROFILE.isf,
    icRatios,
    roundingStep: profile.roundingStep === 1 || profile.roundingStep === 0.1 ? profile.roundingStep : 0.5,
    ramadanMode: Boolean(profile.ramadanMode),
  };
}

/**
 * Charge le profil thérapeutique DT1
 */
export function loadUserProfile(): UserProfileDT1 {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      saveUserProfile(DEFAULT_USER_PROFILE);
      return DEFAULT_USER_PROFILE;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeUserProfile(parsed);
    // Si les données stockées étaient corrompues ou incomplètes, restaurer la version saine
    if (!parsed?.icRatios?.lunch) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.error('Erreur lecture profil DT1:', err);
    return DEFAULT_USER_PROFILE;
  }
}

/**
 * Sauvegarde le profil thérapeutique DT1
 */
export function saveUserProfile(profile: UserProfileDT1): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sanitizeUserProfile(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(sanitized));
    // Synchronisation asynchrone avec Firestore
    syncProfileToFirestore(sanitized).catch(() => {});
  } catch (err) {
    console.error('Erreur sauvegarde profil DT1:', err);
  }
}

/**
 * Détermine le créneau horaire courant (matin, midi, soir, collation ou Ramadan: iftar, sahriya, shor)
 */
export function getCurrentMealSlot(ramadanMode: boolean = false): MealSlot {
  const hour = new Date().getHours();
  if (ramadanMode) {
    if (hour >= 17 && hour < 21) return 'iftar';
    if (hour >= 21 || hour < 2) return 'sahriya';
    if (hour >= 2 && hour < 6) return 'shor';
    return 'iftar';
  }
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 19) return 'snack';
  return 'dinner';
}

/**
 * Calcule la dose de bolus personnalisée (glucides + correction optionnelle - modulation activité physique)
 */
export function calculatePersonalizedBolus(
  totalCarbs: number,
  profile: UserProfileDT1,
  slot: MealSlot,
  currentGlucose?: number,
  activityLevel: PhysicalActivityLevel = 'none'
): CalculatedBolusSummary {
  const safeProfile = sanitizeUserProfile(profile);
  const icRatio = safeProfile.icRatios[slot] || 10;
  // Bolus repas brut = Glucides / Ratio
  const rawMealBolus = totalCarbs / icRatio;

  // Réduction activité physique (Consensus ISPAD / SFD)
  let activityReductionPct = 0;
  if (activityLevel === 'light_walk') {
    activityReductionPct = 15; // -15% marche digestive (15-30 min)
  } else if (activityLevel === 'moderate') {
    activityReductionPct = 30; // -30% sport modéré (jogging, vélo, nage 30-45 min)
  } else if (activityLevel === 'intense') {
    activityReductionPct = 50; // -50% effort intense / cardio > 45 min
  }

  const activityReductionUnits = (rawMealBolus * activityReductionPct) / 100;
  const netMealBolus = Math.max(0, rawMealBolus - activityReductionUnits);

  // Bolus de correction (si glycémie renseignée et > cible)
  let rawCorrectionBolus = 0;
  if (
    typeof currentGlucose === 'number' &&
    currentGlucose > profile.targetGlucose &&
    profile.isf > 0
  ) {
    rawCorrectionBolus = (currentGlucose - profile.targetGlucose) / profile.isf;
  }

  const rawTotal = netMealBolus + rawCorrectionBolus;
  const step = profile.roundingStep || 0.5;
  const roundedTotal = Math.max(0, Math.round(rawTotal / step) * step);

  return {
    slot,
    icRatio,
    rawMealBolus: Number(rawMealBolus.toFixed(2)),
    mealBolus: Number(netMealBolus.toFixed(2)),
    correctionBolus: Number(rawCorrectionBolus.toFixed(2)),
    totalBolus: Number(roundedTotal.toFixed(1)),
    currentGlucose,
    targetGlucose: profile.targetGlucose,
    isf: profile.isf,
    activityLevel,
    activityReductionPct,
    activityReductionUnits: Number(activityReductionUnits.toFixed(2)),
  };
}

/**
 * Exporte l'intégralité des données en format JSON de sauvegarde
 */
export function exportUserDataBackup(): void {
  const backupData = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    profile: loadUserProfile(),
    meals: loadSavedMeals(),
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', `glucomal-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Importe un fichier de sauvegarde JSON
 */
export function importUserDataBackup(jsonContent: string): { success: boolean; count?: number; error?: string } {
  try {
    const data = JSON.parse(jsonContent);
    if (data.profile) {
      saveUserProfile(data.profile);
    }
    if (Array.isArray(data.meals)) {
      saveMeals(data.meals);
      return { success: true, count: data.meals.length };
    }
    return { success: false, error: 'Structure de fichier JSON non valide.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Fichier JSON corrompu.' };
  }
}
