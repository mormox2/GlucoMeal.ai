import type { Row, Sheet } from 'write-excel-file/browser';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { sanitizeUserProfile } from './storage';
import { classifyPostPrandial, getPostPrandialGlucose } from './postPrandial';

type SheetRow = Record<string, string | number>;

/**
 * Convertit des lignes { colonne: valeur } en données d'onglet : ligne d'en-tête en gras puis valeurs.
 */
function toSheet(name: string, rows: SheetRow[], widths: number[]): Sheet<Blob> {
  const headers = Object.keys(rows[0] || {});
  const data: Row[] = [
    headers.map((header) => ({ value: header, fontWeight: 'bold' as const })),
    ...rows.map((row) => headers.map((header) => row[header] ?? '')),
  ];
  return { sheet: name, data, columns: widths.map((width) => ({ width })) };
}

/**
 * Construit les onglets du classeur Excel du patient (fonction pure, testable sans navigateur).
 */
export function buildExcelSheets(meals: AnalyzedMeal[], profile: UserProfileDT1): Sheet<Blob>[] {
  const safeProfile = sanitizeUserProfile(profile);
  const unit = safeProfile.glucoseUnit;

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

    const ppStatus = classifyPostPrandial(m, safeProfile);
    const ppGlucose = getPostPrandialGlucose(m, unit);
    let evalText = 'Non mesuré';
    if (ppStatus === 'target') evalText = 'Dans la cible';
    else if (ppStatus === 'hyper') evalText = 'Au-dessus de la cible';
    else if (ppStatus === 'hypo') evalText = 'Hypoglycémie';

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
        ? `${m.bolus_calculated.currentGlucose} ${unit}`
        : '-',
      'Bolus Correction (UI)': m.bolus_calculated?.correctionBolus || 0,
      'Bolus Total Injecté (UI)': m.bolus_calculated?.totalBolus || '-',
      'Glycémie H+2': ppGlucose !== undefined ? `${ppGlucose} ${unit}` : 'Non renseignée',
      'Évaluation H+2': evalText,
      'Détail des Ingrédients INNT': componentsSummary,
    };
  });

  const mealsSheet = toSheet('Journal des Repas', mealsRows, [5, 12, 8, 12, 32, 22, 16, 14, 16, 16, 12, 20, 16, 22, 20, 18, 20, 16, 24, 60]);

  // ==========================================
  // ONGLET 2 : SYNTHÈSE DES CONTRÔLES POST-PRANDIAUX
  // Contrôles ponctuels à H+2 : ce ne sont pas des données CGM continues, donc ni TIR, ni GMI, ni CV.
  // ==========================================
  const statuses = meals.map((m) => classifyPostPrandial(m, safeProfile)).filter((st) => st !== undefined);
  const values = meals.map((m) => getPostPrandialGlucose(m, unit)).filter((v): v is number => v !== undefined);
  const countEvaluated = statuses.length;
  const pct = (status: string) =>
    countEvaluated > 0 ? `${Math.round((statuses.filter((st) => st === status).length / countEvaluated) * 100)}%` : 'N/D';
  const mean =
    values.length > 0
      ? `${(values.reduce((a, v) => a + v, 0) / values.length).toFixed(unit === 'g/L' ? 2 : 0)} ${unit}`
      : 'N/D';

  const summaryRows: SheetRow[] = [
    { Indicateur: 'Patient', Valeur: safeProfile.name, Remarque: 'Patient DT1 sous insulinothérapie' },
    { Indicateur: 'Total repas enregistrés', Valeur: meals.length, Remarque: '-' },
    { Indicateur: 'Contrôles post-prandiaux H+2', Valeur: countEvaluated, Remarque: 'Idéalement 100% des repas' },
    { Indicateur: 'Contrôles H+2 dans la cible', Valeur: pct('target'), Remarque: `Cible ≤ cible + ${unit === 'g/L' ? '0.40' : '40'} ${unit}` },
    { Indicateur: 'Contrôles H+2 au-dessus de la cible', Valeur: pct('hyper'), Remarque: '-' },
    { Indicateur: 'Contrôles H+2 en hypoglycémie', Valeur: pct('hypo'), Remarque: `< ${unit === 'g/L' ? '0.70' : '70'} ${unit}` },
    { Indicateur: 'Glycémie H+2 moyenne', Valeur: mean, Remarque: '-' },
    {
      Indicateur: 'TIR / GMI / CV',
      Valeur: 'Non calculés',
      Remarque: 'Nécessitent un enregistrement CGM continu (contrôles ponctuels insuffisants)',
    },
  ];
  const summarySheet = toSheet('Synthèse H+2', summaryRows, [36, 22, 60]);

  // ==========================================
  // ONGLET 3 : PROFIL & RATIOS INSULINE:GLUCIDES
  // ==========================================
  const profileRows: SheetRow[] = [
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
    { Paramètre: 'Plafond de bolus', Valeur: safeProfile.maxBolusUnits ? `${safeProfile.maxBolusUnits} UI` : 'Valeur par défaut' },
    { Paramètre: "Durée d'action de l'insuline", Valeur: `${safeProfile.insulinActionHours} h` },
  ];

  const profileSheet = toSheet('Ratios & Paramètres', profileRows, [32, 36]);

  // ==========================================
  // ONGLET 4 : CALIBRAGE ACTIF & PORTIONS
  // ==========================================
  const portions = profile.customPortions || [];
  const portionRows: SheetRow[] = portions.map((p, i) => ({
    'N°': i + 1,
    'Aliment Tunisien': p.food_name,
    'Portion Apprise (g)': p.custom_portion_g,
    'Portion INNT Standard (g)': p.default_portion_g,
    'Écart Ajusté (g)': p.custom_portion_g - p.default_portion_g,
    'Nombre de Corrections': p.correction_count,
    'Dernière mise à jour': new Date(p.last_updated).toLocaleDateString('fr-FR'),
  }));

  const portionsSheet = toSheet(
    'Portions Apprises',
    portionRows.length > 0 ? portionRows : [{ Info: 'Aucune portion personnalisée apprise pour le moment.' }],
    [6, 30, 20, 24, 18, 24, 20]
  );

  return [mealsSheet, summarySheet, profileSheet, portionsSheet];
}

/**
 * Exporte l'ensemble des données du patient dans un classeur Excel (.xlsx) multi-onglets.
 * La bibliothèque d'écriture n'est chargée qu'au moment de l'export.
 */
export async function exportToExcelWorkbook(meals: AnalyzedMeal[], profile: UserProfileDT1): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const dateStamp = new Date().toISOString().slice(0, 10);
  await writeXlsxFile(buildExcelSheets(meals, profile)).toFile(`GlucoMeal_Export_Diabetologue_${dateStamp}.xlsx`);
}
