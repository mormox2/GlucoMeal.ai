import { AnalyzedMeal, UserProfileDT1, MealSlot } from '../types';

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

export interface GlobalTitrationReport {
  slots: Record<MealSlot, SlotTitrationAnalysis>;
  totalAnalyzedMeals: number;
  totalPostPrandials: number;
  globalTimeInRangePercent: number;
  priorityAlert: string | null;
  clinicalRecommendationCount: number;
}

/**
 * Détermine le créneau repas à partir d'un timestamp ou de l'analyse
 */
export function getMealSlotFromMeal(meal: AnalyzedMeal): MealSlot {
  if (meal.bolus_calculated?.slot) {
    return meal.bolus_calculated.slot;
  }
  const date = meal.timestamp ? new Date(meal.timestamp) : new Date(meal.created_at || Date.now());
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  return 'dinner';
}

/**
 * Moteur d'auto-titration algorithmique DT1 basé sur les recommandations SFD / ADA / ATTD
 */
export function analyzePatientTitration(
  meals: AnalyzedMeal[],
  userProfile: UserProfileDT1
): GlobalTitrationReport {
  const slotLabels: Record<MealSlot, string> = {
    morning: 'Petit-déjeuner (Matin)',
    lunch: 'Déjeuner (Midi)',
    dinner: 'Dîner (Soir)',
    snack: 'Collation / Goûter',
    iftar: 'Iftar (Rupture du Jeûne)',
    sahriya: 'Sahriya (Soirée)',
    shor: "Shor (Repas de l'Aube)",
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
    const slotMeals = slotsMap[slot];
    const mealsWithPP = slotMeals.filter((m) => m.post_prandial_glucose !== undefined || m.post_prandial_evaluation);
    const countPP = mealsWithPP.length;
    totalWithPP += countPP;

    let targetCount = 0;
    let hyperCount = 0;
    let hypoCount = 0;
    let glucoseSum = 0;

    mealsWithPP.forEach((m) => {
      if (m.post_prandial_glucose) {
        glucoseSum += m.post_prandial_glucose;
      }
      if (m.post_prandial_evaluation === 'target') targetCount++;
      else if (m.post_prandial_evaluation === 'hyper') hyperCount++;
      else if (m.post_prandial_evaluation === 'hypo') hypoCount++;
      else if (m.post_prandial_glucose) {
        // Déduction si évaluation manquante (seuil g/L vs mg/dL)
        const isMgDl = userProfile.glucoseUnit === 'mg/dL';
        const val = m.post_prandial_glucose;
        const low = isMgDl ? 70 : 0.7;
        const high = isMgDl ? 180 : 1.8;
        if (val < low) hypoCount++;
        else if (val > high) hyperCount++;
        else targetCount++;
      }
    });

    totalTarget += targetCount;
    const avgPP = countPP > 0 && glucoseSum > 0 ? Math.round((glucoseSum / countPP) * 100) / 100 : null;

    const targetPct = countPP > 0 ? Math.round((targetCount / countPP) * 100) : 0;
    const hyperPct = countPP > 0 ? Math.round((hyperCount / countPP) * 100) : 0;
    const hypoPct = countPP > 0 ? Math.round((hypoCount / countPP) * 100) : 0;

    const currentRatio = userProfile.icRatios[slot] || 10;
    let suggestedRatio = currentRatio;
    let status: SlotTitrationAnalysis['status'] = 'optimal';
    let recommendationTitle = 'Ratio équilibré';
    let clinicalRationale = 'Les glycémies post-prandiales à 2h sont stables et conformes aux cibles thérapeutiques.';
    let confidence: SlotTitrationAnalysis['confidenceLevel'] = 'low';

    if (countPP < 2) {
      status = 'insufficient_data';
      recommendationTitle = 'Données insuffisantes';
      clinicalRationale = `Enregistrez au moins 2 à 3 contrôles post-prandiaux (+2h) sur ce créneau pour activer l'analyse prédictive d'auto-titration.`;
      confidence = 'low';
    } else {
      confidence = countPP >= 5 ? 'high' : 'moderate';

      // Règle 1 : Risque Hypoglycémie (Priorité absolue de sécurité médicale)
      if (hypoPct >= 20 || hypoCount >= 2) {
        status = 'decrease_insulin';
        clinicalAlerts++;
        // Diminuer l'insuline = 1 UI couvre PLUS de grammes de glucides (+15%)
        suggestedRatio = Math.round((currentRatio * 1.15) * 10) / 10;
        recommendationTitle = '⚠️ Risque d’hypoglycémie (+2h)';
        clinicalRationale = `Sur ${countPP} contrôles de ce créneau, ${hypoCount} épisode(s) d'hypoglycémie ont été constatés (${hypoPct}%). Sécurité clinique : il est recommandé d'alléger le bolus en passant de 1 UI pour ${currentRatio}g à 1 UI pour ${suggestedRatio}g de glucides (-15% d'insuline).`;
        if (!priorityAlertMessage) {
          priorityAlertMessage = `Hypoglycémies répétées détectées sur le créneau du ${slotLabels[slot].toLowerCase()}. Titration recommandée en priorité.`;
        }
      }
      // Règle 2 : Hyperglycémie répétée (> 50% des repas)
      else if (hyperPct >= 50) {
        status = 'increase_insulin';
        clinicalAlerts++;
        // Renforcer l'insuline = 1 UI couvre MOINS de grammes de glucides (-12 à -15%)
        suggestedRatio = Math.max(3, Math.round((currentRatio * 0.86) * 10) / 10);
        recommendationTitle = '📈 Tendance à l’hyperglycémie post-prandiale';
        clinicalRationale = `${hyperPct}% des contrôles à +2h dépassent l'objectif (${hyperCount}/${countPP} repas avec moyenne ${avgPP || ''} ${userProfile.glucoseUnit}). Le bolus actuel sous-estime la charge glucidique. Recommandation : renforcer le ratio à 1 UI pour ${suggestedRatio}g de glucides (augmentation prudente de ~15% de l'insuline repas).`;
      }
      // Règle 3 : Ratio dans la cible
      else {
        status = 'optimal';
        recommendationTitle = '🎯 Ratio optimal validé';
        clinicalRationale = `${targetPct}% des glycémies post-prandiales sont parfaitement dans la cible (moyenne : ${avgPP || '—'} ${userProfile.glucoseUnit}). Maintenir le ratio actuel de 1 UI / ${currentRatio}g.`;
      }
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

  return {
    slots: slotsResult as Record<MealSlot, SlotTitrationAnalysis>,
    totalAnalyzedMeals: meals.length,
    totalPostPrandials: totalWithPP,
    globalTimeInRangePercent: globalTIR,
    priorityAlert: priorityAlertMessage,
    clinicalRecommendationCount: clinicalAlerts,
  };
}
