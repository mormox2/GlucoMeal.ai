import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { interpretGlucoseInput, sanitizeUserProfile } from './storage';
import { evaluatePostPrandialResult } from './cgmService';

export type PostPrandialStatus = 'target' | 'hyper' | 'hypo';

/**
 * Glycémie post-prandiale d'un repas exprimée dans l'unité actuelle du profil.
 * - Mesure enregistrée avec son unité : conversion si le profil a changé d'unité.
 * - Ancienne mesure sans unité : même interprétation que la saisie (« 65 » dans un profil g/L = 0.65 g/L).
 * Renvoie undefined si la valeur est absente ou ininterprétable.
 */
export function getPostPrandialGlucose(meal: AnalyzedMeal, unit: 'g/L' | 'mg/dL'): number | undefined {
  const value = meal.post_prandial_glucose;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  if (meal.post_prandial_unit === unit) return value;
  if (meal.post_prandial_unit === 'g/L') return Math.round(value * 100);
  if (meal.post_prandial_unit === 'mg/dL') return Number((value / 100).toFixed(2));
  const interpreted = interpretGlucoseInput(value, unit);
  return interpreted.status === 'ok' ? interpreted.value : undefined;
}

/**
 * Classe le contrôle post-prandial d'un repas à partir de la valeur normalisée (et non du statut
 * enregistré, qui a pu être calculé sur une saisie mal interprétée). À défaut de valeur, le statut
 * enregistré est utilisé.
 */
export function classifyPostPrandial(meal: AnalyzedMeal, profile: UserProfileDT1): PostPrandialStatus | undefined {
  const safeProfile = sanitizeUserProfile(profile);
  const value = getPostPrandialGlucose(meal, safeProfile.glucoseUnit);
  if (value !== undefined) {
    return evaluatePostPrandialResult(value, safeProfile.targetGlucose, safeProfile.glucoseUnit).status;
  }
  return meal.post_prandial_evaluation;
}
