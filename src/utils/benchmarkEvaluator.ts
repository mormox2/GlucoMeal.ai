import { BenchmarkMeal, TUNISIAN_DATASET } from '../types/benchmark';

export interface MealEvaluationDetail {
  meal: BenchmarkMeal;
  predicted_carbs_g: number;
  delta_carbs_g: number; // Valeur absolue en grammes
  signed_delta_g: number; // Différence signée (prédit - réel)
  relative_error_pct: number; // Pourcentage d'erreur relatif
  passed_clinical_threshold: boolean; // <= 15% (seuil médical Diabète T1)
  insulin_impact_units: number; // Écart en unités d'insuline rapide (ratio 1 UI / 10g)
  clinical_safety_risk: 'safe' | 'acceptable' | 'clinical_risk'; // <=10%, 10-15%, >15%
  photo_angle_label: string;
  optical_challenge_notes: string;
  glycemic_profile: {
    gi_level: 'low' | 'medium' | 'high';
    absorption_speed: string;
    t1d_warning: string;
  };
}

export interface AngleBreakdown {
  photo_type: 'top' | 'side' | 'macro';
  label: string;
  count: number;
  mae_g: number;
  mre_pct: number;
  pass_rate_pct: number;
}

export interface DifficultyBreakdown {
  difficulty: 'easy' | 'medium' | 'hard';
  label: string;
  count: number;
  mae_g: number;
  mre_pct: number;
  pass_rate_pct: number;
}

export interface EvaluationReport {
  dataset_name: string;
  timestamp: string;
  total_meals: number; // Repas évalués (ayant une prédiction réelle)
  dataset_size: number; // Taille du jeu de données
  not_evaluated_count: number; // Repas sans prédiction réelle (non comptés dans les métriques)
  passed_count: number;
  clinical_pass_rate_pct: number; // Target >= 85% with error <= 15%
  mae_g: number; // Mean Absolute Error en grammes
  rmse_g: number; // Root Mean Square Error
  mre_pct: number; // Mean Relative Error en %
  max_error_g: number;
  max_error_meal: string;
  avg_insulin_deviation_units: number;
  results: MealEvaluationDetail[];
  breakdown_by_angle: AngleBreakdown[];
  breakdown_by_difficulty: DifficultyBreakdown[];
  clinical_summary: string;
}

// Spécificités cliniques diabétologiques par plat
const CLINICAL_PROFILES: Record<
  string,
  {
    gi_level: 'low' | 'medium' | 'high';
    absorption_speed: string;
    t1d_warning: string;
    optical_challenge: string;
  }
> = {
  Couscous: {
    gi_level: 'medium',
    absorption_speed: 'Modérée (présence de fibres des légumes et protéines de viande)',
    t1d_warning: 'Volume dense en semoule : un sous-comptage de 15g peut causer une hyperglycémie postprandiale 2h après.',
    optical_challenge: 'Vue latérale (side à 45°) essentielle pour estimer la hauteur de la pyramide de semoule.',
  },
  Lablabi: {
    gi_level: 'medium',
    absorption_speed: 'Lente à modérée (pois chiches riches en fibres et lipides de l\'huile d\'olive)',
    t1d_warning: 'Cas critique Diabète T1 : le pain rassis est immergé sous le bouillon. Une caméra seule sous-estime souvent les glucides.',
    optical_challenge: 'Vue zénithale (top à 90°) : surface liquide masquant la masse de pain au fond du bol.',
  },
  'Ojja Merguez': {
    gi_level: 'low',
    absorption_speed: 'Lente et étalée (matières grasses importantes des merguez retardant la vidange gastrique)',
    t1d_warning: 'Gare aux lipides : pic glycémique souvent retardé à 3h-4h. Nécessite bolus duo/carré pour pompe.',
    optical_challenge: 'Vue latérale (side à 45°) : distinction du pain Tabouna mangé en accompagnement vs sauce.',
  },
  Bambalouni: {
    gi_level: 'high',
    absorption_speed: 'Très rapide (pâte blanche frite + sucre de couverture pur à fort index glycémique)',
    t1d_warning: 'Pic glycémique violent dès 30 minutes. Bolus à injecter au moins 15-20 minutes avant consommation.',
    optical_challenge: 'Vue macro : calibrage de la taille du beignet et détection de la couche de cristaux de sucre.',
  },
  'Ojja Tunisienne': {
    gi_level: 'medium',
    absorption_speed: 'Rapide à modérée (dépend quasi-exclusivement du pain baguette consommé avec la sauce)',
    t1d_warning: 'La sauce tomate et œufs n\'apportent que 6-8g de glucides. 80% des glucides viennent du pain baguette d\'accompagnement.',
    optical_challenge: 'Vue zénithale (top) : calcul précis de la surface de l\'assiette et détection des morceaux de baguette.',
  },
};

/**
 * Évalue une prédiction RÉELLE (issue du pipeline d'analyse) face à la référence d'un repas.
 * Aucune prédiction n'est jamais simulée à partir de la valeur de référence.
 */
export function evaluateBenchmarkMeal(meal: BenchmarkMeal, predictedCarbs: number): MealEvaluationDetail {
  if (typeof predictedCarbs !== 'number' || !Number.isFinite(predictedCarbs) || predictedCarbs < 0) {
    throw new Error(`Prédiction invalide pour le repas ${meal.id}.`);
  }
  const predicted = Math.round(predictedCarbs);

  const signedDelta = predicted - meal.carbs_g;
  const absDelta = Math.abs(signedDelta);
  const relativeErrorPct = Number(((absDelta / meal.carbs_g) * 100).toFixed(1));
  const passed = relativeErrorPct <= 15.0; // Seuil clinique diabétologique (15%)

  // Risque clinique (estimation insuline standard : 1 UI pour 10g de glucides)
  const insulinImpact = Number((absDelta / 10).toFixed(1));
  let safetyRisk: 'safe' | 'acceptable' | 'clinical_risk' = 'safe';
  if (relativeErrorPct > 15) {
    safetyRisk = 'clinical_risk';
  } else if (relativeErrorPct > 10) {
    safetyRisk = 'acceptable';
  }

  const profile = CLINICAL_PROFILES[meal.name_fr] || {
    gi_level: 'medium',
    absorption_speed: 'Modérée',
    t1d_warning: 'Surveiller la glycémie 2h après le repas.',
    optical_challenge: `Angle ${meal.photo_type} utilisé pour l'évaluation.`,
  };

  const angleLabels: Record<string, string> = {
    top: 'Vue zénithale 90° (du dessus)',
    side: 'Vue latérale 45° (perspective relief)',
    macro: 'Vue macro gros plan (texture/sucre)',
  };

  return {
    meal,
    predicted_carbs_g: predicted,
    delta_carbs_g: absDelta,
    signed_delta_g: signedDelta,
    relative_error_pct: relativeErrorPct,
    passed_clinical_threshold: passed,
    insulin_impact_units: insulinImpact,
    clinical_safety_risk: safetyRisk,
    photo_angle_label: angleLabels[meal.photo_type] || meal.photo_type,
    optical_challenge_notes: profile.optical_challenge,
    glycemic_profile: {
      gi_level: profile.gi_level,
      absorption_speed: profile.absorption_speed,
      t1d_warning: profile.t1d_warning,
    },
  };
}

/**
 * Évaluation globale d'une collection de repas du benchmark
 */
export function runAutomatedBenchmark(
  dataset: BenchmarkMeal[] = TUNISIAN_DATASET,
  predictions: Record<string | number, number> = {}
): EvaluationReport {
  // Seuls les repas ayant une prédiction réelle sont évalués
  const results = dataset
    .filter((meal) => typeof predictions[meal.id] === 'number' && Number.isFinite(predictions[meal.id]))
    .map((meal) => evaluateBenchmarkMeal(meal, predictions[meal.id]));

  const total = results.length;
  const passed = results.filter((r) => r.passed_clinical_threshold).length;
  const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0;

  // Calcul du MAE (Mean Absolute Error)
  const sumAbsError = results.reduce((acc, r) => acc + r.delta_carbs_g, 0);
  const mae = total > 0 ? Number((sumAbsError / total).toFixed(2)) : 0;

  // Calcul du RMSE (Root Mean Square Error)
  const sumSquaredError = results.reduce((acc, r) => acc + Math.pow(r.delta_carbs_g, 2), 0);
  const rmse = total > 0 ? Number(Math.sqrt(sumSquaredError / total).toFixed(2)) : 0;

  // Calcul du MRE (Mean Relative Error)
  const sumRelativeError = results.reduce((acc, r) => acc + r.relative_error_pct, 0);
  const mre = total > 0 ? Number((sumRelativeError / total).toFixed(1)) : 0;

  // Pire erreur
  let maxError = 0;
  let maxErrorMeal = 'Aucun';
  results.forEach((r) => {
    if (r.delta_carbs_g > maxError) {
      maxError = r.delta_carbs_g;
      maxErrorMeal = r.meal.name_fr;
    }
  });

  // Écart moyen d'insuline
  const avgInsulin = Number((mae / 10).toFixed(2));

  // Breakdown par angle
  const angleMap: Record<'top' | 'side' | 'macro', MealEvaluationDetail[]> = {
    top: [],
    side: [],
    macro: [],
  };
  results.forEach((r) => {
    if (angleMap[r.meal.photo_type]) {
      angleMap[r.meal.photo_type].push(r);
    }
  });

  const breakdownByAngle: AngleBreakdown[] = (['top', 'side', 'macro'] as const).map((angle) => {
    const list = angleMap[angle];
    const cnt = list.length;
    if (cnt === 0) {
      return {
        photo_type: angle,
        label: angle === 'top' ? 'Zénithale (top)' : angle === 'side' ? 'Latérale (side)' : 'Macro (macro)',
        count: 0,
        mae_g: 0,
        mre_pct: 0,
        pass_rate_pct: 0,
      };
    }
    const angleMae = Number((list.reduce((acc, it) => acc + it.delta_carbs_g, 0) / cnt).toFixed(2));
    const angleMre = Number((list.reduce((acc, it) => acc + it.relative_error_pct, 0) / cnt).toFixed(1));
    const anglePass = Number(((list.filter((it) => it.passed_clinical_threshold).length / cnt) * 100).toFixed(1));
    const label = angle === 'top' ? 'Zénithale 90° (top)' : angle === 'side' ? 'Latérale 45° (side)' : 'Macro gros plan (macro)';

    return {
      photo_type: angle,
      label,
      count: cnt,
      mae_g: angleMae,
      mre_pct: angleMre,
      pass_rate_pct: anglePass,
    };
  });

  // Breakdown par difficulté
  const diffMap: Record<'easy' | 'medium' | 'hard', MealEvaluationDetail[]> = {
    easy: [],
    medium: [],
    hard: [],
  };
  results.forEach((r) => {
    if (diffMap[r.meal.difficulty]) {
      diffMap[r.meal.difficulty].push(r);
    }
  });

  const breakdownByDifficulty: DifficultyBreakdown[] = (['easy', 'medium', 'hard'] as const).map(
    (diff) => {
      const list = diffMap[diff];
      const cnt = list.length;
      if (cnt === 0) {
        return {
          difficulty: diff,
          label: diff,
          count: 0,
          mae_g: 0,
          mre_pct: 0,
          pass_rate_pct: 0,
        };
      }
      const diffMae = Number((list.reduce((acc, it) => acc + it.delta_carbs_g, 0) / cnt).toFixed(2));
      const diffMre = Number((list.reduce((acc, it) => acc + it.relative_error_pct, 0) / cnt).toFixed(1));
      const diffPass = Number(((list.filter((it) => it.passed_clinical_threshold).length / cnt) * 100).toFixed(1));
      const label = diff === 'easy' ? 'Facile (easy)' : diff === 'medium' ? 'Moyen (medium)' : 'Complexe (hard)';

      return {
        difficulty: diff,
        label,
        count: cnt,
        mae_g: diffMae,
        mre_pct: diffMre,
        pass_rate_pct: diffPass,
      };
    }
  );

  const clinicalSummary =
    total === 0
      ? `Aucune prédiction réelle : lancez des tests de vision sur des photos des repas de référence pour obtenir des métriques.`
      : `${total} repas évalué(s) sur ${dataset.length} : ${passRate}% dans la marge de ±15%, erreur absolue moyenne ${mae} g (≈ ${avgInsulin} UI au ratio 1 UI / 10 g). Résultats indicatifs d'un banc de test interne, sans valeur de validation clinique.${
          total < 30 ? ' Échantillon trop petit pour conclure.' : ''
        }`;

  return {
    dataset_name: 'Dataset Tunisien de Référence (Étape 2)',
    timestamp: new Date().toISOString(),
    total_meals: total,
    dataset_size: dataset.length,
    not_evaluated_count: dataset.length - total,
    passed_count: passed,
    clinical_pass_rate_pct: passRate,
    mae_g: mae,
    rmse_g: rmse,
    mre_pct: mre,
    max_error_g: maxError,
    max_error_meal: maxErrorMeal,
    avg_insulin_deviation_units: avgInsulin,
    results,
    breakdown_by_angle: breakdownByAngle,
    breakdown_by_difficulty: breakdownByDifficulty,
    clinical_summary: clinicalSummary,
  };
}
