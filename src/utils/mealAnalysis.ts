import { AnalyzedMeal, ConfidenceLevel, InputMode, MealComponentItem } from '../types';
import { PresetMealSample } from '../data/sampleMeals';
import { calculateCarbsDeterministically } from '../data/tunisianFoodDatabase';

/**
 * Erreur d'analyse de repas : aucune estimation de glucides n'est disponible.
 * Le parcours repas s'arrête et l'utilisateur doit réessayer ou saisir son repas manuellement :
 * on ne propose jamais de glucides (ni de bolus) inventés.
 */
export class MealAnalysisError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'MealAnalysisError';
    this.code = code;
    this.status = status;
  }
}

export interface MealAnalysisResult {
  meal_name?: string;
  meal_name_ar?: string;
  notes?: string;
  items: MealComponentItem[];
  total_carbs: number;
  overall_confidence: ConfidenceLevel;
  confidence_score: number;
}

function messageForStatus(status: number): string {
  if (status === 413) return 'Photo trop volumineuse pour être analysée. Réessayez avec une image plus légère.';
  if (status === 429) return 'Trop de demandes d’analyse. Patientez une minute avant de réessayer.';
  if (status >= 500) return 'Service d’analyse indisponible. Réessayez ou saisissez votre repas manuellement.';
  return `Analyse impossible (HTTP ${status}).`;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Vérifie la structure d'une réponse d'analyse et recalcule le total à partir des aliments,
 * pour que la dose ne repose jamais sur un total absent ou incohérent.
 */
export function parseMealAnalysisResponse(data: any): MealAnalysisResult {
  const rawItems: any[] = Array.isArray(data?.items) ? data.items : [];
  if (rawItems.length === 0) {
    throw new MealAnalysisError('Aucun aliment reconnu dans ce repas.', 'NO_FOOD_RECOGNIZED');
  }
  const items: MealComponentItem[] = rawItems.map((item, idx) => {
    if (
      typeof item?.name_fr !== 'string' ||
      !isValidNumber(item.estimated_weight_g) ||
      !isValidNumber(item.carbs_per_100g) ||
      !isValidNumber(item.calculated_carbs)
    ) {
      throw new MealAnalysisError('Réponse d’analyse invalide : données nutritionnelles manquantes.', 'INVALID_RESPONSE');
    }
    return { ...item, id: item.id || `item-${idx + 1}` };
  });
  const totalCarbs = items.reduce((sum, item) => sum + item.calculated_carbs, 0);
  const confidence: ConfidenceLevel = ['high', 'medium', 'low'].includes(data.overall_confidence)
    ? data.overall_confidence
    : 'medium';

  return {
    meal_name: typeof data.meal_name === 'string' ? data.meal_name : undefined,
    meal_name_ar: typeof data.meal_name_ar === 'string' ? data.meal_name_ar : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    items,
    total_carbs: totalCarbs,
    overall_confidence: confidence,
    confidence_score: isValidNumber(data.confidence_score) ? data.confidence_score : 50,
  };
}

/**
 * Appelle l'API d'analyse et lève une MealAnalysisError en cas d'échec (réseau, HTTP ou réponse invalide).
 */
export async function requestMealAnalysis(body: Record<string, unknown>): Promise<MealAnalysisResult> {
  let response: Response;
  try {
    response = await fetch('/api/analyze-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new MealAnalysisError('Connexion au serveur d’analyse impossible. Vérifiez votre connexion internet.', 'NETWORK');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new MealAnalysisError(data?.error || messageForStatus(response.status), data?.code, response.status);
  }
  return parseMealAnalysisResponse(data);
}

/**
 * Construit un repas à partir d'un exemple de démonstration (composition de référence connue),
 * sans appel à l'IA : l'image d'exemple n'est pas analysée.
 */
export function buildMealFromPreset(preset: PresetMealSample): MealAnalysisResult {
  const items: MealComponentItem[] = preset.default_items.map((item, idx) => ({
    id: `item-${idx + 1}`,
    name_fr: item.name_fr,
    name_ar: item.name_ar,
    estimated_weight_g: item.estimated_weight_g,
    confirmed_weight_g: item.estimated_weight_g,
    carbs_per_100g: item.carbs_per_100g,
    calculated_carbs: calculateCarbsDeterministically(item.estimated_weight_g, item.carbs_per_100g),
    confidence: item.confidence,
    original_ai_weight_g: item.estimated_weight_g,
    is_corrected: false,
  }));
  return {
    meal_name: preset.name,
    meal_name_ar: preset.name_ar,
    notes: 'Exemple de démonstration : composition de référence (non analysée par IA). Ajustez chaque portion à votre assiette réelle.',
    items,
    total_carbs: items.reduce((sum, item) => sum + item.calculated_carbs, 0),
    overall_confidence: 'medium',
    confidence_score: 60,
  };
}

export function toAnalyzedMeal(
  result: MealAnalysisResult,
  inputType: InputMode,
  defaultName: string,
  userId: string
): AnalyzedMeal {
  return {
    id: `meal-${Date.now()}`,
    user_id: userId,
    meal_name: result.meal_name || defaultName,
    meal_name_ar: result.meal_name_ar || '',
    created_at: new Date().toISOString(),
    input_type: inputType,
    total_carbs: result.total_carbs,
    overall_confidence: result.overall_confidence,
    confidence_score: result.confidence_score,
    notes: result.notes,
    items: result.items,
  };
}
