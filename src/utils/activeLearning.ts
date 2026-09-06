import { PatientCustomPortion } from '../types';

const STORAGE_KEYS = {
  ACTIVE_CORRECTIONS: 'glucomal_correction_history_v1',
  CUSTOM_PORTIONS: 'glucomal_custom_portions_v1',
};

interface CorrectionEvent {
  foodKey: string;
  foodName: string;
  defaultWeight: number;
  confirmedWeight: number;
  timestamp: string;
}

// Initialement vide : apprentissage uniquement à partir des vraies corrections du patient
const DEFAULT_PREFERENCES: PatientCustomPortion[] = [];

/**
 * Charge les préférences personnalisées apprises
 */
export function loadPatientCustomPortions(): PatientCustomPortion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PORTIONS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purge automatique des anciennes portions démo factices
    const cleaned = parsed.filter(
      (p: any) =>
        !(p.food_id === 'fec-04' && p.correction_count === 5) &&
        !(p.food_id === 'couscous_semoule' && p.correction_count === 3)
    );
    if (cleaned.length !== parsed.length) {
      savePatientCustomPortions(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Erreur chargement portions apprises:', err);
    return [];
  }
}

/**
 * Sauvegarde les préférences personnalisées
 */
export function savePatientCustomPortions(portions: PatientCustomPortion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PORTIONS, JSON.stringify(portions));
  } catch (err) {
    console.error('Erreur sauvegarde portions apprises:', err);
  }
}

/**
 * Réinitialise toutes les portions apprises et l'historique des corrections
 */
export function clearPatientCustomPortions(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_PORTIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CORRECTIONS);
  } catch (err) {
    console.error('Erreur réinitialisation portions apprises:', err);
  }
}

/**
 * Recherche si une portion personnalisée apprise existe pour cet aliment
 */
export function getLearnedPortionForFood(foodKeyOrName: string): PatientCustomPortion | undefined {
  const portions = loadPatientCustomPortions();
  const cleanKey = foodKeyOrName.toLowerCase().trim();

  return portions.find((p) => {
    if (!p.is_active) return false;
    const pName = p.food_name.toLowerCase();
    const pId = p.food_id.toLowerCase();
    return (
      pId === cleanKey ||
      pName === cleanKey ||
      pName.includes(cleanKey) ||
      cleanKey.includes(pName)
    );
  });
}

/**
 * Enregistre une correction de portion apportée par le patient
 * Si le patient corrige 3 fois de suite vers une portion similaire,
 * la suggestion prédictive est automatiquement générée et activée !
 */
export function recordPatientPortionCorrection(
  foodId: string,
  foodName: string,
  defaultWeight: number,
  confirmedWeight: number
): { learned: boolean; preference?: PatientCustomPortion } {
  if (typeof window === 'undefined') return { learned: false };
  if (defaultWeight === confirmedWeight) return { learned: false };

  try {
    // 1. Enregistrer l'événement de correction
    const historyRaw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CORRECTIONS);
    const history: CorrectionEvent[] = historyRaw ? JSON.parse(historyRaw) : [];

    const newEvent: CorrectionEvent = {
      foodKey: foodId || foodName,
      foodName,
      defaultWeight,
      confirmedWeight,
      timestamp: new Date().toISOString(),
    };

    history.push(newEvent);
    // Garder les 50 dernières corrections
    const trimmedHistory = history.slice(-50);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CORRECTIONS, JSON.stringify(trimmedHistory));

    // 2. Analyser la fréquence pour cet aliment
    const matchingCorrections = trimmedHistory.filter(
      (h) =>
        h.foodKey === foodId ||
        h.foodName.toLowerCase() === foodName.toLowerCase()
    );

    // Si corrigé au moins 3 fois
    if (matchingCorrections.length >= 3) {
      // Calcul de la moyenne des poids confirmés récents
      const recentWeights = matchingCorrections.slice(-4).map((c) => c.confirmedWeight);
      const avgWeight = Math.round(
        recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length
      );

      // Mettre à jour ou ajouter la préférence active
      const currentPortions = loadPatientCustomPortions();
      const existingIdx = currentPortions.findIndex(
        (p) =>
          p.food_id === foodId ||
          p.food_name.toLowerCase() === foodName.toLowerCase()
      );

      const updatedPref: PatientCustomPortion = {
        food_id: foodId || `learned-${Date.now()}`,
        food_name: foodName,
        custom_portion_g: avgWeight,
        default_portion_g: defaultWeight,
        correction_count: matchingCorrections.length,
        last_updated: new Date().toISOString(),
        is_active: true,
      };

      if (existingIdx >= 0) {
        currentPortions[existingIdx] = updatedPref;
      } else {
        currentPortions.push(updatedPref);
      }

      savePatientCustomPortions(currentPortions);
      return { learned: true, preference: updatedPref };
    }
  } catch (err) {
    console.error('Erreur active learning:', err);
  }

  return { learned: false };
}

/**
 * Active ou désactive une préférence apprise
 */
export function toggleLearnedPortion(foodId: string, isActive: boolean): PatientCustomPortion[] {
  const portions = loadPatientCustomPortions();
  const updated = portions.map((p) =>
    p.food_id === foodId ? { ...p, is_active: isActive } : p
  );
  savePatientCustomPortions(updated);
  return updated;
}

/**
 * Réinitialise toutes les préférences apprises
 */
export function resetLearnedPortions(): void {
  savePatientCustomPortions([]);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CORRECTIONS);
  }
}
