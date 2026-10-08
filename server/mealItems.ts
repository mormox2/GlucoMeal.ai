import { findFoodMatch, calculateCarbsDeterministically } from '../src/data/tunisianFoodDatabase';

export type Confidence = 'high' | 'medium' | 'low';

// Bornes de plausibilité d'une portion estimée par l'IA (en grammes)
export const PORTION_BOUNDS_G = { min: 5, max: 1500 };

export interface AiComponent {
  name_fr?: string;
  name_ar?: string;
  estimated_weight_g?: number;
  confidence?: string;
}

export interface MealItem {
  id: string;
  food_id?: string;
  name_fr: string;
  name_ar: string;
  category: string;
  estimated_weight_g: number;
  confirmed_weight_g: number;
  carbs_per_100g: number;
  calculated_carbs: number;
  confidence: Confidence;
  original_ai_weight_g: number;
  is_corrected: boolean;
  notes?: string;
}

export interface MealAnalysis {
  meal_name: string;
  meal_name_ar?: string;
  notes: string;
  items: MealItem[];
  total_carbs: number;
  overall_confidence: Confidence;
  confidence_score: number;
}

/**
 * Estimation par mots-clés pour un aliment absent de la base. Les aliments concernés sont toujours
 * marqués en confiance 'low' pour que l'utilisateur vérifie la valeur avant de valider.
 */
export function estimateCarbsFallback(name: string): number {
  const q = name.toLowerCase();
  if (/sans sucre|light|z[ée]ro/.test(q)) return 5;
  if (/^(sucre|sugar|سكر)/.test(q)) return 100;
  if (/^(miel|عسل)/.test(q)) return 82;
  if (/(^|[\s'’])(huile|beurre|eau|caf[ée]|th[ée]|thon|poisson|oeuf|œuf|fromage)(?=$|[\s,.'’])/.test(q)) return 1;
  if (q.includes('pain') || q.includes('baguette') || q.includes('tabouna') || q.includes('mlawi')) return 48;
  if (q.includes('riz') || q.includes('rouz') || q.includes('semoule') || q.includes('couscous')) return 28;
  if (q.includes('pâte') || q.includes('pate') || q.includes('makrouna') || q.includes('nwasser')) return 24;
  if (q.includes('pomme de terre') || q.includes('frite') || q.includes('batata')) return 22;
  if (q.includes('pois chiche') || q.includes('lentille') || q.includes('fève') || q.includes('loubia')) return 18;
  if (q.includes('viande') || q.includes('poulet') || q.includes('poisson') || q.includes('agneau') || q.includes('œuf')) return 1;
  if (q.includes('sauce') || q.includes('tomate') || q.includes('légume') || q.includes('ojja')) return 5;
  if (q.includes('sucre') || q.includes('gateau') || q.includes('makroudh') || q.includes('baklawa')) return 60;
  return 15;
}

function normalizeConfidence(value: unknown, fallback: Confidence): Confidence {
  return value === 'high' || value === 'medium' || value === 'low' ? value : fallback;
}

/**
 * Convertit un composant renvoyé par l'IA en aliment du repas : les glucides sont toujours
 * calculés de façon déterministe à partir de la base. Un aliment absent ou approximatif de la base,
 * ou une portion hors bornes, est marqué en confiance faible.
 */
export function componentToItem(comp: AiComponent, idx: number, defaultConfidence: Confidence): MealItem {
  const name = (comp.name_fr || comp.name_ar || 'Aliment').toString().slice(0, 120);
  const match = findFoodMatch(name) || (comp.name_ar ? findFoodMatch(comp.name_ar) : undefined);
  const matchedFood = match?.item;
  const isApproximate = !match || match.quality === 'prefix';

  const rawWeight = Number(comp.estimated_weight_g);
  let weight = Number.isFinite(rawWeight) && rawWeight > 0 ? Math.round(rawWeight) : 100;
  let outOfBounds = !(Number.isFinite(rawWeight) && rawWeight > 0);
  if (weight < PORTION_BOUNDS_G.min || weight > PORTION_BOUNDS_G.max) {
    weight = Math.min(PORTION_BOUNDS_G.max, Math.max(PORTION_BOUNDS_G.min, weight));
    outOfBounds = true;
  }

  const carbsPer100g = matchedFood ? matchedFood.carbs_per_100g : estimateCarbsFallback(name);
  const confidence: Confidence =
    isApproximate || outOfBounds ? 'low' : normalizeConfidence(comp.confidence, defaultConfidence);

  return {
    id: `item-${idx + 1}`,
    food_id: matchedFood?.id,
    name_fr: matchedFood?.name_fr || name,
    name_ar: (comp.name_ar || matchedFood?.name_ar || '').toString().slice(0, 120),
    category: matchedFood?.category || 'plats',
    estimated_weight_g: weight,
    confirmed_weight_g: weight,
    carbs_per_100g: carbsPer100g,
    calculated_carbs: calculateCarbsDeterministically(weight, carbsPer100g),
    confidence,
    original_ai_weight_g: weight,
    is_corrected: false,
    notes: outOfBounds ? 'Portion estimée hors des bornes plausibles : vérifiez le poids.' : undefined,
  };
}

export function totalCarbs(items: MealItem[]): number {
  return items.reduce((sum, item) => sum + item.calculated_carbs, 0);
}

export function hasLowConfidenceItem(items: MealItem[]): boolean {
  return items.some((item) => item.confidence === 'low');
}
