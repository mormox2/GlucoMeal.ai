import {
  AnalyzedMeal,
  UserProfileDT1,
  MealSlot,
  PhysicalActivityLevel,
  CalculatedBolusSummary,
  CGMReading,
  ProfileValidationIssue,
} from '../types';
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
  isHoneymoonPhase: false, // Phase de lune de miel désactivée par défaut
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
    isHoneymoonPhase: Boolean(profile.isHoneymoonPhase),
    diagnosisDate: typeof profile.diagnosisDate === 'string' ? profile.diagnosisDate : undefined,
    honeymoonNotes: typeof profile.honeymoonNotes === 'string' ? profile.honeymoonNotes : undefined,
    maxBolusUnits:
      typeof profile.maxBolusUnits === 'number' && profile.maxBolusUnits > 0 ? profile.maxBolusUnits : undefined,
    insulinActionHours:
      typeof profile.insulinActionHours === 'number' && profile.insulinActionHours > 0
        ? profile.insulinActionHours
        : DEFAULT_INSULIN_ACTION_HOURS,
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
 * Sauvegarde le profil thérapeutique DT1.
 * Un profil hors bornes cliniques n'est PAS enregistré : la liste des problèmes est renvoyée.
 */
export function saveUserProfile(profile: UserProfileDT1): ProfileValidationIssue[] {
  const issues = validateTherapeuticProfile(profile);
  if (issues.length > 0) {
    console.warn('Profil DT1 refusé (hors bornes cliniques):', issues.map((i) => i.fr));
    return issues;
  }
  if (typeof window === 'undefined') return issues;
  try {
    const sanitized = sanitizeUserProfile(profile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(sanitized));
    // Synchronisation asynchrone avec Firestore
    syncProfileToFirestore(sanitized).catch(() => {});
  } catch (err) {
    console.error('Erreur sauvegarde profil DT1:', err);
  }
  return issues;
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
// Plafond par défaut, prudent, d'un profil enfant tant que le soignant n'a pas réglé le plafond
export const DEFAULT_CHILD_MAX_BOLUS_UNITS = 10.0;
export const DEFAULT_INSULIN_ACTION_HOURS = 4;

export function isChildProfile(profile: Partial<UserProfileDT1>): boolean {
  return profile.accountType === 'parent' || Boolean(profile.childProfile);
}

/**
 * Plafond de bolus applicable : réglé dans le profil (avec le soignant), sinon 20 UI pour un adulte
 * et 10 UI pour un enfant.
 */
export function getMaxBolusUnits(profile: Partial<UserProfileDT1>): number {
  if (typeof profile.maxBolusUnits === 'number' && profile.maxBolusUnits > 0) return profile.maxBolusUnits;
  return isChildProfile(profile) ? DEFAULT_CHILD_MAX_BOLUS_UNITS : MAX_SAFE_BOLUS_UNITS;
}

/**
 * Insuline encore active (IOB) des bolus enregistrés, avec une décroissance linéaire sur la durée
 * d'action de l'insuline rapide. Les repas sans bolus ou au bolus bloqué sont ignorés.
 */
export function computeInsulinOnBoard(
  meals: AnalyzedMeal[],
  actionHours: number = DEFAULT_INSULIN_ACTION_HOURS,
  now: number = Date.now(),
  excludeMealId?: string
): number {
  const actionMs = actionHours * 3600 * 1000;
  let iob = 0;
  for (const meal of meals) {
    if (meal.id === excludeMealId) continue;
    const dose = meal.bolus_calculated?.totalBolus;
    if (!dose || dose <= 0 || meal.bolus_calculated?.isBlocked) continue;
    const time = Date.parse(meal.created_at || meal.timestamp || '');
    if (Number.isNaN(time)) continue;
    const elapsed = now - time;
    if (elapsed < 0 || elapsed >= actionMs) continue;
    iob += dose * (1 - elapsed / actionMs);
  }
  return Number(iob.toFixed(2));
}

export interface BolusCalculationOptions {
  insulinOnBoard?: number; // Insuline active (UI), voir computeInsulinOnBoard
  glucoseTrend?: CGMReading['trend']; // Tendance de la lecture CGM utilisée (absente pour une saisie manuelle)
}

/**
 * Bornes cliniques des paramètres thérapeutiques (par unité de glycémie).
 * Les plages g/L et mg/dL ne se chevauchent pas : une valeur saisie dans la mauvaise
 * unité (ex. ISF 0.4 dans un profil mg/dL) est donc toujours détectée.
 */
export const THERAPEUTIC_BOUNDS = {
  icRatio: { min: 2, max: 60 }, // g de glucides couverts par 1 UI
  isf: {
    'g/L': { min: 0.05, max: 4 },
    'mg/dL': { min: 5, max: 400 },
  },
  targetGlucose: {
    'g/L': { min: 0.7, max: 2 },
    'mg/dL': { min: 70, max: 200 },
  },
  maxBolusUnits: { min: 1, max: 50 },
  insulinActionHours: { min: 2, max: 8 },
} as const;

const SLOT_LABELS: Record<MealSlot, { fr: string; ar: string }> = {
  morning: { fr: 'matin', ar: 'الصباح' },
  lunch: { fr: 'midi', ar: 'الغداء' },
  dinner: { fr: 'soir', ar: 'العشاء' },
  snack: { fr: 'collation', ar: 'اللمجة' },
  iftar: { fr: 'iftar', ar: 'الإفطار' },
  sahriya: { fr: 'sahriya', ar: 'السهرية' },
  shor: { fr: 'shor', ar: 'السحور' },
};

/**
 * Vérifie que les paramètres d'insuline sont dans des bornes cliniques plausibles
 * et cohérents avec l'unité de glycémie. Une liste vide signifie un profil valide.
 */
export function validateTherapeuticProfile(profile?: Partial<UserProfileDT1> | null): ProfileValidationIssue[] {
  const safe = sanitizeUserProfile(profile);
  const unit = safe.glucoseUnit;
  const issues: ProfileValidationIssue[] = [];

  const target = THERAPEUTIC_BOUNDS.targetGlucose[unit];
  if (!(safe.targetGlucose >= target.min && safe.targetGlucose <= target.max)) {
    issues.push({
      field: 'targetGlucose',
      fr: `Cible glycémique ${safe.targetGlucose} ${unit} hors bornes (${target.min} – ${target.max} ${unit}).`,
      ar: `الهدف السكري ${safe.targetGlucose} ${unit} خارج الحدود (${target.min} – ${target.max} ${unit}).`,
    });
  }

  const isf = THERAPEUTIC_BOUNDS.isf[unit];
  if (!(safe.isf >= isf.min && safe.isf <= isf.max)) {
    issues.push({
      field: 'isf',
      fr: `Sensibilité (ISF) ${safe.isf} ${unit}/UI hors bornes (${isf.min} – ${isf.max} ${unit}/UI). Vérifiez l'unité.`,
      ar: `معامل الحساسية ${safe.isf} ${unit}/وحدة خارج الحدود (${isf.min} – ${isf.max}). تحقق من الوحدة.`,
    });
  }

  if (safe.maxBolusUnits !== undefined) {
    const cap = THERAPEUTIC_BOUNDS.maxBolusUnits;
    if (!(safe.maxBolusUnits >= cap.min && safe.maxBolusUnits <= cap.max)) {
      issues.push({
        field: 'maxBolusUnits',
        fr: `Plafond de bolus ${safe.maxBolusUnits} UI hors bornes (${cap.min} – ${cap.max} UI).`,
        ar: `سقف الجرعة ${safe.maxBolusUnits} وحدة خارج الحدود (${cap.min} – ${cap.max}).`,
      });
    }
  }

  const action = THERAPEUTIC_BOUNDS.insulinActionHours;
  if (!(safe.insulinActionHours! >= action.min && safe.insulinActionHours! <= action.max)) {
    issues.push({
      field: 'insulinActionHours',
      fr: `Durée d'action de l'insuline ${safe.insulinActionHours} h hors bornes (${action.min} – ${action.max} h).`,
      ar: `مدة مفعول الإنسولين ${safe.insulinActionHours} ساعة خارج الحدود (${action.min} – ${action.max}).`,
    });
  }

  const { min, max } = THERAPEUTIC_BOUNDS.icRatio;
  (Object.keys(safe.icRatios) as MealSlot[]).forEach((slot) => {
    const ratio = safe.icRatios[slot];
    if (ratio === undefined) return;
    if (!(ratio >= min && ratio <= max)) {
      issues.push({
        field: 'icRatio',
        slot,
        fr: `Ratio ${SLOT_LABELS[slot].fr} (1 UI / ${ratio} g) hors bornes (${min} – ${max} g/UI).`,
        ar: `معامل ${SLOT_LABELS[slot].ar} (1 وحدة / ${ratio} غ) خارج الحدود (${min} – ${max} غ/وحدة).`,
      });
    }
  });

  return issues;
}

export type GlucoseInputInterpretation =
  | { status: 'empty' }
  | { status: 'ok'; value: number; converted: boolean }
  | { status: 'invalid' };

/**
 * Interprète une glycémie saisie dans l'unité du profil.
 * - Valeur plausible dans l'unité du profil : conservée.
 * - Valeur sans ambiguïté dans l'autre unité (ex. 180 dans un profil g/L, 1.4 dans un profil mg/dL) : convertie.
 * - Valeur ambiguë, notamment plausible en mmol/L (ex. 12 dans un profil g/L, 4.5 dans un profil mg/dL) :
 *   rejetée, aucune dose n'est calculée. Convertir 4.5 mmol/L (0.81 g/L) en 450 mg/dL provoquerait
 *   une correction massive.
 */
export function interpretGlucoseInput(
  rawValue: number | undefined,
  unit: 'g/L' | 'mg/dL'
): GlucoseInputInterpretation {
  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return { status: 'empty' };
  }
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return { status: 'invalid' };
  }
  if (unit === 'g/L') {
    if (rawValue >= 0.1 && rawValue <= 6) return { status: 'ok', value: rawValue, converted: false };
    // ≥ 40 : forcément des mg/dL (une valeur en mmol/L ne dépasse pas ~33)
    if (rawValue >= 40 && rawValue <= 600) {
      return { status: 'ok', value: Number((rawValue / 100).toFixed(2)), converted: true };
    }
  } else {
    if (rawValue >= 10 && rawValue <= 600) return { status: 'ok', value: rawValue, converted: false };
    // < 2.2 : forcément des g/L (une valeur en mmol/L aussi basse serait une hypoglycémie extrême)
    if (rawValue >= 0.1 && rawValue < 2.2) {
      return { status: 'ok', value: Math.round(rawValue * 100), converted: true };
    }
  }
  return { status: 'invalid' };
}

/**
 * Calcule la dose de bolus personnalisée (glucides + correction optionnelle - modulation activité physique)
 * avec plafond de sécurité médical strict (Safety Cap 20 UI max) et validation d'échelle d'unités.
 *
 * Aucune dose n'est proposée (totalBolus = 0, isBlocked = true) si :
 * - le profil thérapeutique est hors bornes cliniques,
 * - la quantité de glucides n'est pas un nombre valide,
 * - la glycémie saisie est ininterprétable,
 * - la glycémie (normalisée) est en hypoglycémie.
 */
export function calculatePersonalizedBolus(
  totalCarbs: number,
  profile: UserProfileDT1,
  slot: MealSlot,
  currentGlucose?: number,
  activityLevel: PhysicalActivityLevel = 'none',
  options: BolusCalculationOptions = {}
): CalculatedBolusSummary {
  const safeProfile = sanitizeUserProfile(profile);
  const unit = safeProfile.glucoseUnit;
  const icRatio = safeProfile.icRatios[slot] || safeProfile.icRatios.lunch;
  const profileIssues = validateTherapeuticProfile(safeProfile);
  const carbsAreValid = typeof totalCarbs === 'number' && Number.isFinite(totalCarbs) && totalCarbs >= 0;
  const carbs = carbsAreValid ? totalCarbs : 0;

  // Bolus repas brut = Glucides / Ratio
  const rawMealBolus = carbs / icRatio;

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
  const glucose = interpretGlucoseInput(currentGlucose, unit);
  const normalizedCurrentGlucose = glucose.status === 'ok' ? glucose.value : undefined;
  const warnings: string[] = [];

  if (glucose.status === 'ok' && glucose.converted) {
    warnings.push(
      unit === 'g/L'
        ? `Attention : glycémie saisie (${currentGlucose}) interprétée en mg/dL et convertie en ${normalizedCurrentGlucose} g/L pour prévenir un surdosage d'insuline.`
        : `Attention : glycémie saisie (${currentGlucose}) interprétée en g/L et convertie en ${normalizedCurrentGlucose} mg/dL.`
    );
  }

  const hypoThreshold = unit === 'g/L' ? 0.7 : 70;
  const cautionThreshold = unit === 'g/L' ? 0.8 : 80;
  const isHypoglycemia = normalizedCurrentGlucose !== undefined && normalizedCurrentGlucose < hypoThreshold;
  const isCautionLow =
    normalizedCurrentGlucose !== undefined && !isHypoglycemia && normalizedCurrentGlucose < cautionThreshold;

  // Bolus de correction : positif au-dessus de la cible, négatif (réduction du bolus repas) en dessous
  let rawCorrectionBolus = 0;
  if (typeof normalizedCurrentGlucose === 'number' && !isHypoglycemia && safeProfile.isf > 0) {
    rawCorrectionBolus = (normalizedCurrentGlucose - safeProfile.targetGlucose) / safeProfile.isf;
  }

  // Insuline active (IOB) : déduite de la correction positive pour éviter l'empilement des corrections
  const insulinOnBoard = Math.max(0, options.insulinOnBoard || 0);
  let correctionBolus = rawCorrectionBolus;
  let insulinOnBoardDeducted = 0;
  if (correctionBolus > 0 && insulinOnBoard > 0) {
    insulinOnBoardDeducted = Math.min(insulinOnBoard, correctionBolus);
    correctionBolus -= insulinOnBoardDeducted;
    warnings.push(
      `Insuline active : ${insulinOnBoardDeducted.toFixed(1)} UI déduite(s) de la correction (bolus précédents encore actifs).`
    );
  } else if (insulinOnBoard > 0 && normalizedCurrentGlucose === undefined) {
    warnings.push(
      `Insuline active estimée à ${insulinOnBoard.toFixed(1)} UI (bolus récents) : mesurez votre glycémie avant toute correction.`
    );
  }

  // Glycémie en baisse (tendance CGM) : pas de correction positive
  const isFalling = options.glucoseTrend === 'down_fast' || options.glucoseTrend === 'down_slow';
  if (correctionBolus > 0 && isFalling) {
    correctionBolus = 0;
    warnings.push('Glycémie en baisse (tendance CGM) : aucune correction ajoutée.');
  }
  if (correctionBolus < 0) {
    warnings.push(
      `Glycémie sous la cible : bolus repas réduit de ${Math.abs(correctionBolus).toFixed(1)} UI (correction négative).`
    );
  }

  const rawTotal = netMealBolus + correctionBolus;
  const step = safeProfile.roundingStep || 0.5;
  const roundedTotal = Math.max(0, Math.round(rawTotal / step) * step);

  // Plafond de sécurité : réglé dans le profil, sinon 20 UI (adulte) / 10 UI (enfant)
  const maxBolusUnits = getMaxBolusUnits(safeProfile);
  const exceedsCap = roundedTotal > maxBolusUnits;
  let safeTotalBolus = exceedsCap ? maxBolusUnits : roundedTotal;

  // Blocages de sécurité : aucune dose n'est proposée
  let blockReason: CalculatedBolusSummary['blockReason'];
  if (profileIssues.length > 0) {
    blockReason = 'invalid_profile';
    // Le détail des valeurs hors bornes est fourni dans profileIssues
    warnings.push('⛔ Profil thérapeutique hors bornes cliniques : aucune dose calculée. Corrigez votre profil DT1.');
  } else if (!carbsAreValid) {
    blockReason = 'invalid_carbs';
    warnings.push('⛔ Quantité de glucides invalide : aucune dose calculée. Vérifiez les aliments du repas.');
  } else if (glucose.status === 'invalid') {
    blockReason = 'invalid_glucose';
    warnings.push(
      `⛔ Glycémie saisie (${currentGlucose}) ininterprétable en ${unit} (valeur en mmol/L ?) : aucune dose calculée. Ressaisissez la valeur en ${unit}.`
    );
  } else if (isHypoglycemia) {
    blockReason = 'hypoglycemia';
    warnings.push(
      `🚨 Hypoglycémie (${normalizedCurrentGlucose} ${unit}) : aucune dose d'insuline. Resucrez (15 g de sucre rapide), recontrôlez après 15 min, puis ressaisissez la glycémie pour recalculer le bolus.`
    );
  }
  const isBlocked = blockReason !== undefined;
  const isCapped = exceedsCap && !isBlocked;
  if (isBlocked) {
    safeTotalBolus = 0;
  } else if (isCapped) {
    warnings.push(
      `⚠️ ALERTE SÉCURITÉ CLINIQUE : Dose calculée (${roundedTotal.toFixed(1)} UI) plafonnée d'office à ${maxBolusUnits} UI max pour prévenir tout surdosage critique.`
    );
  }

  // Prise en compte clinique de la phase de lune de miel (rémission partielle du DT1)
  const isHoneymoonActive = Boolean(safeProfile.isHoneymoonPhase);
  let honeymoonNotice: string | undefined;

  if (isHoneymoonActive) {
    honeymoonNotice =
      "🍯 Phase de lune de miel active : vos cellules bêta résiduelles sécrètent encore de l'insuline. Les besoins sont réduits. Surveillez attentivement la glycémie post-prandiale pour prévenir toute hypoglycémie.";
    if (icRatio < 8) {
      warnings.push(
        `⚠️ Vigilance Lune de Miel : Le ratio paramétré (1 UI / ${icRatio}g) est très concentré pour une rémission partielle. En lune de miel, les ratios habituels sont souvent plus légers (ex: 1 UI pour 15 à 20g) pour éviter les hypoglycémies sévères.`
      );
    }
  }

  return {
    slot,
    icRatio,
    rawMealBolus: Number(rawMealBolus.toFixed(2)),
    mealBolus: Number(netMealBolus.toFixed(2)),
    correctionBolus: Number(correctionBolus.toFixed(2)),
    rawCorrectionBolus: Number(rawCorrectionBolus.toFixed(2)),
    insulinOnBoard,
    insulinOnBoardDeducted: Number(insulinOnBoardDeducted.toFixed(2)),
    glucoseTrend: options.glucoseTrend,
    maxBolusUnits,
    totalBolus: Number(safeTotalBolus.toFixed(1)),
    unclampedTotalBolus: Number(roundedTotal.toFixed(1)),
    isCapped,
    safetyWarning: warnings.length > 0 ? warnings.join(' ') : undefined,
    isHoneymoonActive,
    honeymoonNotice,
    currentGlucose: normalizedCurrentGlucose,
    targetGlucose: safeProfile.targetGlucose,
    isf: safeProfile.isf,
    activityLevel,
    activityReductionPct,
    activityReductionUnits: Number(activityReductionUnits.toFixed(2)),
    isHypoglycemia,
    isCautionLow,
    isBlocked,
    blockReason,
    profileIssues: profileIssues.length > 0 ? profileIssues : undefined,
  };
}

/**
 * Exporte l'intégralité des données en format JSON de sauvegarde
 */
export function exportUserDataBackup(): void {
  // Les identifiants d'appareils (clé Nightscout, mots de passe cloud CGM) ne sont jamais exportés
  const { cgmConfig: _secrets, ...profile } = loadUserProfile();
  const backupData = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    profile,
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
      const issues = validateTherapeuticProfile(data.profile);
      if (issues.length > 0) {
        return {
          success: false,
          error: `Profil thérapeutique du fichier refusé : ${issues.map((i) => i.fr).join(' ')}`,
        };
      }
    }
    if (data.profile) {
      // La configuration CGM locale est conservée (elle n'est jamais incluse dans une sauvegarde)
      saveUserProfile({ ...data.profile, cgmConfig: loadUserProfile().cgmConfig });
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
