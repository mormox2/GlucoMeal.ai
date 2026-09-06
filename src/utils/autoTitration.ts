import { AnalyzedMeal, UserProfileDT1, MealSlot } from '../types';
import { sanitizeUserProfile } from './storage';

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
  userProfile: UserProfileDT1,
  language: 'fr' | 'ar' = 'fr'
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
        const isMgDl = safeProfile.glucoseUnit === 'mg/dL';
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

    const currentRatio = safeProfile.icRatios[slot] || 10;
    let suggestedRatio = currentRatio;
    let status: SlotTitrationAnalysis['status'] = 'optimal';
    let recommendationTitle = isAr ? 'معامل متوازن' : 'Ratio équilibré';
    let clinicalRationale = isAr
      ? 'مستويات السكر بعد الأكل بساعتين مستقرة ومطابقة تماماً للأهداف العلاجية المحددة.'
      : 'Les glycémies post-prandiales à 2h sont stables et conformes aux cibles thérapeutiques.';
    let confidence: SlotTitrationAnalysis['confidenceLevel'] = 'low';

    if (countPP < 2) {
      status = 'insufficient_data';
      recommendationTitle = isAr ? 'بيانات غير كافية' : 'Données insuffisantes';
      clinicalRationale = isAr
        ? 'سجل ما لا يقل عن قياسين أو ثلاثة (+2س بعد الأكل) في هذه الفترة لتفعيل التحليل التنبؤي للمعايرة الذكية.'
        : `Enregistrez au moins 2 à 3 contrôles post-prandiaux (+2h) sur ce créneau pour activer l'analyse prédictive d'auto-titration.`;
      confidence = 'low';
    } else {
      confidence = countPP >= 5 ? 'high' : 'moderate';

      // Règle 1 : Risque Hypoglycémie (Priorité absolue de sécurité médicale)
      if (hypoPct >= 20 || hypoCount >= 2) {
        status = 'decrease_insulin';
        clinicalAlerts++;
        // Diminuer l'insuline = 1 UI couvre PLUS de grammes de glucides (+15%)
        suggestedRatio = Math.round((currentRatio * 1.15) * 10) / 10;
        recommendationTitle = isAr ? '⚠️ خطر هبوط السكر (+2س)' : '⚠️ Risque d’hypoglycémie (+2h)';
        clinicalRationale = isAr
          ? `من بين ${countPP} قياسات في هذه الفترة، لوحظت ${hypoCount} نوبة هبوط سكر (${hypoPct}%). للسلامة الطبية: يُنصح بتخفيف الجرعة بزيادة المعامل من 1 وحدة لكل ${currentRatio}غ إلى 1 وحدة لكل ${suggestedRatio}غ كربوهيدرات (-15% إنسولين).`
          : `Sur ${countPP} contrôles de ce créneau, ${hypoCount} épisode(s) d'hypoglycémie ont été constatés (${hypoPct}%). Sécurité clinique : il est recommandé d'alléger le bolus en passant de 1 UI pour ${currentRatio}g à 1 UI pour ${suggestedRatio}g de glucides (-15% d'insuline).`;
        if (safeProfile.isHoneymoonPhase) {
          clinicalRationale = isAr
            ? `🍯 أمان مرحلة شهر العسل: من بين ${countPP} قياسات، تم تسجيل ${hypoCount} نوبة هبوط سكر (${hypoPct}%). الإفراز الداخلي المتبقي يضاعف مفعول الإنسولين. من الضروري تخفيف الجرعة بالانتقال إلى 1 وحدة لكل ${suggestedRatio}غ كربوهيدرات (-15% إنسولين).`
            : `🍯 Sécurité Lune de Miel : Sur ${countPP} contrôles, ${hypoCount} épisode(s) d'hypoglycémie constatés (${hypoPct}%). La sécrétion résiduelle amplifie l'effet de l'insuline. Il est impératif d'alléger le bolus en passant à 1 UI pour ${suggestedRatio}g de glucides (-15% d'insuline).`;
        }
        if (!priorityAlertMessage) {
          priorityAlertMessage = isAr
            ? `تم رصد هبوط سكر متكرر في فترة ${slotLabels[slot]}. يوصى بتعديل المعامل كأولوية قصوى.`
            : `Hypoglycémies répétées détectées sur le créneau du ${slotLabels[slot].toLowerCase()}. Titration recommandée en priorité.`;
        }
      }
      // Règle 2 : Hyperglycémie répétée (> 50% des repas)
      else if (hyperPct >= 50) {
        status = 'increase_insulin';
        clinicalAlerts++;
        // Renforcer l'insuline = 1 UI couvre MOINS de grammes de glucides (-12 à -15%)
        suggestedRatio = Math.max(3, Math.round((currentRatio * 0.86) * 10) / 10);
        recommendationTitle = isAr ? '📈 ميل لارتفاع السكر بعد الأكل' : '📈 Tendance à l’hyperglycémie post-prandiale';
        clinicalRationale = isAr
          ? `${hyperPct}% من القياسات بعد ساعتين تتجاوز الهدف (${hyperCount}/${countPP} وجبة بمتوسط ${avgPP || ''} ${userProfile.glucoseUnit}). الجرعة الحالية تقلل من تقدير كمية الكربوهيدرات. التوصية: تعزيز المعامل إلى 1 وحدة لكل ${suggestedRatio}غ كربوهيدرات (زيادة محسوبة بنحو 15% من إنسولين الوجبة).`
          : `${hyperPct}% des contrôles à +2h dépassent l'objectif (${hyperCount}/${countPP} repas avec moyenne ${avgPP || ''} ${userProfile.glucoseUnit}). Le bolus actuel sous-estime la charge glucidique. Recommandation : renforcer le ratio à 1 UI pour ${suggestedRatio}g de glucides (augmentation prudente de ~15% de l'insuline repas).`;
        if (safeProfile.isHoneymoonPhase) {
          recommendationTitle = isAr ? '📈 تراجع الهدأة (نهاية مرحلة شهر العسل؟)' : '📈 Déclin de rémission (Fin de lune de miel ?)';
          clinicalRationale = isAr
            ? `في مرحلة شهر العسل، يشير تسجيل ${hyperPct}% من الارتفاعات بعد الأكل (${hyperCount}/${countPP}) إلى التراجع الطبيعي للإفراز البنكرياسي المتبقي. احتياجات الإنسولين في تزايد. التوصية: تعديل المعامل إلى 1 وحدة لكل ${suggestedRatio}غ واستشارة طبيب السكري للمعايرة.`
            : `En phase de lune de miel, ${hyperPct}% de contrôles post-prandiaux élevés (${hyperCount}/${countPP}) signalent souvent un déclin naturel de la sécrétion pancréatique résiduelle. Les besoins en insuline augmentent. Recommandation : ajuster le ratio à 1 UI pour ${suggestedRatio}g et programmer une consultation de titration avec votre diabétologue.`;
        }
      }
      // Règle 3 : Ratio dans la cible
      else {
        status = 'optimal';
        recommendationTitle = isAr ? '🎯 معامل مثالي معتمد' : '🎯 Ratio optimal validé';
        clinicalRationale = isAr
          ? `${targetPct}% من قياسات السكر بعد الأكل في النطاق المستهدف بدقة (المتوسط: ${avgPP || '—'} ${userProfile.glucoseUnit}). الاستمرار بالمعامل الحالي: 1 وحدة / ${currentRatio}غ.`
          : `${targetPct}% des glycémies post-prandiales sont parfaitement dans la cible (moyenne : ${avgPP || '—'} ${userProfile.glucoseUnit}). Maintenir le ratio actuel de 1 UI / ${currentRatio}g.`;
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
