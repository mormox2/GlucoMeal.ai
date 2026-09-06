import { describe, it, expect } from 'vitest';
import { analyzePatientTitration } from '../autoTitration';
import { DEFAULT_USER_PROFILE } from '../storage';
import { AnalyzedMeal } from '../../types';

describe('Moteur d’Auto-Titration Clinique DT1 (SFD / ADA)', () => {
  const profile = {
    ...DEFAULT_USER_PROFILE,
    glucoseUnit: 'g/L' as const,
    targetGlucose: 1.0,
    icRatios: {
      morning: 8,
      lunch: 10,
      dinner: 12,
      snack: 10,
    },
  };

  const createDummyMeal = (
    id: string,
    slot: 'lunch' | 'morning' | 'dinner',
    evaluation: 'target' | 'hyper' | 'hypo',
    glucose: number
  ): AnalyzedMeal => ({
    id,
    meal_name: 'Repas test',
    input_type: 'photo',
    total_carbs: 60,
    overall_confidence: 'high',
    confidence_score: 90,
    post_prandial_evaluation: evaluation,
    post_prandial_glucose: glucose,
    items: [],
    bolus_calculated: {
      slot,
      icRatio: profile.icRatios[slot],
      mealBolus: 6,
      correctionBolus: 0,
      totalBolus: 6,
    },
  });

  it('alerte et allège le bolus (+15% de glucides par UI) en cas d’hypoglycémies répétées', () => {
    // 3 repas à midi dont 2 hypoglycémies post-prandiales
    const meals = [
      createDummyMeal('m1', 'lunch', 'hypo', 0.62),
      createDummyMeal('m2', 'lunch', 'hypo', 0.58),
      createDummyMeal('m3', 'lunch', 'target', 1.15),
    ];

    const report = analyzePatientTitration(meals, profile);
    const lunchAnalysis = report.slots.lunch;

    expect(lunchAnalysis.status).toBe('decrease_insulin');
    // Ratio actuel = 10 -> allègement 10 * 1.15 = 11.5
    expect(lunchAnalysis.suggestedRatio).toBe(11.5);
    expect(lunchAnalysis.recommendationTitle).toContain('hypoglycémie');
    expect(report.priorityAlert).not.toBeNull();
  });

  it('recommande de renforcer le bolus en cas d’hyperglycémie fréquente (>50%)', () => {
    // 4 repas au dîner dont 3 en hyperglycémie
    const meals = [
      createDummyMeal('d1', 'dinner', 'hyper', 2.1),
      createDummyMeal('d2', 'dinner', 'hyper', 1.95),
      createDummyMeal('d3', 'dinner', 'hyper', 2.2),
      createDummyMeal('d4', 'dinner', 'target', 1.3),
    ];

    const report = analyzePatientTitration(meals, profile);
    const dinnerAnalysis = report.slots.dinner;

    expect(dinnerAnalysis.status).toBe('increase_insulin');
    // Ratio dîner = 12 -> renforcement = Math.round(12 * 0.86 * 10) / 10 = 10.3
    expect(dinnerAnalysis.suggestedRatio).toBeLessThan(12);
    expect(dinnerAnalysis.recommendationTitle).toContain('hyperglycémie');
  });

  it('indique un statut optimal lorsque les glycémies sont dans la cible', () => {
    const meals = [
      createDummyMeal('l1', 'lunch', 'target', 1.1),
      createDummyMeal('l2', 'lunch', 'target', 1.25),
      createDummyMeal('l3', 'lunch', 'target', 1.05),
    ];

    const report = analyzePatientTitration(meals, profile);
    const lunchAnalysis = report.slots.lunch;

    expect(lunchAnalysis.status).toBe('optimal');
    expect(lunchAnalysis.suggestedRatio).toBe(10);
    expect(lunchAnalysis.recommendationTitle).toContain('optimal');
  });

  it('indique des données insuffisantes si moins de 2 contrôles post-prandiaux', () => {
    const meals = [createDummyMeal('l1', 'lunch', 'target', 1.1)];
    const report = analyzePatientTitration(meals, profile);
    expect(report.slots.lunch.status).toBe('insufficient_data');
  });

  it('génère un audit de sécurité lune de miel avec alerte hypo renforcée', () => {
    const honeymoonProfile = {
      ...profile,
      isHoneymoonPhase: true,
    };
    const meals = [
      createDummyMeal('m1', 'lunch', 'hypo', 0.62),
      createDummyMeal('m2', 'lunch', 'hypo', 0.58),
      createDummyMeal('m3', 'lunch', 'target', 1.15),
    ];
    const report = analyzePatientTitration(meals, honeymoonProfile);

    expect(report.honeymoonInsight).toBeDefined();
    expect(report.honeymoonInsight?.status).toBe('hypo_risk');
    expect(report.slots.lunch.clinicalRationale).toContain('🍯 Sécurité Lune de Miel');
  });

  it('détecte les signes de fin progressive de lune de miel (waning_phase) en cas d’hyperglycémies post-prandiales', () => {
    const honeymoonProfile = {
      ...profile,
      isHoneymoonPhase: true,
    };
    const meals = [
      createDummyMeal('d1', 'dinner', 'hyper', 2.1),
      createDummyMeal('d2', 'dinner', 'hyper', 1.95),
      createDummyMeal('d3', 'dinner', 'hyper', 2.2),
      createDummyMeal('d4', 'dinner', 'target', 1.3),
    ];
    const report = analyzePatientTitration(meals, honeymoonProfile);

    expect(report.honeymoonInsight).toBeDefined();
    expect(report.honeymoonInsight?.status).toBe('waning_phase');
    expect(report.slots.dinner.recommendationTitle).toContain('Fin de lune de miel');
  });
});
