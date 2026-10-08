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

  const NOW = Date.parse('2026-10-08T12:00:00Z');
  const createDummyMeal = (
    id: string,
    slot: 'lunch' | 'morning' | 'dinner',
    evaluation: 'target' | 'hyper' | 'hypo',
    glucose: number,
    daysAgo = 1,
    icRatio: number = profile.icRatios[slot]
  ): AnalyzedMeal => ({
    id,
    created_at: new Date(NOW - daysAgo * 86400000).toISOString(),
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
      icRatio,
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

    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    const lunchAnalysis = report.slots.lunch;

    expect(lunchAnalysis.status).toBe('decrease_insulin');
    // Ratio actuel = 10 -> allègement 10 * 1.15 = 11.5
    expect(lunchAnalysis.suggestedRatio).toBe(11.5);
    expect(lunchAnalysis.recommendationTitle).toContain('hypoglycémie');
    expect(report.priorityAlert).not.toBeNull();
  });

  it('propose un renforcement plafonné à +10 % d’insuline en cas d’hyperglycémie fréquente (≥ 5 contrôles)', () => {
    // 5 repas récents au dîner dont 4 en hyperglycémie
    const meals = [
      createDummyMeal('d1', 'dinner', 'hyper', 2.1),
      createDummyMeal('d2', 'dinner', 'hyper', 1.95),
      createDummyMeal('d3', 'dinner', 'hyper', 2.2),
      createDummyMeal('d4', 'dinner', 'hyper', 1.9),
      createDummyMeal('d5', 'dinner', 'target', 1.3),
    ];

    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    const dinnerAnalysis = report.slots.dinner;

    expect(dinnerAnalysis.status).toBe('increase_insulin');
    // Ratio dîner = 12 -> renforcement plafonné : 12 / 1.10 = 10.9
    expect(dinnerAnalysis.suggestedRatio).toBe(10.9);
    expect(dinnerAnalysis.recommendationTitle).toContain('hyperglycémie');
    expect(dinnerAnalysis.clinicalRationale).toContain('valider avec votre diabétologue');
  });

  it('indique un statut optimal lorsque les glycémies sont dans la cible', () => {
    const meals = [
      createDummyMeal('l1', 'lunch', 'target', 1.1),
      createDummyMeal('l2', 'lunch', 'target', 1.25),
      createDummyMeal('l3', 'lunch', 'target', 1.05),
      createDummyMeal('l4', 'lunch', 'target', 1.2),
      createDummyMeal('l5', 'lunch', 'target', 1.15),
    ];

    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    const lunchAnalysis = report.slots.lunch;

    expect(lunchAnalysis.status).toBe('optimal');
    expect(lunchAnalysis.suggestedRatio).toBe(10);
    expect(lunchAnalysis.recommendationTitle).toContain('adapté');
  });

  it('indique des données insuffisantes avec moins de 5 contrôles (aucun renforcement sur 4 hyperglycémies)', () => {
    const meals = [1, 2, 3, 4].map((i) => createDummyMeal(`l${i}`, 'lunch', 'hyper', 2.2));
    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    expect(report.slots.lunch.status).toBe('insufficient_data');
  });

  it('ignore les contrôles de plus de 14 jours et ceux dosés avec un ancien ratio', () => {
    const meals = [
      ...[1, 2, 3].map((i) => createDummyMeal(`old${i}`, 'dinner', 'hyper', 2.2, 20)),
      ...[1, 2, 3].map((i) => createDummyMeal(`prev${i}`, 'dinner', 'hyper', 2.2, 2, 14)),
      createDummyMeal('cur1', 'dinner', 'hyper', 2.2),
    ];
    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    expect(report.slots.dinner.totalRecordedPostPrandial).toBe(1);
    expect(report.slots.dinner.status).toBe('insufficient_data');
  });

  it('ne propose jamais de renforcement si une hypoglycémie figure parmi les contrôles', () => {
    const meals = [
      // 6 hyperglycémies et 1 hypoglycémie (14 %) : ni renforcement, ni allègement automatique
      ...[1, 2, 3, 4, 5, 6].map((i) => createDummyMeal(`d${i}`, 'dinner', 'hyper', 2.2)),
      createDummyMeal('d7', 'dinner', 'hypo', 0.6),
    ];
    const report = analyzePatientTitration(meals, profile, 'fr', NOW);
    expect(report.slots.dinner.status).not.toBe('increase_insulin');
    expect(report.slots.dinner.recommendationTitle).toContain('contradictoires');
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
    const report = analyzePatientTitration(meals, honeymoonProfile, 'fr', NOW);

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
      createDummyMeal('d4', 'dinner', 'hyper', 1.9),
      createDummyMeal('d5', 'dinner', 'target', 1.3),
    ];
    const report = analyzePatientTitration(meals, honeymoonProfile, 'fr', NOW);

    expect(report.honeymoonInsight).toBeDefined();
    expect(report.honeymoonInsight?.status).toBe('waning_phase');
    expect(report.slots.dinner.recommendationTitle).toContain('Fin de lune de miel');
  });
});
