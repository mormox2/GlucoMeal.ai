import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyzedMeal, UserProfileDT1 } from '../../types';
import { DEFAULT_USER_PROFILE, saveMeals, loadSavedMeals } from '../storage';
import { classifyPostPrandial, getPostPrandialGlucose } from '../postPrandial';
import { evaluatePostPrandialResult, savePostPrandialMeasurement } from '../cgmService';
import { analyzePatientTitration } from '../autoTitration';
import { buildExcelSheets } from '../excelExport';
import { computeScaledSize } from '../imageResize';

const glProfile: UserProfileDT1 = { ...DEFAULT_USER_PROFILE, glucoseUnit: 'g/L', targetGlucose: 1.0, isf: 0.4 };

const meal = (id: string, extra: Partial<AnalyzedMeal> = {}): AnalyzedMeal => ({
  id,
  meal_name: id,
  input_type: 'text',
  items: [],
  total_carbs: 60,
  overall_confidence: 'high',
  confidence_score: 90,
  created_at: '2026-10-08T12:00:00.000Z',
  bolus_calculated: { slot: 'lunch', icRatio: 10, mealBolus: 6, correctionBolus: 0, totalBolus: 6 },
  ...extra,
});

describe('Glycémies post-prandiales normalisées', () => {
  it('relit une ancienne saisie « 65 » (profil g/L) comme une hypoglycémie à 0.65 g/L', () => {
    // Ancien enregistrement : valeur brute et statut « hyper » calculé sur la valeur mal interprétée
    const legacy = meal('legacy', { post_prandial_glucose: 65, post_prandial_evaluation: 'hyper' });
    expect(getPostPrandialGlucose(legacy, 'g/L')).toBe(0.65);
    expect(classifyPostPrandial(legacy, glProfile)).toBe('hypo');
  });

  it('convertit une mesure enregistrée dans une autre unité que celle du profil', () => {
    const m = meal('m', { post_prandial_glucose: 1.5, post_prandial_unit: 'g/L' });
    expect(getPostPrandialGlucose(m, 'mg/dL')).toBe(150);
  });

  it('l’auto-titration ne propose jamais d’augmenter l’insuline sur des hypoglycémies mal saisies', () => {
    const meals = [
      meal('a', { post_prandial_glucose: 65, post_prandial_evaluation: 'hyper' }),
      meal('b', { post_prandial_glucose: 62, post_prandial_evaluation: 'hyper' }),
    ];
    const report = analyzePatientTitration(meals, glProfile);
    expect(report.slots.lunch.status).toBe('decrease_insulin');
    expect(report.slots.lunch.averagePostPrandial).toBe(0.64);
  });

  it('refuse une glycémie invalide au lieu de la classer « dans la cible »', () => {
    expect(() => evaluatePostPrandialResult(NaN, 1.0, 'g/L')).toThrow();
  });

  describe('savePostPrandialMeasurement', () => {
    beforeEach(() => saveMeals([meal('x')]));

    it('enregistre la valeur normalisée et son unité', () => {
      const [saved] = savePostPrandialMeasurement('x', 65, 1.0, 'g/L');
      expect(saved.post_prandial_glucose).toBe(0.65);
      expect(saved.post_prandial_unit).toBe('g/L');
      expect(saved.post_prandial_evaluation).toBe('hypo');
    });

    it('refuse une valeur ininterprétable (ex. mmol/L)', () => {
      expect(() => savePostPrandialMeasurement('x', 12, 1.0, 'g/L')).toThrow();
      expect(loadSavedMeals()[0].post_prandial_glucose).toBeUndefined();
    });
  });
});

describe('Export Excel', () => {
  it('construit 4 onglets sans indicateurs CGM inventés (TIR / GMI / CV)', () => {
    const sheets = buildExcelSheets([meal('a', { post_prandial_glucose: 1.2, post_prandial_unit: 'g/L' })], glProfile);
    expect(sheets.map((s) => s.sheet)).toEqual(['Journal des Repas', 'Synthèse H+2', 'Ratios & Paramètres', 'Portions Apprises']);
    const summary = sheets[1].data.map((row) => row.map((c: any) => (c && typeof c === 'object' ? c.value : c)));
    expect(summary).toContainEqual(['Contrôles H+2 dans la cible', '100%', expect.any(String)]);
    expect(summary).toContainEqual(['TIR / GMI / CV', 'Non calculés', expect.any(String)]);
  });

  it('n’affiche aucun pourcentage sans contrôle enregistré', () => {
    const sheets = buildExcelSheets([meal('a')], glProfile);
    const values = sheets[1].data.map((row) => row[1]);
    expect(values).toContain('N/D');
    expect(values).not.toContain('75%');
  });
});

describe('Réduction des photos avant envoi', () => {
  it('réduit le plus grand côté à 1600 px en conservant les proportions', () => {
    expect(computeScaledSize(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(computeScaledSize(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it('n’agrandit jamais une petite image', () => {
    expect(computeScaledSize(640, 480)).toEqual({ width: 640, height: 480 });
  });
});
