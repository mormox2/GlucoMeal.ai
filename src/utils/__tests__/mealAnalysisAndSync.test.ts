import { describe, it, expect } from 'vitest';
import { MealAnalysisError, buildMealFromPreset, parseMealAnalysisResponse } from '../mealAnalysis';
import { generateSyncCode, isValidSyncCode, normalizeSyncCode } from '../syncCode';
import { SAMPLE_MEAL_PRESETS } from '../../data/sampleMeals';

const item = (overrides: Record<string, unknown> = {}) => ({
  id: 'item-1',
  name_fr: 'Pain',
  estimated_weight_g: 50,
  confirmed_weight_g: 50,
  carbs_per_100g: 50,
  calculated_carbs: 25,
  confidence: 'high',
  ...overrides,
});

describe('parseMealAnalysisResponse', () => {
  it('recalcule le total à partir des aliments', () => {
    const res = parseMealAnalysisResponse({ items: [item(), item({ id: 'item-2', calculated_carbs: 10 })], total_carbs: 999 });
    expect(res.total_carbs).toBe(35);
  });

  it('refuse une réponse sans aliment', () => {
    expect(() => parseMealAnalysisResponse({ items: [], total_carbs: 92 })).toThrow(MealAnalysisError);
    expect(() => parseMealAnalysisResponse({ error: 'Trop de requêtes' })).toThrow(MealAnalysisError);
  });

  it('refuse un aliment sans valeur glucidique valide', () => {
    expect(() => parseMealAnalysisResponse({ items: [item({ calculated_carbs: undefined })] })).toThrow(MealAnalysisError);
    expect(() => parseMealAnalysisResponse({ items: [item({ carbs_per_100g: -1 })] })).toThrow(MealAnalysisError);
  });
});

describe('buildMealFromPreset', () => {
  it('utilise la composition de référence de l’exemple, signalée comme démonstration', () => {
    const preset = SAMPLE_MEAL_PRESETS[0];
    const meal = buildMealFromPreset(preset);
    expect(meal.items).toHaveLength(preset.default_items.length);
    expect(meal.total_carbs).toBe(meal.items.reduce((sum, i) => sum + i.calculated_carbs, 0));
    expect(meal.notes).toContain('démonstration');
  });
});

describe('Codes de synchronisation', () => {
  it('génère des codes de 80 bits au format attendu par les règles Firestore', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateSyncCode()));
    expect(codes.size).toBe(200);
    for (const code of codes) {
      expect(isValidSyncCode(code)).toBe(true);
    }
  });

  it('refuse les anciens codes courts et les codes choisis à la main', () => {
    expect(isValidSyncCode('GLUCO-7K2X-9B4F')).toBe(false);
    expect(isValidSyncCode('TEST')).toBe(false);
    expect(isValidSyncCode('GLUCO-OOOO-IIII-0000-1111')).toBe(false);
  });

  it('normalise la saisie utilisateur', () => {
    expect(normalizeSyncCode(' gluco-7k2x-9b4f-qm3t-h8wz ')).toBe('GLUCO-7K2X-9B4F-QM3T-H8WZ');
  });
});
