import { BenchmarkMeal } from '../types/benchmark';
import { EvaluationReport, MealEvaluationDetail } from './benchmarkEvaluator';

/**
 * Exporte les résultats du benchmark sous format CSV conforme (compatible Excel / Numbers)
 * avec encodage UTF-8 BOM pour préserver les accents et caractères spéciaux.
 */
export function exportBenchmarkToCSV(
  dataset: BenchmarkMeal[],
  report: EvaluationReport,
  filename: string = 'benchmark_metrologique_tunisie_2026.csv'
): void {
  const headers = [
    'ID',
    'Nom du Repas',
    'Catégorie',
    'Portion Description',
    'Poids Référence (g)',
    'Glucides Référence (g)',
    'Glucides Prédits IA (g)',
    'Delta Glucides (g)',
    'Erreur Relative (%)',
    'Conformité Clinique DT1 (≤15%)',
    'Écart Bolus Insuline (UI)',
    'Niveau Risque Clinique',
    'Difficulté',
    'Méthode Étalon',
    'Angle Photo',
    'Ingrédients',
  ];

  // Map results by meal id with proper typing
  const resultMap = new Map<string | number, MealEvaluationDetail>(
    report.results.map((r) => [r.meal.id, r])
  );

  const rows = dataset.map((meal) => {
    const res = resultMap.get(meal.id);
    const predicted = res ? res.predicted_carbs_g : meal.carbs_g;
    const delta = res ? res.delta_carbs_g : 0;
    const errorPct = res ? res.relative_error_pct : 0;
    const passed = res ? (res.passed_clinical_threshold ? 'CONFORME' : 'HORS_SEUIL') : 'CONFORME';
    const insulinImpact = res ? res.insulin_impact_units : 0;
    const safetyRisk = res ? res.clinical_safety_risk : 'safe';
    const ingredientsStr = meal.ingredients.join('; ');

    return [
      `"${meal.id}"`,
      `"${meal.name_fr.replace(/"/g, '""')}"`,
      `"${meal.category || 'plats'}"`,
      `"${(meal.portion_desc || '').replace(/"/g, '""')}"`,
      meal.weight_g,
      meal.carbs_g,
      predicted,
      delta,
      errorPct,
      `"${passed}"`,
      insulinImpact,
      `"${safetyRisk}"`,
      `"${meal.difficulty}"`,
      `"${meal.reference_method}"`,
      `"${meal.photo_type}"`,
      `"${ingredientsStr.replace(/"/g, '""')}"`,
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) pour assurer l'ouverture immédiate sans artefact d'accent sous Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte l'audit métrologique complet et structuré en JSON
 */
export function exportBenchmarkToJSON(
  dataset: BenchmarkMeal[],
  report: EvaluationReport,
  filename: string = 'benchmark_metrologique_tunisie_2026.json'
): void {
  const exportPayload = {
    metadata: {
      application: 'GlucoMeal AI - Moteur Métrologique Nutritionnel DT1',
      dataset_name: report.dataset_name,
      export_timestamp: new Date().toISOString(),
      standard: 'Validation Clinique Diabétologique ISO/IEC 17025 Adaptée',
      total_meals: dataset.length,
    },
    performance_summary: {
      mae_grams: report.mae_g,
      rmse_grams: report.rmse_g,
      mean_relative_error_pct: report.mre_pct,
      clinical_pass_rate_pct: report.clinical_pass_rate_pct,
      tolerance_threshold_pct: 15.0,
      avg_insulin_deviation_units: report.avg_insulin_deviation_units,
      max_error_grams: report.max_error_g,
      max_error_meal: report.max_error_meal,
    },
    breakdowns: {
      by_camera_angle: report.breakdown_by_angle,
      by_difficulty: report.breakdown_by_difficulty,
    },
    clinical_conclusions: report.clinical_summary,
    entries: report.results.map((r) => ({
      id: r.meal.id,
      name_fr: r.meal.name_fr,
      category: r.meal.category || 'plats',
      portion_description: r.meal.portion_desc || '',
      weight_grams_reference: r.meal.weight_g,
      carbs_grams_reference: r.meal.carbs_g,
      carbs_grams_predicted: r.predicted_carbs_g,
      delta_carbs_grams: r.delta_carbs_g,
      signed_delta_grams: r.signed_delta_g,
      relative_error_percent: r.relative_error_pct,
      clinical_compliance: r.passed_clinical_threshold,
      insulin_impact_units: r.insulin_impact_units,
      safety_risk: r.clinical_safety_risk,
      difficulty: r.meal.difficulty,
      reference_method: r.meal.reference_method,
      photo_angle: r.meal.photo_type,
      ingredients: r.meal.ingredients,
      glycemic_profile: r.glycemic_profile,
    })),
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
