import {
  TUNISIAN_FOOD_DATABASE,
  calculateCarbsDeterministically,
  normalizeCulinaryTerm,
} from '../src/data/tunisianFoodDatabase';
import { MealAnalysis, MealItem } from './mealItems';

/**
 * Analyse locale (sans IA) d'une description de repas en français, derja ou arabe : reconnaissance par
 * mots entiers et portions standard. Les glucides viennent toujours de la base nutritionnelle.
 * Renvoie null si aucun aliment n'est reconnu (aucune estimation par défaut).
 */

function fold(input: string): string {
  return normalizeCulinaryTerm(input)
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}.,]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Matcher {
  words?: string[]; // mots entiers (latin)
  phrases?: string[]; // expressions en mots entiers (latin)
  arabic?: string[]; // racines arabes (les préfixes ال، بال، و… sont collés au mot)
}

function matches(q: string, m: Matcher): boolean {
  const padded = ` ${q} `;
  return (
    (m.words || []).some((w) => padded.includes(` ${w} `)) ||
    (m.phrases || []).some((p) => padded.includes(` ${p} `)) ||
    (m.arabic || []).some((a) => q.includes(a))
  );
}

function dbItem(foodId: string) {
  const food = TUNISIAN_FOOD_DATABASE.find((f) => f.id === foodId);
  if (!food) throw new Error(`Aliment ${foodId} absent de la base`);
  return food;
}

/**
 * Volume explicite d'une boisson (ex. « 33 cl », « 1 l », « 500 ml ») en millilitres.
 * Un nombre sans unité de volume (ex. « 500 g de pâtes ») n'est jamais pris pour un volume.
 */
export function extractDrinkVolumeMl(q: string): number | undefined {
  const match = q.match(/(\d+(?:[.,]\d+)?)\s?(ml|cl|l)(?=\s|$)/);
  if (!match) return undefined;
  const value = parseFloat(match[1].replace(',', '.'));
  const ml = match[2] === 'l' ? value * 1000 : match[2] === 'cl' ? value * 10 : value;
  return ml >= 100 && ml <= 2000 ? Math.round(ml) : undefined;
}

const SODA: Matcher = {
  words: ['gazouza', 'gazouz', 'soda', 'coca', 'boga', 'fanta', 'viva', 'apla', 'canette', 'sprite', 'pepsi'],
  phrases: ['boisson gazeuse'],
  arabic: ['قازوز'],
};
const SODA_LIGHT: Matcher = { words: ['light', 'zero'], phrases: ['sans sucre'], arabic: ['لايت', 'زيرو', 'بدون سكر', 'بلا سكر'] };
const BIG: Matcher = { words: ['grande', 'grand', 'bouteille'], arabic: ['كبير'] };
const GLASS: Matcher = { words: ['verre'], arabic: ['كاس'] };
const COUSCOUS: Matcher = { words: ['couscous', 'kousksi', 'kosksi'], arabic: ['كسكسي'] };
const CHICKEN: Matcher = { words: ['poulet', 'djej', 'cuisse'], arabic: ['دجاج'] };
const VEGETABLES: Matcher = { words: ['legume', 'legumes', 'khodhra', 'khodra'], arabic: ['خضر', 'خضار'] };
const LAMB: Matcher = { words: ['agneau', 'allouch', 'viande', 'boeuf', 'veau'], arabic: ['علوش', 'لحم'] };
const POTATO: Matcher = { phrases: ['pomme de terre', 'pommes de terre'], words: ['batata'], arabic: ['بطاط'] };
const FRIES: Matcher = { words: ['frite', 'frites'], phrases: ['batata maklia'], arabic: ['مقلي'] };
const BREAD: Matcher = { words: ['pain', 'khobz', 'baguette', 'tabouna'], arabic: ['خبز', 'طابون'] };
const TABOUNA: Matcher = { words: ['tabouna'], arabic: ['طابون'] };
const LABLABI: Matcher = { words: ['lablabi'], arabic: ['لبلابي'] };
const OJJA: Matcher = { words: ['ojja'], arabic: ['عجة'] };
const PASTA: Matcher = { words: ['makrouna', 'pates', 'pate', 'spaghetti'], arabic: ['مقرون'] };
const BRIK: Matcher = { words: ['brik', 'brika'], arabic: ['بريك'] };
const ORANGE_JUICE: Matcher = { phrases: ['jus d orange', 'jus orange'], arabic: ['عصير برتقال'] };
const ORANGE: Matcher = { words: ['orange', 'oranges'], arabic: ['برتقال'] };
const APPLE: Matcher = { words: ['pomme', 'pommes'], arabic: ['تفاح'] };
const DATES: Matcher = { words: ['datte', 'dattes', 'tmar'], arabic: ['تمر'] };

export function parseTextLocally(input: string): MealAnalysis | null {
  const q = fold(input);
  const items: MealItem[] = [];
  const notes: string[] = [];

  const add = (
    weight: number,
    food: { id?: string; name_fr: string; name_ar: string; category: string; carbs_per_100g: number },
    nameOverride?: { fr: string; ar: string }
  ) => {
    items.push({
      id: `item-${items.length + 1}`,
      food_id: food.id,
      name_fr: nameOverride?.fr || food.name_fr,
      name_ar: nameOverride?.ar || food.name_ar,
      category: food.category,
      estimated_weight_g: weight,
      confirmed_weight_g: weight,
      carbs_per_100g: food.carbs_per_100g,
      calculated_carbs: calculateCarbsDeterministically(weight, food.carbs_per_100g),
      confidence: 'medium',
      original_ai_weight_g: weight,
      is_corrected: false,
    });
  };

  // Boissons gazeuses (sucre rapide)
  if (matches(q, SODA)) {
    const isLight = matches(q, SODA_LIGHT);
    const volume = extractDrinkVolumeMl(q) ?? (matches(q, BIG) ? 500 : matches(q, GLASS) ? 200 : 250);
    add(volume, dbItem(isLight ? 'div-08' : 'div-07'), {
      fr: isLight ? `Boisson gazeuse sans sucre (${volume} ml)` : `Boisson gazeuse sucrée (${volume} ml)`,
      ar: isLight ? 'ڤازوزة لايت / بدون سكر' : 'ڤازوزة',
    });
  }

  if (matches(q, COUSCOUS)) add(220, dbItem('fec-07'));
  const hasChicken = matches(q, CHICKEN);
  if (hasChicken) add(120, dbItem('div-16'));
  if (matches(q, VEGETABLES)) add(100, dbItem('div-17'));
  if (!hasChicken && matches(q, LAMB)) add(120, dbItem('viande-agneau-couscous'));

  if (matches(q, FRIES)) add(150, dbItem('fec-11'));
  else if (matches(q, POTATO)) add(150, dbItem('fec-10'));

  const hasLablabi = matches(q, LABLABI);
  if (matches(q, BREAD)) {
    const countMatch = q.match(/(\d+)\s?(tranche|tranches|morceau|morceaux|bout|bouts)(?=\s|$)/);
    if (hasLablabi && !countMatch) {
      // Le lablabi complet contient déjà son pain trempé : pas de double comptage
      notes.push('Pain du lablabi déjà inclus dans le plat.');
    } else {
      const count = countMatch ? Math.min(10, parseInt(countMatch[1], 10)) : 2;
      add(count * 35, dbItem(matches(q, TABOUNA) ? 'fec-04' : 'fec-01'));
    }
  }

  if (hasLablabi) add(350, dbItem('plat-03'));
  if (matches(q, OJJA)) add(220, dbItem('plat-04'));
  if (matches(q, PASTA)) add(270, dbItem('plat-07'));
  if (matches(q, BRIK)) add(80, dbItem('plat-12'));

  if (matches(q, ORANGE_JUICE)) add(250, dbItem('ind-14'));
  else if (matches(q, ORANGE)) add(150, dbItem('div-02'));
  // « pomme de terre » n'est pas une pomme
  if (matches(q, APPLE) && !matches(q, POTATO)) {
    add(140, { name_fr: 'Pomme', name_ar: 'تفاح', category: 'fruits_legumes', carbs_per_100g: 12 });
  }
  if (matches(q, DATES)) add(35, dbItem('div-01'), { fr: 'Dattes Deglet Nour (3 dattes)', ar: 'دقلة النور (3 تمرات)' });

  if (items.length === 0) return null;

  return {
    meal_name: input.slice(0, 60),
    items,
    total_carbs: items.reduce((sum, item) => sum + item.calculated_carbs, 0),
    overall_confidence: 'medium',
    confidence_score: 70,
    notes: [
      `Décomposition locale par mots-clés (sans IA) : ${items.length} aliment(s) détecté(s) avec des portions standard. Vérifiez chaque portion.`,
      ...notes,
    ].join(' '),
  };
}
