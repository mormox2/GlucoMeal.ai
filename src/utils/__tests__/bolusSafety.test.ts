import { describe, it, expect } from 'vitest';
import {
  calculatePersonalizedBolus,
  sanitizeUserProfile,
  DEFAULT_USER_PROFILE,
  MAX_SAFE_BOLUS_UNITS,
  validateTherapeuticProfile,
  saveUserProfile,
  interpretGlucoseInput,
} from '../storage';
import { UserProfileDT1 } from '../../types';

describe('Calculateur de Bolus & Plafond de Sécurité (DT1)', () => {
  const baseProfile: UserProfileDT1 = {
    ...DEFAULT_USER_PROFILE,
    glucoseUnit: 'g/L',
    targetGlucose: 1.0,
    isf: 0.4,
    icRatios: {
      morning: 8,
      lunch: 10,
      dinner: 12,
      snack: 10,
    },
    roundingStep: 0.5,
  };

  it('calcule correctement le bolus repas standard (sans correction)', () => {
    // 50g de glucides au déjeuner (ratio 10) = 5.0 UI
    const res = calculatePersonalizedBolus(50, baseProfile, 'lunch');
    expect(res.mealBolus).toBe(5.0);
    expect(res.correctionBolus).toBe(0);
    expect(res.totalBolus).toBe(5.0);
    expect(res.isCapped).toBe(false);
  });

  it('plafonne strictement la dose maximale à 20.0 UI (Safety Cap) en cas de dose aberrante', () => {
    // 300g de glucides au matin (ratio 8) = 37.5 UI -> DOIT être bridé à 20 UI max
    const res = calculatePersonalizedBolus(300, baseProfile, 'morning');
    expect(res.isCapped).toBe(true);
    expect(res.totalBolus).toBe(MAX_SAFE_BOLUS_UNITS);
    expect(res.unclampedTotalBolus).toBe(37.5);
    expect(res.safetyWarning).toContain('ALERTE SÉCURITÉ CLINIQUE');
  });

  it('détecte et normalise une saisie en mg/dL quand le profil est en g/L (prévention de surdosage létal)', () => {
    // Profil en g/L (cible 1.0, isf 0.4). L'utilisateur saisit "180" au lieu de 1.80.
    // Sans sécurité, (180 - 1.0) / 0.4 = 447.5 UI !
    // Avec sécurité, 180 est normalisé à 1.80 g/L -> correction = (1.80 - 1.0) / 0.4 = 2.0 UI
    const res = calculatePersonalizedBolus(40, baseProfile, 'lunch', 180);
    expect(res.currentGlucose).toBe(1.8);
    expect(res.correctionBolus).toBe(2.0);
    // 40g / 10 = 4.0 UI + 2.0 UI correction = 6.0 UI
    expect(res.totalBolus).toBe(6.0);
    expect(res.safetyWarning).toContain('convertie en 1.8 g/L');
  });

  it('détecte et normalise une saisie en g/L quand le profil est en mg/dL', () => {
    const mgProfile: UserProfileDT1 = {
      ...baseProfile,
      glucoseUnit: 'mg/dL',
      targetGlucose: 100,
      isf: 40,
    };
    // L'utilisateur saisit "1.40" au lieu de 140
    const res = calculatePersonalizedBolus(40, mgProfile, 'lunch', 1.4);
    expect(res.currentGlucose).toBe(140);
    expect(res.correctionBolus).toBe(1.0); // (140 - 100) / 40 = 1.0 UI
    expect(res.totalBolus).toBe(5.0); // 4 UI repas + 1 UI correction
    expect(res.safetyWarning).toContain('convertie en 140 mg/dL');
  });

  it('applique correctement les modulations d’activité physique post-repas', () => {
    // 60g de glucides à midi (ratio 10) = 6.0 UI
    // Marche légère = -15% -> 5.1 UI -> arrondi 0.5 = 5.0 UI
    const resWalk = calculatePersonalizedBolus(60, baseProfile, 'lunch', undefined, 'light_walk');
    expect(resWalk.activityReductionPct).toBe(15);
    expect(resWalk.mealBolus).toBe(5.1);
    expect(resWalk.totalBolus).toBe(5.0);

    // Sport intense = -50% -> 3.0 UI
    const resIntense = calculatePersonalizedBolus(60, baseProfile, 'lunch', undefined, 'intense');
    expect(resIntense.activityReductionPct).toBe(50);
    expect(resIntense.mealBolus).toBe(3.0);
    expect(resIntense.totalBolus).toBe(3.0);
  });

  it('respecte les pas d’arrondi personnalisés (0.1 pompe, 0.5 demi-unité, 1.0 standard)', () => {
    const pumpProfile: UserProfileDT1 = { ...baseProfile, roundingStep: 0.1 };
    // 53g de glucides / ratio 10 = 5.3 UI
    const resPump = calculatePersonalizedBolus(53, pumpProfile, 'lunch');
    expect(resPump.totalBolus).toBe(5.3);

    const pen1Profile: UserProfileDT1 = { ...baseProfile, roundingStep: 1.0 };
    const resPen1 = calculatePersonalizedBolus(53, pen1Profile, 'lunch');
    expect(resPen1.totalBolus).toBe(5.0);
  });

  it('active la surveillance et les consignes de sécurité clinique en phase de lune de miel', () => {
    const honeymoonProfile: UserProfileDT1 = {
      ...baseProfile,
      isHoneymoonPhase: true,
      icRatios: { ...baseProfile.icRatios, lunch: 15 },
    };
    // 45g de glucides au ratio 15 = 3.0 UI
    const res = calculatePersonalizedBolus(45, honeymoonProfile, 'lunch');
    expect(res.isHoneymoonActive).toBe(true);
    expect(res.totalBolus).toBe(3.0);
    expect(res.honeymoonNotice).toContain('Phase de lune de miel active');
    expect(res.safetyWarning).toBeUndefined();
  });

  it('émet une alerte de sécurité si un ratio trop agressif est paramétré en lune de miel', () => {
    const aggressiveHoneymoonProfile: UserProfileDT1 = {
      ...baseProfile,
      isHoneymoonPhase: true,
      icRatios: { ...baseProfile.icRatios, morning: 6 }, // 1 UI / 6g trop agressif en rémission
    };
    const res = calculatePersonalizedBolus(30, aggressiveHoneymoonProfile, 'morning');
    expect(res.isHoneymoonActive).toBe(true);
    expect(res.safetyWarning).toContain('Vigilance Lune de Miel');
  });
});

describe('Validation et Nettoyage du Profil Thérapeutique (sanitizeUserProfile)', () => {
  it('attribue des valeurs par défaut cohérentes en mg/dL au lieu de valeurs g/L aberrantes', () => {
    const sanitized = sanitizeUserProfile({
      glucoseUnit: 'mg/dL',
      targetGlucose: 0,
      isf: 0,
    });
    expect(sanitized.targetGlucose).toBe(100);
    expect(sanitized.isf).toBe(40);
  });

  it('préserve les valeurs valides en g/L', () => {
    const sanitized = sanitizeUserProfile({
      glucoseUnit: 'g/L',
      targetGlucose: 1.1,
      isf: 0.35,
    });
    expect(sanitized.targetGlucose).toBe(1.1);
    expect(sanitized.isf).toBe(0.35);
  });

  it('préserve et valide les champs de lune de miel (isHoneymoonPhase, diagnosisDate)', () => {
    const sanitized = sanitizeUserProfile({
      isHoneymoonPhase: true,
      diagnosisDate: '2026-02',
    });
    expect(sanitized.isHoneymoonPhase).toBe(true);
    expect(sanitized.diagnosisDate).toBe('2026-02');
  });
});

describe('Blocages de sécurité du bolus (hypoglycémie, profil, saisies invalides)', () => {
  const glProfile: UserProfileDT1 = {
    ...DEFAULT_USER_PROFILE,
    glucoseUnit: 'g/L',
    targetGlucose: 1.0,
    isf: 0.4,
    icRatios: { ...DEFAULT_USER_PROFILE.icRatios, lunch: 10 },
  };

  it('détecte une hypoglycémie saisie en mg/dL dans un profil g/L (65 = 0.65 g/L) et ne propose aucune dose', () => {
    const res = calculatePersonalizedBolus(60, glProfile, 'lunch', 65);
    expect(res.currentGlucose).toBe(0.65);
    expect(res.isHypoglycemia).toBe(true);
    expect(res.isBlocked).toBe(true);
    expect(res.blockReason).toBe('hypoglycemia');
    expect(res.totalBolus).toBe(0);
    expect(res.safetyWarning).toContain('Hypoglycémie');
  });

  it('détecte une hypoglycémie dans l’unité du profil', () => {
    const res = calculatePersonalizedBolus(60, glProfile, 'lunch', 0.55);
    expect(res.isHypoglycemia).toBe(true);
    expect(res.totalBolus).toBe(0);

    const mgProfile: UserProfileDT1 = { ...glProfile, glucoseUnit: 'mg/dL', targetGlucose: 100, isf: 40 };
    const resMg = calculatePersonalizedBolus(60, mgProfile, 'lunch', 62);
    expect(resMg.isHypoglycemia).toBe(true);
    expect(resMg.totalBolus).toBe(0);
  });

  it('signale une glycémie basse de prudence sans bloquer la dose', () => {
    const res = calculatePersonalizedBolus(60, glProfile, 'lunch', 75);
    expect(res.currentGlucose).toBe(0.75);
    expect(res.isCautionLow).toBe(true);
    expect(res.isBlocked).toBe(false);
    expect(res.totalBolus).toBe(6);
  });

  it('refuse une glycémie ininterprétable (ex. 12, probablement en mmol/L)', () => {
    const res = calculatePersonalizedBolus(60, glProfile, 'lunch', 12);
    expect(res.blockReason).toBe('invalid_glucose');
    expect(res.totalBolus).toBe(0);
    expect(res.currentGlucose).toBeUndefined();

    const mgProfile: UserProfileDT1 = { ...glProfile, glucoseUnit: 'mg/dL', targetGlucose: 100, isf: 40 };
    expect(calculatePersonalizedBolus(60, mgProfile, 'lunch', 8).blockReason).toBe('invalid_glucose');
    // 4.5 peut être 4.5 g/L ou 4.5 mmol/L (0.81 g/L) : jamais converti en 450 mg/dL
    expect(calculatePersonalizedBolus(60, mgProfile, 'lunch', 4.5).blockReason).toBe('invalid_glucose');
  });

  it('bloque la dose si l’ISF est dans la mauvaise unité (0.4 dans un profil mg/dL)', () => {
    const wrongIsf: UserProfileDT1 = { ...glProfile, glucoseUnit: 'mg/dL', targetGlucose: 100, isf: 0.4 };
    const res = calculatePersonalizedBolus(30, wrongIsf, 'lunch', 180);
    expect(res.blockReason).toBe('invalid_profile');
    expect(res.totalBolus).toBe(0);
    expect(res.profileIssues?.map((i) => i.field)).toEqual(['isf']);
  });

  it('bloque la dose si un ratio est hors bornes (ex. 1 UI pour 1 g injecté via synchronisation)', () => {
    const malicious: UserProfileDT1 = { ...glProfile, icRatios: { ...glProfile.icRatios, lunch: 1 } };
    const res = calculatePersonalizedBolus(60, malicious, 'lunch');
    expect(res.blockReason).toBe('invalid_profile');
    expect(res.totalBolus).toBe(0);
  });

  it('bloque la dose si la quantité de glucides est absente ou invalide', () => {
    expect(calculatePersonalizedBolus(undefined as unknown as number, glProfile, 'lunch').blockReason).toBe('invalid_carbs');
    expect(calculatePersonalizedBolus(NaN, glProfile, 'lunch').totalBolus).toBe(0);
    expect(calculatePersonalizedBolus(-10, glProfile, 'lunch').blockReason).toBe('invalid_carbs');
  });
});

describe('Bornes cliniques du profil (validateTherapeuticProfile / saveUserProfile)', () => {
  it('accepte le profil par défaut', () => {
    expect(validateTherapeuticProfile(DEFAULT_USER_PROFILE)).toEqual([]);
  });

  it('détecte les incohérences d’unité de la cible et de l’ISF', () => {
    const issues = validateTherapeuticProfile({
      ...DEFAULT_USER_PROFILE,
      glucoseUnit: 'mg/dL',
      targetGlucose: 1.0,
      isf: 0.4,
    });
    expect(issues.map((i) => i.field).sort()).toEqual(['isf', 'targetGlucose']);
  });

  it('refuse d’enregistrer un profil hors bornes', () => {
    const issues = saveUserProfile({ ...DEFAULT_USER_PROFILE, icRatios: { ...DEFAULT_USER_PROFILE.icRatios, morning: 0.5 } });
    expect(issues).toHaveLength(1);
    expect(issues[0].slot).toBe('morning');
  });
});

describe('Interprétation de la glycémie saisie (interpretGlucoseInput)', () => {
  it.each([
    ['g/L', 1.4, { status: 'ok', value: 1.4, converted: false }],
    ['g/L', 180, { status: 'ok', value: 1.8, converted: true }],
    ['g/L', 9, { status: 'invalid' }],
    ['g/L', 900, { status: 'invalid' }],
    ['mg/dL', 140, { status: 'ok', value: 140, converted: false }],
    ['mg/dL', 1.4, { status: 'ok', value: 140, converted: true }],
    ['mg/dL', 4.5, { status: 'invalid' }],
    ['mg/dL', 12, { status: 'ok', value: 12, converted: false }],
    ['g/L', 0.15, { status: 'ok', value: 0.15, converted: false }],
    ['mg/dL', 0, { status: 'invalid' }],
  ] as const)('profil %s, saisie %s', (unit, value, expected) => {
    expect(interpretGlucoseInput(value, unit)).toEqual(expected);
  });

  it('considère une saisie vide comme absente', () => {
    expect(interpretGlucoseInput(undefined, 'g/L')).toEqual({ status: 'empty' });
    expect(interpretGlucoseInput(NaN, 'g/L')).toEqual({ status: 'empty' });
  });
});
