import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AnalyzedMeal, UserProfileDT1 } from '../../types';

vi.mock('../../services/supabase', () => ({
  isCloudConfigured: true,
  onAuthChange: vi.fn(() => () => {}),
  upsertMealsRemote: vi.fn(),
  upsertProfileRemote: vi.fn(),
  deleteMealRemote: vi.fn(),
  deleteAllMealsRemote: vi.fn(),
  stripSecretsFromProfile: ({ cgmConfig: _secret, ...rest }: any) => rest,
}));

import * as remote from '../../services/supabase';
import { saveConsent } from '../consent';
import {
  flushSyncQueue,
  getPendingOperations,
  queueMealUpsert,
  queueMealsUpsert,
  queueMealDelete,
  queueAllMealsDelete,
  queueProfileUpsert,
  isPermanentSyncError,
  withoutPendingMeals,
} from '../syncQueue';

const upsertMeals = vi.mocked(remote.upsertMealsRemote);
const upsertProfile = vi.mocked(remote.upsertProfileRemote);
const deleteMeal = vi.mocked(remote.deleteMealRemote);
const deleteAllMeals = vi.mocked(remote.deleteAllMealsRemote);

const networkError = () => new TypeError('Failed to fetch');
const checkViolation = () => Object.assign(new Error('violates check constraint'), { code: '23514' });

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
}

const meal = (id: string, extra: Partial<AnalyzedMeal> = {}) =>
  ({ id, meal_name: `Repas ${id}`, total_carbs: 40, created_at: '2026-10-16T12:00:00Z', ...extra }) as AnalyzedMeal;

// Attendre la fin de l'envoi en cours et du passage relancé pour les opérations ajoutées entre-temps
async function settle() {
  await flushSyncQueue();
  await flushSyncQueue();
}

describe("File d'attente des envois cloud", () => {
  beforeEach(() => {
    stubLocalStorage();
    saveConsent({ cloudSync: true, analytics: false });
    vi.clearAllMocks();
    upsertMeals.mockResolvedValue(undefined);
    upsertProfile.mockResolvedValue(undefined);
    deleteMeal.mockResolvedValue(undefined);
    deleteAllMeals.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await settle();
    vi.unstubAllGlobals();
  });

  it('envoie un repas puis vide la file', async () => {
    queueMealUpsert(meal('meal-1'));
    await settle();
    expect(upsertMeals).toHaveBeenCalledWith([meal('meal-1')]);
    expect(getPendingOperations()).toEqual([]);
  });

  it('garde les opérations hors-ligne et les envoie dans l’ordre au retour du réseau', async () => {
    upsertProfile.mockRejectedValue(networkError());
    queueProfileUpsert({ name: 'A' } as UserProfileDT1);
    queueMealUpsert(meal('meal-1'));
    await settle();
    expect(getPendingOperations().map((op) => op.type)).toEqual(['upsertProfile', 'upsertMeal']);
    expect(upsertMeals).not.toHaveBeenCalled();

    upsertProfile.mockResolvedValue(undefined);
    await settle();
    expect(upsertMeals).toHaveBeenCalledWith([meal('meal-1')]);
    expect(getPendingOperations()).toEqual([]);
  });

  it('ne garde que la dernière opération sur un même repas', async () => {
    upsertMeals.mockRejectedValue(networkError());
    queueMealUpsert(meal('meal-1', { total_carbs: 10 }));
    queueMealUpsert(meal('meal-1', { total_carbs: 20 }));
    await settle();
    let pending = getPendingOperations();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ type: 'upsertMeal', meal: { total_carbs: 20 } });

    deleteMeal.mockRejectedValue(networkError());
    queueMealDelete('meal-1');
    await settle();
    pending = getPendingOperations();
    expect(pending).toEqual([expect.objectContaining({ type: 'deleteMeal', mealId: 'meal-1' })]);
  });

  it('remplace les opérations sur les repas par « tout supprimer », mais garde le profil', async () => {
    upsertProfile.mockRejectedValue(networkError());
    queueProfileUpsert({ name: 'A' } as UserProfileDT1);
    queueMealUpsert(meal('meal-1'));
    queueAllMealsDelete();
    await settle();
    expect(getPendingOperations().map((op) => op.type)).toEqual(['upsertProfile', 'deleteAllMeals']);
  });

  it('envoie les repas consécutifs en une seule requête', async () => {
    upsertMeals.mockRejectedValue(networkError());
    queueMealsUpsert([meal('meal-1'), meal('meal-2'), meal('meal-3')]);
    await settle();
    upsertMeals.mockClear();
    upsertMeals.mockResolvedValue(undefined);
    await settle();
    expect(upsertMeals).toHaveBeenCalledTimes(1);
    expect(upsertMeals.mock.calls[0][0].map((m) => m.id)).toEqual(['meal-1', 'meal-2', 'meal-3']);
  });

  it('écarte un repas refusé définitivement sans perdre les autres', async () => {
    upsertMeals.mockImplementation(async (meals) => {
      if (meals.some((m) => m.id === 'meal-bad')) throw checkViolation();
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    queueMealsUpsert([meal('meal-ok'), meal('meal-bad')]);
    await settle();
    expect(upsertMeals).toHaveBeenCalledWith([meal('meal-ok')]);
    expect(getPendingOperations()).toEqual([]);
    warn.mockRestore();
  });

  it('n’envoie aucune donnée sans consentement, mais transmet les suppressions', async () => {
    saveConsent({ cloudSync: false, analytics: false });
    queueMealUpsert(meal('meal-1'));
    queueProfileUpsert({ name: 'A' } as UserProfileDT1);
    queueMealDelete('meal-2');
    await settle();
    expect(upsertMeals).not.toHaveBeenCalled();
    expect(upsertProfile).not.toHaveBeenCalled();
    expect(deleteMeal).toHaveBeenCalledWith('meal-2');
  });

  it('abandonne les envois en attente si le consentement est retiré', async () => {
    upsertMeals.mockRejectedValue(networkError());
    queueMealUpsert(meal('meal-1'));
    await settle();
    saveConsent({ cloudSync: false, analytics: false });
    upsertMeals.mockClear();
    await settle();
    expect(upsertMeals).not.toHaveBeenCalled();
    expect(getPendingOperations()).toEqual([]);
  });

  it('ne met jamais les secrets CGM dans la file', () => {
    upsertProfile.mockRejectedValue(networkError());
    queueProfileUpsert({ name: 'A', cgmConfig: { apiSecret: 'x' } } as unknown as UserProfileDT1);
    expect(JSON.stringify(getPendingOperations())).not.toContain('apiSecret');
  });

  it('ne laisse pas le cloud écraser un repas modifié ou supprimé hors-ligne', async () => {
    upsertMeals.mockRejectedValue(networkError());
    deleteMeal.mockRejectedValue(networkError());
    queueMealUpsert(meal('meal-edited'));
    queueMealDelete('meal-deleted');
    await settle();
    const cloud = [meal('meal-edited'), meal('meal-deleted'), meal('meal-other')];
    expect(withoutPendingMeals(cloud).map((m) => m.id)).toEqual(['meal-other']);

    deleteAllMeals.mockRejectedValue(networkError());
    queueAllMealsDelete();
    await settle();
    expect(withoutPendingMeals(cloud)).toEqual([]);
  });

  it('distingue les refus définitifs des erreurs à réessayer', () => {
    expect(isPermanentSyncError({ code: '23514' })).toBe(true);
    expect(isPermanentSyncError({ code: '42501' })).toBe(true);
    expect(isPermanentSyncError({ code: 'PGRST204' })).toBe(true);
    expect(isPermanentSyncError({ code: 'PGRST301' })).toBe(false); // jeton expiré
    expect(isPermanentSyncError(networkError())).toBe(false);
  });
});
