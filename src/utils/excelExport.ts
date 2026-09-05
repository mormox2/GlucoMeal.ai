import * as XLSX from 'xlsx';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { sanitizeUserProfile } from './storage';

/**
 * Exporte l'ensemble des données du patient dans un classeur Excel (.xlsx) complet multi-onglets
 */
export function exportToExcelWorkbook(
  meals: AnalyzedMeal[],
  profile: UserProfileDT1
): void {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // ONGLET 1 : JOURNAL DES REPAS & BOLUS
  // ==========================================
  const mealsRows = meals.map((m, idx) => {
    const mealDate = m.timestamp ? new Date(m.timestamp) : new Date(m.created_at || Date.now());
    const dateFormatted = mealDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = mealDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const componentsSummary = (m.items || [])
      .map((it) => `${it.name_fr} (${it.confirmed_weight_g || it.estimated_weight_g}g -> ${it.calculated_carbs}g glucides)`)
      .join(' ; ');

    const totalWeight = (m.items || []).reduce(
      (sum, it) => sum + (it.confirmed_weight_g || it.estimated_weight_g || 0),
      0
    );

    let evalText = 'Non mesuré';
    if (m.post_prandial_evaluation === 'target') evalText = 'Dans la Cible (0.70 - 1.80)';
    else if (m.post_prandial_evaluation === 'hyper') evalText = 'Hyperglycémie (> 1.80)';
    else if (m.post_prandial_evaluation === 'hypo') evalText = 'Hypoglycémie (< 0.70)';

    return {
      'N°': idx + 1,
      'Date': dateFormatted,
      'Heure': timeFormatted,
      'Créneau': m.bolus_calculated?.slot || 'Non défini',
      'Nom du Plat': m.meal_name,
      'Nom Arabe': m.meal_name_ar || '',
      'Glucides Réels (g)': m.total_carbs,
      'Poids Total (g)': totalWeight,
      'Index Glycémique': m.average_glycemic_index || '-',
      'Charge Glycémique': m.total_glycemic_load || '-',
      'Mode Saisie': m.input_type,
      'Ratio I:C Utilisé (g/UI)': m.bolus_calculated?.icRatio || '-',
      'Bolus Repas (UI)': m.bolus_calculated?.rawMealBolus || m.bolus_calculated?.mealBolus || '-',
      'Modulation Effort': m.bolus_calculated?.activityReductionPct
        ? `-${m.bolus_calculated.activityReductionPct}% (-${m.bolus_calculated.activityReductionUnits} UI)`
        : 'Aucune (Repos)',
      'Glycémie Pré-prandiale': m.bolus_calculated?.currentGlucose
        ? `${m.bolus_calculated.currentGlucose} ${profile.glucoseUnit}`
        : '-',
      'Bolus Correction (UI)': m.bolus_calculated?.correctionBolus || 0,
      'Bolus Total Injecté (UI)': m.bolus_calculated?.totalBolus || '-',
      'Glycémie H+2': m.post_prandial_glucose !== undefined
        ? `${m.post_prandial_glucose} ${profile.glucoseUnit}`
        : 'Non renseignée',
      'Évaluation H+2': evalText,
      'Détail des Ingrédients INNT': componentsSummary,
    };
  });

  const wsMeals = XLSX.utils.json_to_sheet(mealsRows);
  // Ajustement largeur des colonnes
  wsMeals['!cols'] = [
    { wch: 5 },  // N°
    { wch: 12 }, // Date
    { wch: 8 },  // Heure
    { wch: 12 }, // Créneau
    { wch: 32 }, // Nom plat
    { wch: 22 }, // Nom arabe
    { wch: 16 }, // Glucides
    { wch: 14 }, // Poids
    { wch: 16 }, // IG
    { wch: 16 }, // CG
    { wch: 12 }, // Saisie
    { wch: 20 }, // Ratio
    { wch: 16 }, // Bolus repas
    { wch: 22 }, // Modulation effort
    { wch: 20 }, // Pré-prandiale
    { wch: 18 }, // Correction
    { wch: 20 }, // Bolus total
    { wch: 16 }, // H+2
    { wch: 24 }, // Eval H+2
    { wch: 60 }, // Composants
  ];
  XLSX.utils.book_append_sheet(wb, wsMeals, 'Journal des Repas');

  // ==========================================
  // ONGLET 2 : SYNTHÈSE AGP & TÉLÉMÉDECINE
  // ==========================================
  const mealsWithH2 = meals.filter((m) => typeof m.post_prandial_glucose === 'number');
  const countTotal = meals.length;
  const countEvaluated = mealsWithH2.length;

  let tir = 0;
  let tar = 0;
  let tbr = 0;
  let meanGlucose = 0;
  let cv = 0;
  let gmi = 0;

  if (countEvaluated > 0) {
    const inTarget = mealsWithH2.filter((m) => {
      const g = m.post_prandial_glucose!;
      return profile.glucoseUnit === 'mg/dL' ? g >= 70 && g <= 180 : g >= 0.7 && g <= 1.8;
    }).length;
    const hyper = mealsWithH2.filter((m) => {
      const g = m.post_prandial_glucose!;
      return profile.glucoseUnit === 'mg/dL' ? g > 180 : g > 1.8;
    }).length;
    const hypo = mealsWithH2.filter((m) => {
      const g = m.post_prandial_glucose!;
      return profile.glucoseUnit === 'mg/dL' ? g < 70 : g < 0.7;
    }).length;

    tir = Math.round((inTarget / countEvaluated) * 100);
    tar = Math.round((hyper / countEvaluated) * 100);
    tbr = Math.round((hypo / countEvaluated) * 100);

    const valuesInMg = mealsWithH2.map((m) =>
      profile.glucoseUnit === 'g/L' ? m.post_prandial_glucose! * 100 : m.post_prandial_glucose!
    );
    const sum = valuesInMg.reduce((a, b) => a + b, 0);
    meanGlucose = sum / countEvaluated;

    const variance =
      valuesInMg.reduce((acc, v) => acc + Math.pow(v - meanGlucose, 2), 0) / countEvaluated;
    const stdDev = Math.sqrt(variance);
    cv = Math.round((stdDev / meanGlucose) * 100);

    // Formule GMI (HbA1c estimée consensus Bergenstal / ADA) : GMI (%) = 3.31 + (0.02392 * Moyenne_mg/dL)
    gmi = Number((3.31 + 0.02392 * meanGlucose).toFixed(1));
  }

  const agpSummaryRows = [
    { Indicateur: 'Patient', Valeur: profile.name, Cible_Clinique: 'Patient DT1 sous Insulinothérapie' },
    { Indicateur: 'Total Repas Enregistrés', Valeur: countTotal, Cible_Clinique: '-' },
    { Indicateur: 'Contrôles Post-Prandiaux H+2', Valeur: countEvaluated, Cible_Clinique: 'Idéalement 100% des repas' },
    {
      Indicateur: 'Temps dans la Cible (TIR 70-180 mg/dL)',
      Valeur: `${tir}%`,
      Cible_Clinique: '> 70% (Consensus SFD / ADA)',
    },
    {
      Indicateur: 'Temps au-dessus de la Cible (TAR > 180 mg/dL)',
      Valeur: `${tar}%`,
      Cible_Clinique: '< 25%',
    },
    {
      Indicateur: 'Temps en Hypoglycémie (TBR < 70 mg/dL)',
      Valeur: `${tbr}%`,
      Cible_Clinique: '< 4% (Urgence clinique)',
    },
    {
      Indicateur: 'Glycémie Post-Prandiale Moyenne',
      Valeur: `${(profile.glucoseUnit === 'g/L' ? meanGlucose / 100 : meanGlucose).toFixed(2)} ${profile.glucoseUnit}`,
      Cible_Clinique: '< 1.80 g/L (< 180 mg/dL)',
    },
    {
      Indicateur: 'HbA1c Estimée (GMI)',
      Valeur: gmi ? `${gmi}%` : 'N/D',
      Cible_Clinique: '< 7.0% chez l\'adulte DT1',
    },
    {
      Indicateur: 'Variabilité Glycémique (CV%)',
      Valeur: cv ? `${cv}%` : 'N/D',
      Cible_Clinique: '< 36% (Stabilité optimale)',
    },
  ];

  const wsAGP = XLSX.utils.json_to_sheet(agpSummaryRows);
  wsAGP['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsAGP, 'Synthèse AGP & Diabéto');

  // ==========================================
  // ONGLET 3 : PROFIL & RATIOS INSULINE:GLUCIDES
  // ==========================================
  const safeProfile = sanitizeUserProfile(profile);
  const profileRows = [
    { Paramètre: 'Nom du Patient', Valeur: safeProfile.name },
    { Paramètre: 'Unité Glycémique', Valeur: safeProfile.glucoseUnit },
    { Paramètre: 'Glycémie Cible', Valeur: `${safeProfile.targetGlucose} ${safeProfile.glucoseUnit}` },
    { Paramètre: 'Facteur de Sensibilité (ISF)', Valeur: `1 UI pour ${safeProfile.isf} ${safeProfile.glucoseUnit}` },
    { Paramètre: 'Pas d\'arrondi du stylo', Valeur: `${safeProfile.roundingStep} UI` },
    { Paramètre: 'Ratio Matin (Petit-déjeuner)', Valeur: `1 UI pour ${safeProfile.icRatios.morning} g de glucides` },
    { Paramètre: 'Ratio Midi (Déjeuner)', Valeur: `1 UI pour ${safeProfile.icRatios.lunch} g de glucides` },
    { Paramètre: 'Ratio Soir (Dîner)', Valeur: `1 UI pour ${safeProfile.icRatios.dinner} g de glucides` },
    { Paramètre: 'Ratio Collation (Goûter)', Valeur: `1 UI pour ${safeProfile.icRatios.snack} g de glucides` },
    { Paramètre: 'Mode Ramadan Actif', Valeur: safeProfile.ramadanMode ? 'OUI (Régime Jeûne)' : 'NON (Schéma Standard)' },
    { Paramètre: 'Ratio Iftar (Rupture Jeûne)', Valeur: `1 UI pour ${safeProfile.icRatios.iftar || 8} g` },
    { Paramètre: 'Ratio Sahriya (Soirée)', Valeur: `1 UI pour ${safeProfile.icRatios.sahriya || 9} g` },
    { Paramètre: 'Ratio Shor (Aube)', Valeur: `1 UI pour ${safeProfile.icRatios.shor || 12} g` },
  ];

  const wsProfile = XLSX.utils.json_to_sheet(profileRows);
  wsProfile['!cols'] = [{ wch: 32 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Ratios & Paramètres ITF');

  // ==========================================
  // ONGLET 4 : CALIBRAGE ACTIF & PORTIONS
  // ==========================================
  const portions = profile.customPortions || [];
  const portionRows = portions.map((p, i) => ({
    'N°': i + 1,
    'Aliment Tunisien': p.food_name,
    'Portion Apprise (g)': p.custom_portion_g,
    'Portion INNT Standard (g)': p.default_portion_g,
    'Écart Ajusté (g)': p.custom_portion_g - p.default_portion_g,
    'Nombre de Corrections': p.correction_count,
    'Dernière mise à jour': new Date(p.last_updated).toLocaleDateString('fr-FR'),
  }));

  const wsPortions = XLSX.utils.json_to_sheet(
    portionRows.length > 0 ? portionRows : [{ Info: 'Aucune portion personnalisée apprise pour le moment.' }]
  );
  wsPortions['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsPortions, 'Portions Apprises');

  // Déclenchement du téléchargement
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GlucoMeal_Export_Diabetologue_${dateStamp}.xlsx`);
}
