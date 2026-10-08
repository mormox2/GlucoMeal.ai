import { AnalyzedMeal, UserProfileDT1, MealSlot } from '../types';
import { sanitizeUserProfile, getMealSlotForHour } from './storage';
import { classifyPostPrandial, getPostPrandialGlucose } from './postPrandial';

export interface SlotTitrationAnalysis {
  slot: MealSlot;
  slotLabel: string;
  mealCount: number;
  totalRecordedPostPrandial: number;
  evaluations: {
    target: number;
    hyper: number;
    hypo: number;
  };
  targetPercentage: number;
  hyperPercentage: number;
  hypoPercentage: number;
  currentRatio: number; // g de glucides pour 1 UI (ex: 10)
  suggestedRatio: number; // g de glucides pour 1 UI (ex: 8.5)
  status: 'optimal' | 'increase_insulin' | 'decrease_insulin' | 'insufficient_data';
  recommendationTitle: string;
  clinicalRationale: string;
  confidenceLevel: 'high' | 'moderate' | 'low';
  averagePostPrandial: number | null;
}

export interface HoneymoonInsight {
  isHoneymoon: boolean;
  status: 'active_stable' | 'waning_phase' | 'hypo_risk' | 'not_applicable';
  title: string;
  message: string;
}

export interface GlobalTitrationReport {
  slots: Record<MealSlot, SlotTitrationAnalysis>;
  totalAnalyzedMeals: number;
  totalPostPrandials: number;
  globalTimeInRangePercent: number;
  priorityAlert: string | null;
  clinicalRecommendationCount: number;
  honeymoonInsight?: HoneymoonInsight;
}

// Règles de prudence de l'auto-titration
export const TITRATION_WINDOW_DAYS = 14; // seuls les contrôles récents comptent
export const MIN_CONTROLS_FOR_CHANGE = 5; // contrôles H+2 minimum avant toute proposition de renforcement
const MAX_INSULIN_INCREASE = 0.1; // renforcement plafonné à +10 % d'insuline
const INSULIN_DECREASE_RATIO_FACTOR = 1.15; // allègement (prioritaire) : ratio × 1,15

/**
 * Détermine le créneau repas à partir de l'analyse ou de l'heure du repas
 * (mêmes plages horaires que le calcul de bolus).
 */
export function getMealSlotFromMeal(meal: AnalyzedMeal): MealSlot {
  if (meal.bolus_calculated?.slot) {
    return meal.bolus_calculated.slot;
  }
  const date = meal.timestamp ? new Date(meal.timestamp) : new Date(meal.created_at || Date.now());
  return getMealSlotForHour(date.getHours());
}

function mealTime(meal: AnalyzedMeal): number {
  return Date.parse(meal.created_at || meal.timestamp || '');
}

/**
 * Un repas ne sert à la titration que s'il est récent, si un bolus a bien été calculé (non bloqué)
 * et s'il a été dosé avec le ratio actuel du créneau : après un changement de ratio, il faut de
 * nouveaux contrôles avant toute nouvelle proposition.
 */
function isEligibleForTitration(meal: AnalyzedMeal, currentRatio: number, now: number): boolean {
  const time = mealTime(meal);
  if (Number.isNaN(time) || time > now || now - time > TITRATION_WINDOW_DAYS * 24 * 3600 * 1000) return false;
  const bolus = meal.bolus_calculated;
  if (!bolus || bolus.isBlocked) return false;
  return bolus.icRatio === undefined || bolus.icRatio === currentRatio;
}

/**
 * Moteur d'auto-titration (aide à la discussion avec le diabétologue, jamais appliquée automatiquement).
 * - Hypoglycémies répétées : allègement proposé en priorité, même avec peu de contrôles.
 * - Hyperglycémies : renforcement seulement avec au moins 5 contrôles récents au ratio actuel, sans
 *   aucune hypoglycémie sur la période, et plafonné à +10 % d'insuline.
 */
export function analyzePatientTitration(
  meals: AnalyzedMeal[],
  userProfile: UserProfileDT1,
  language: 'fr' | 'ar' = 'fr',
  now: number = Date.now()
): GlobalTitrationReport {
  const safeProfile = sanitizeUserProfile(userProfile);
  const isAr = language === 'ar';
  const slotLabels: Record<MealSlot, string> = {
    morning: isAr ? 'فطور الصباح' : 'Petit-déjeuner (Matin)',
    lunch: isAr ? 'الغداء' : 'Déjeuner (Midi)',
    dinner: isAr ? 'العشاء' : 'Dîner (Soir)',
    snack: isAr ? 'لمجة / وجبة خفيفة' : 'Collation / Goûter',
    iftar: isAr ? 'الإفطار (رمضان)' : 'Iftar (Rupture du Jeûne)',
    sahriya: isAr ? 'السهرية' : 'Sahriya (Soirée)',
    shor: isAr ? 'السحور' : "Shor (Repas de l'Aube)",
  };

  const slotsMap: Record<MealSlot, AnalyzedMeal[]> = {
    morning: [],
    lunch: [],
    dinner: [],
    snack: [],
    iftar: [],
    sahriya: [],
    shor: [],
  };

  meals.forEach((m) => {
    const slot = getMealSlotFromMeal(m);
    slotsMap[slot].push(m);
  });

  const slotsResult: Partial<Record<MealSlot, SlotTitrationAnalysis>> = {};
  let totalWithPP = 0;
  let totalTarget = 0;
  let clinicalAlerts = 0;
  let priorityAlertMessage: string | null = null;

  (Object.keys(slotsMap) as MealSlot[]).forEach((slot) => {
    const currentRatio = safeProfile.icRatios[slot] || 10;
    const slotMeals = slotsMap[slot];
    const mealsWithPP = slotMeals.filter(
      (m) => isEligibleForTitration(m, currentRatio, now) && classifyPostPrandial(m, safeProfile) !== undefined
    );
    const countPP = mealsWithPP.length;
    totalWithPP += countPP;

    let targetCount = 0;
    let hyperCount = 0;
    let hypoCount = 0;
    let glucoseSum = 0;
    let glucoseCount = 0;

    mealsWithPP.forEach((m) => {
      // Valeurs normalisées dans l'unité du profil (une ancienne saisie « 65 » en g/L = 0.65 g/L, hypo)
      const value = getPostPrandialGlucose(m, safeProfile.glucoseUnit);
      if (value !== undefined) {
        glucoseSum += value;
        glucoseCount++;
      }
      const status = classifyPostPrandial(m, safeProfile);
      if (status === 'target') targetCount++;
      else if (status === 'hyper') hyperCount++;
      else if (status === 'hypo') hypoCount++;
    });

    totalTarget += targetCount;
    const avgPP = glucoseCount > 0 ? Math.round((glucoseSum / glucoseCount) * 100) / 100 : null;

    const targetPct = countPP > 0 ? Math.round((targetCount / countPP) * 100) : 0;
    const hyperPct = countPP > 0 ? Math.round((hyperCount / countPP) * 100) : 0;
    const hypoPct = countPP > 0 ? Math.round((hypoCount / countPP) * 100) : 0;

    let suggestedRatio = currentRatio;
    let status: SlotTitrationAnalysis['status'] = 'optimal';
    let recommendationTitle = isAr ? 'معامل متوازن' : 'Ratio équilibré';
    let clinicalRationale = '';
    const confidence: SlotTitrationAnalysis['confidenceLevel'] =
      countPP >= 10 ? 'high' : countPP >= MIN_CONTROLS_FOR_CHANGE ? 'moderate' : 'low';

    // Règle 1 : hypoglycémies répétées (priorité de sécurité, même avec peu de contrôles)
    if (hypoCount >= 2 || (countPP >= MIN_CONTROLS_FOR_CHANGE && hypoPct >= 20)) {
      status = 'decrease_insulin';
      clinicalAlerts++;
      // Diminuer l'insuline = 1 UI couvre PLUS de grammes de glucides
      suggestedRatio = Math.min(60, Math.round(currentRatio * INSULIN_DECREASE_RATIO_FACTOR * 10) / 10);
      recommendationTitle = isAr ? '⚠️ خطر هبوط السكر (+2س)' : '⚠️ Risque d’hypoglycémie (+2h)';
      clinicalRationale = isAr
        ? `من بين ${countPP} قياسات حديثة في هذه الفترة، لوحظت ${hypoCount} نوبة هبوط سكر (${hypoPct}%). يمكن مناقشة تخفيف الجرعة بزيادة المعامل من 1 وحدة لكل ${currentRatio}غ إلى 1 وحدة لكل ${suggestedRatio}غ (حوالي -13% إنسولين).`
        : `Sur ${countPP} contrôles récents de ce créneau, ${hypoCount} hypoglycémie(s) (${hypoPct}%). Piste : alléger le bolus en passant de 1 UI pour ${currentRatio} g à 1 UI pour ${suggestedRatio} g de glucides (environ -13 % d'insuline).`;
      if (safeProfile.isHoneymoonPhase) {
        clinicalRationale = isAr
          ? `🍯 أمان مرحلة شهر العسل: من بين ${countPP} قياسات، تم تسجيل ${hypoCount} نوبة هبوط سكر (${hypoPct}%). الإفراز الداخلي المتبقي يضاعف مفعول الإنسولين. يمكن مناقشة الانتقال إلى 1 وحدة لكل ${suggestedRatio}غ.`
          : `🍯 Sécurité Lune de Miel : sur ${countPP} contrôles, ${hypoCount} hypoglycémie(s) (${hypoPct}%). La sécrétion résiduelle amplifie l'effet de l'insuline. Piste : passer à 1 UI pour ${suggestedRatio} g de glucides.`;
      }
      if (!priorityAlertMessage) {
        priorityAlertMessage = isAr
          ? `تم رصد هبوط سكر متكرر في فترة ${slotLabels[slot]}. تواصل مع طبيبك.`
          : `Hypoglycémies répétées détectées sur le créneau du ${slotLabels[slot].toLowerCase()}. À discuter rapidement avec votre diabétologue.`;
      }
    } else if (countPP < MIN_CONTROLS_FOR_CHANGE) {
      status = 'insufficient_data';
      recommendationTitle = isAr ? 'بيانات غير كافية' : 'Données insuffisantes';
      clinicalRationale = isAr
        ? `يلزم ${MIN_CONTROLS_FOR_CHANGE} قياسات على الأقل (+2س) خلال آخر ${TITRATION_WINDOW_DAYS} يوماً بالمعامل الحالي (حالياً ${countPP}).`
        : `Il faut au moins ${MIN_CONTROLS_FOR_CHANGE} contrôles post-prandiaux (+2h) sur les ${TITRATION_WINDOW_DAYS} derniers jours avec le ratio actuel (actuellement ${countPP}).`;
    } else if (hyperPct >= 50 && hypoCount > 0) {
      // Résultats contradictoires : aucun renforcement automatique
      status = 'insufficient_data';
      recommendationTitle = isAr ? 'نتائج متناقضة' : 'Résultats contradictoires';
      clinicalRationale = isAr
        ? `ارتفاعات (${hyperCount}) وهبوط (${hypoCount}) في نفس الفترة : لا يُقترح أي تعزيز. ناقش التقلبات مع طبيبك.`
        : `Hyperglycémies (${hyperCount}) et hypoglycémie (${hypoCount}) sur la même période : aucun renforcement proposé. Variabilité à discuter avec votre diabétologue.`;
    } else if (hyperPct >= 50) {
      // Règle 2 : hyperglycémies répétées, renforcement plafonné à +10 % d'insuline
      status = 'increase_insulin';
      clinicalAlerts++;
      suggestedRatio = Math.max(2, Math.round((currentRatio / (1 + MAX_INSULIN_INCREASE)) * 10) / 10);
      recommendationTitle = isAr ? '📈 ميل لارتفاع السكر بعد الأكل' : '📈 Tendance à l’hyperglycémie post-prandiale';
      clinicalRationale = isAr
        ? `${hyperPct}% من القياسات بعد ساعتين تتجاوز الهدف (${hyperCount}/${countPP}، المتوسط ${avgPP ?? '—'} ${userProfile.glucoseUnit}). تحقق أولاً من حساب الكربوهيدرات وتوقيت الحقن. يمكن مناقشة معامل 1 وحدة لكل ${suggestedRatio}غ (+10% كحد أقصى).`
        : `${hyperPct}% des contrôles à +2h dépassent l'objectif (${hyperCount}/${countPP}, moyenne ${avgPP ?? '—'} ${userProfile.glucoseUnit}). Vérifiez d'abord le comptage des glucides et l'horaire de l'injection. Piste : 1 UI pour ${suggestedRatio} g de glucides (+10 % d'insuline au maximum).`;
      if (safeProfile.isHoneymoonPhase) {
        recommendationTitle = isAr ? '📈 تراجع الهدأة (نهاية مرحلة شهر العسل؟)' : '📈 Déclin de rémission (Fin de lune de miel ?)';
        clinicalRationale = isAr
          ? `في مرحلة شهر العسل، يشير تسجيل ${hyperPct}% من الارتفاعات بعد الأكل (${hyperCount}/${countPP}) إلى تراجع الإفراز البنكرياسي المتبقي. ناقش المعايرة مع طبيبك (1 وحدة لكل ${suggestedRatio}غ كحد أقصى).`
          : `En phase de lune de miel, ${hyperPct}% de contrôles post-prandiaux élevés (${hyperCount}/${countPP}) signalent souvent un déclin de la sécrétion résiduelle. Titration à programmer avec votre diabétologue (au plus 1 UI pour ${suggestedRatio} g).`;
      }
    } else {
      // Règle 3 : ratio dans la cible
      status = 'optimal';
      recommendationTitle = isAr ? '🎯 معامل مناسب' : '🎯 Ratio adapté';
      clinicalRationale = isAr
        ? `${targetPct}% من قياسات السكر بعد الأكل في النطاق المستهدف (المتوسط: ${avgPP ?? '—'} ${userProfile.glucoseUnit}). الاستمرار بالمعامل الحالي: 1 وحدة / ${currentRatio}غ.`
        : `${targetPct}% des glycémies post-prandiales sont dans la cible (moyenne : ${avgPP ?? '—'} ${userProfile.glucoseUnit}). Maintenir le ratio actuel de 1 UI / ${currentRatio} g.`;
    }

    if (status === 'increase_insulin' || status === 'decrease_insulin') {
      clinicalRationale += isAr
        ? ' ⚕️ اقتراح يجب أن يصادق عليه طبيبك قبل أي تعديل.'
        : ' ⚕️ Proposition à valider avec votre diabétologue avant toute modification.';
    }

    slotsResult[slot] = {
      slot,
      slotLabel: slotLabels[slot],
      mealCount: slotMeals.length,
      totalRecordedPostPrandial: countPP,
      evaluations: {
        target: targetCount,
        hyper: hyperCount,
        hypo: hypoCount,
      },
      targetPercentage: targetPct,
      hyperPercentage: hyperPct,
      hypoPercentage: hypoPct,
      currentRatio,
      suggestedRatio,
      status,
      recommendationTitle,
      clinicalRationale,
      confidenceLevel: confidence,
      averagePostPrandial: avgPP,
    };
  });

  const globalTIR = totalWithPP > 0 ? Math.round((totalTarget / totalWithPP) * 100) : 0;

  // Détection clinique globale spécifique à la phase de lune de miel
  let honeymoonInsight: HoneymoonInsight | undefined;
  if (safeProfile.isHoneymoonPhase) {
    let totalHypoCount = 0;
    let totalHyperCount = 0;
    Object.values(slotsResult).forEach((slot) => {
      if (slot) {
        totalHypoCount += slot.evaluations.hypo;
        totalHyperCount += slot.evaluations.hyper;
      }
    });

    const hypoRate = totalWithPP > 0 ? (totalHypoCount / totalWithPP) * 100 : 0;
    const hyperRate = totalWithPP > 0 ? (totalHyperCount / totalWithPP) * 100 : 0;

    if (totalWithPP >= 3 && hyperRate >= 40) {
      honeymoonInsight = {
        isHoneymoon: true,
        status: 'waning_phase',
        title: isAr ? 'مؤشرات الانحسار التدريجي لشهر العسل' : 'Signes de fin progressive de la lune de miel',
        message: isAr
          ? `${Math.round(hyperRate)}% من قياسات بعد الأكل تتجاوز الهدف. يبدو أن الإفراز الداخلي للإنسولين ينخفض، مما يستدعي إعادة تقييم المعاملات مع طبيبك.`
          : `${Math.round(hyperRate)}% des contrôles post-prandiaux dépassent l'objectif. La sécrétion endogène d'insuline diminue probablement, nécessitant une ré-évaluation des ratios avec votre diabétologue.`,
      };
      if (!priorityAlertMessage) {
        priorityAlertMessage = isAr
          ? 'اشتباه سريري بقرب نهاية شهر العسل: لوحظت زيادة تدريجية في احتياجات الإنسولين.'
          : 'Suspicion clinique de fin de lune de miel : augmentation progressive des besoins en insuline observée.';
      }
    } else if (hypoRate >= 15 || totalHypoCount >= 2) {
      honeymoonInsight = {
        isHoneymoon: true,
        status: 'hypo_risk',
        title: isAr ? 'يقظة من هبوط السكر خلال مرحلة الهدأة' : 'Vigilance hypoglycémie en phase de rémission',
        message: isAr
          ? `تم تسجيل ${totalHypoCount} نوبة هبوط سكر. الإفراز البنكرياسي المتبقي يحمي ولكن يجعل الجرعات قوية جداً. خفف معاملات الوجبات.`
          : `${totalHypoCount} épisode(s) d'hypoglycémie enregistrés. La production résiduelle d'insuline protège mais rend les bolus trop puissants. Allégez vos ratios repas.`,
      };
    } else {
      honeymoonInsight = {
        isHoneymoon: true,
        status: 'active_stable',
        title: isAr ? 'مرحلة شهر العسل نشطة ومستقرة' : 'Lune de miel active et équilibrée',
        message: isAr
          ? 'مستويات السكر بعد الأكل مستقرة بجرعات معتدلة، مما يعكس تآزراً ممتازاً بين الإفراز البنكرياسي المتبقي والعلاج بالإنسولين.'
          : 'Vos glycémies post-prandiales sont stables avec des doses modérées, témoignant d\'une bonne coopération entre sécrétion endogène résiduelle et insulinothérapie.',
      };
    }
  }

  return {
    slots: slotsResult as Record<MealSlot, SlotTitrationAnalysis>,
    totalAnalyzedMeals: meals.length,
    totalPostPrandials: totalWithPP,
    globalTimeInRangePercent: globalTIR,
    priorityAlert: priorityAlertMessage,
    clinicalRecommendationCount: clinicalAlerts,
    honeymoonInsight,
  };
}
