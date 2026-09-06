import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluatePostPrandialResult,
  savePostPrandialMeasurement,
  fetchNightscoutReading,
  fetchCurrentCGMReading,
  DEFAULT_CGM_CONFIG,
} from '../cgmService';
import { CGMConfig, UserProfileDT1, AnalyzedMeal } from '../../types';
import { DEFAULT_USER_PROFILE, loadSavedMeals, saveMeals } from '../storage';

describe('Service CGM & Évaluation Post-Prandiale', () => {
  describe('evaluatePostPrandialResult (Normes & Sécurité Clinique)', () => {
    it('évalue une glycémie dans la cible post-prandiale normale (ex: 1.25 g/L pour cible 1.00 g/L)', () => {
      const res = evaluatePostPrandialResult(1.25, 1.0, 'g/L');
      expect(res.status).toBe('target');
      expect(res.badgeColor).toBe('emerald');
      expect(res.deltaLabel).toBe('+0.25 g/L');
      expect(res.badgeLabel).toContain('Cible atteinte');
    });

    it('détecte une hypoglycémie post-prandiale sous 0.70 g/L', () => {
      const res = evaluatePostPrandialResult(0.62, 1.0, 'g/L');
      expect(res.status).toBe('hypo');
      expect(res.badgeColor).toBe('rose');
      expect(res.badgeLabel).toContain('Hypoglycémie');
      expect(res.deltaLabel).toBe('-0.38 g/L');
      expect(res.clinicalAdvice).toContain('Resucrage rapide');
    });

    it('détecte une hyperglycémie post-prandiale au-delà de cible + 0.40 g/L', () => {
      const res = evaluatePostPrandialResult(1.65, 1.0, 'g/L');
      expect(res.status).toBe('hyper');
      expect(res.badgeColor).toBe('amber');
      expect(res.badgeLabel).toContain('Hyperglycémie');
      expect(res.deltaLabel).toBe('+0.65 g/L');
    });

    it('fonctionne correctement en unité mg/dL', () => {
      // 125 mg/dL avec cible 100 mg/dL -> delta +25 mg/dL (Cible atteinte, tolérance +40)
      const res = evaluatePostPrandialResult(125, 100, 'mg/dL');
      expect(res.status).toBe('target');
      expect(res.deltaLabel).toBe('+25 mg/dL');

      // 155 mg/dL avec cible 100 mg/dL -> Hyper (> 140 mg/dL)
      const hyper = evaluatePostPrandialResult(155, 100, 'mg/dL');
      expect(hyper.status).toBe('hyper');
      expect(hyper.deltaLabel).toBe('+55 mg/dL');
    });

    it('immunité défensive contre le bug historique où userProfile (objet) était transmis à la place du nombre', () => {
      const mockProfile: UserProfileDT1 = {
        ...DEFAULT_USER_PROFILE,
        targetGlucose: 1.0,
        glucoseUnit: 'g/L',
      };

      // Si l'objet entier est passé par erreur
      const res = evaluatePostPrandialResult(1.20, mockProfile as any, 'g/L');
      expect(res.status).toBe('target');
      expect(res.deltaLabel).toBe('+0.2 g/L');
      expect(res.deltaLabel).not.toContain('NaN');
    });
  });

  describe('savePostPrandialMeasurement', () => {
    const testMeal: AnalyzedMeal = {
      id: 'test-meal-cgm-1',
      user_id: 'user-test',
      meal_name: 'Couscous test',
      created_at: new Date().toISOString(),
      input_type: 'photo',
      total_carbs: 60,
      overall_confidence: 'high',
      confidence_score: 90,
      items: [],
    };

    beforeEach(() => {
      saveMeals([testMeal]);
    });

    it('met à jour correctement un repas sans générer de delta NaN', () => {
      const meals = loadSavedMeals();
      const targetId = meals[0].id;

      const updated = savePostPrandialMeasurement(targetId, 1.30, 1.0, 'g/L');
      const savedMeal = updated.find((m) => m.id === targetId);

      expect(savedMeal).toBeDefined();
      expect(savedMeal?.post_prandial_glucose).toBe(1.30);
      expect(savedMeal?.post_prandial_evaluation).toBe('target');
    });

    it('gère de manière transparente le passage d’un objet profile comme 3e argument', () => {
      const meals = loadSavedMeals();
      const targetId = meals[0].id;
      const profile = { ...DEFAULT_USER_PROFILE, targetGlucose: 1.0, glucoseUnit: 'g/L' as const };

      const updated = savePostPrandialMeasurement(targetId, 1.15, profile as any);
      const savedMeal = updated.find((m) => m.id === targetId);

      expect(savedMeal).toBeDefined();
      expect(savedMeal?.post_prandial_glucose).toBe(1.15);
      expect(savedMeal?.post_prandial_evaluation).toBe('target');
    });
  });

  describe('fetchNightscoutReading (API REST Réelle)', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('interroge le serveur Nightscout et mappe la glycémie, la tendance et la sparkline', async () => {
      const mockNightscoutData = [
        {
          _id: '1',
          sgv: 135,
          direction: 'FortyFiveUp',
          date: Date.now(),
          device: 'xDrip-DexcomG7',
        },
        {
          _id: '2',
          sgv: 128,
          direction: 'Flat',
          date: Date.now() - 900000,
          device: 'xDrip-DexcomG7',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockNightscoutData,
      });

      const config: CGMConfig = {
        deviceType: 'nightscout',
        isConnected: true,
        nightscoutUrl: 'https://my-cgm.example.com/',
        apiKey: 'secret123',
      };

      const reading = await fetchNightscoutReading(config, 'g/L');

      expect(reading.device).toBe('nightscout');
      expect(reading.isSimulation).toBe(false);
      expect(reading.source).toBe('nightscout_live');
      expect(reading.glucose).toBe(1.35); // 135 mg/dL -> 1.35 g/L
      expect(reading.trend).toBe('up_slow');
      expect(reading.recentSparkline).toHaveLength(2);
      expect(reading.sensorSerialNumber).toBe('xDrip-DexcomG7');
    });

    it('bascule proprement en mode démo si Nightscout est inaccessible (hors-ligne ou CORS)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const config: CGMConfig = {
        deviceType: 'nightscout',
        isConnected: true,
        nightscoutUrl: 'https://inaccessible-nightscout.example.com',
      };

      const reading = await fetchCurrentCGMReading(config, 'g/L');

      expect(reading.isSimulation).toBe(true);
      expect(reading.source).toBe('simulation');
      expect(reading.errorMessage).toContain('Nightscout non joignable');
      expect(reading.glucose).toBeGreaterThan(0);
    });

    it('alerte explicitement l’utilisateur si l’URL Nightscout est absente', async () => {
      const config: CGMConfig = {
        deviceType: 'nightscout',
        isConnected: true,
        nightscoutUrl: '',
      };

      const reading = await fetchCurrentCGMReading(config, 'g/L');

      expect(reading.isSimulation).toBe(true);
      expect(reading.errorMessage).toBe("URL Nightscout non configurée. Veuillez renseigner l'adresse dans les paramètres.");
    });

    it('informe l’utilisateur sur le banc d’essai virtuel pour LinX CGM et Syai Tag', async () => {
      const configLinx: CGMConfig = {
        deviceType: 'linx',
        isConnected: true,
      };

      const reading = await fetchCurrentCGMReading(configLinx, 'g/L');

      expect(reading.isSimulation).toBe(true);
      expect(reading.errorMessage).toContain("Mode Banc d’Essai Virtuel");
    });
  });
});
