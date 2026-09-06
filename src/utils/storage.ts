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

// Historique initial vide (aucune donnée fictive de démonstration)
export const INITIAL_DEMO_MEALS: AnalyzedMeal[] = [];
let memoryMealsStore: AnalyzedMeal[] = [];

/**
 * Charge l'historique des repas sauvegardés
 */
export function loadSavedMeals(): AnalyzedMeal[] {
  if (typeof window === 'undefined') return [...memoryMealsStore];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purge automatique des anciens repas de démo (meal-hist-1, meal-hist-2, etc.)
    const cleaned = parsed.filter(
      (m: any) => !m.id?.startsWith('meal-hist-') && m.user_id !== 'user-t1d-1'
    );
    if (cleaned.length !== parsed.length) {
      saveMeals(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Erreur lecture repas sauvegardés:', err);
    return [];
  }
}

/**
 * Sauvegarde la liste complète des repas
 */
export function saveMeals(meals: AnalyzedMeal[]): void {
  memoryMealsStore = [...meals];
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
 * Supprime l'intégralité des repas de l'historique
 */
export function clearAllMeals(): AnalyzedMeal[] {
  saveMeals([]);
  return [];
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
      : (profile.glucoseUnit === 'mg/dL' ? 100 : DEFAULT_USER_PROFILE.targetGlucose),
    isf: typeof profile.isf === 'number' && profile.isf > 0
      ? profile.isf
      : (profile.glucoseUnit === 'mg/dL' ? 40 : DEFAULT_USER_PROFILE.isf),
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

export const MAX_SAFE_BOLUS_UNITS = 20.0;

/**
 * Calcule la dose de bolus personnalisée (glucides + correction optionnelle - modulation activité physique)
 * avec plafond de sécurité médical strict (Safety Cap 20 UI max) et validation d'échelle d'unités
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

  // Détection d'anomalie d'échelle glycémique et normalisation sécurisée
  let normalizedCurrentGlucose = currentGlucose;
  let safetyWarning: string | undefined;

  if (typeof currentGlucose === 'number' && currentGlucose > 0) {
    if (safeProfile.glucoseUnit === 'g/L' && currentGlucose > 5.0) {
      // Patient a probablement saisi en mg/dL (ex: 180 au lieu de 1.80)
      normalizedCurrentGlucose = Number((currentGlucose / 100).toFixed(2));
      safetyWarning = `Attention : glycémie saisie (${currentGlucose}) interprétée en mg/dL et convertie en ${normalizedCurrentGlucose} g/L pour prévenir un surdosage d'insuline.`;
    } else if (safeProfile.glucoseUnit === 'mg/dL' && currentGlucose < 25.0) {
      // Patient a probablement saisi en g/L (ex: 1.40 au lieu de 140)
      normalizedCurrentGlucose = Math.round(currentGlucose * 100);
      safetyWarning = `Attention : glycémie saisie (${currentGlucose}) interprétée en g/L et convertie en ${normalizedCurrentGlucose} mg/dL.`;
    }
  }

  // Bolus de correction (si glycémie renseignée et > cible)
  let rawCorrectionBolus = 0;
  if (
    typeof normalizedCurrentGlucose === 'number' &&
    normalizedCurrentGlucose > safeProfile.targetGlucose &&
    safeProfile.isf > 0
  ) {
    rawCorrectionBolus = (normalizedCurrentGlucose - safeProfile.targetGlucose) / safeProfile.isf;
  }

  const rawTotal = netMealBolus + rawCorrectionBolus;
  const step = safeProfile.roundingStep || 0.5;
  const roundedTotal = Math.max(0, Math.round(rawTotal / step) * step);

  // Plafond de sécurité maximal absolu (Safety Cap à 20 UI)
  const isCapped = roundedTotal > MAX_SAFE_BOLUS_UNITS;
  const safeTotalBolus = isCapped ? MAX_SAFE_BOLUS_UNITS : roundedTotal;

  if (isCapped) {
    safetyWarning = (safetyWarning ? `${safetyWarning} ` : '') +
      `⚠️ ALERTE SÉCURITÉ CLINIQUE : Dose calculée (${roundedTotal.toFixed(1)} UI) plafonnée d'office à ${MAX_SAFE_BOLUS_UNITS} UI max pour prévenir tout surdosage critique.`;
  }

  return {
    slot,
    icRatio,
    rawMealBolus: Number(rawMealBolus.toFixed(2)),
    mealBolus: Number(netMealBolus.toFixed(2)),
    correctionBolus: Number(rawCorrectionBolus.toFixed(2)),
    totalBolus: Number(safeTotalBolus.toFixed(1)),
    unclampedTotalBolus: Number(roundedTotal.toFixed(1)),
    isCapped,
    safetyWarning,
    currentGlucose: normalizedCurrentGlucose,
    targetGlucose: safeProfile.targetGlucose,
    isf: safeProfile.isf,
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
