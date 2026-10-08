import { describe, it, expect } from 'vitest';
import { TUNISIAN_FOOD_DATABASE, findFoodInDatabase, findFoodMatch } from '../tunisianFoodDatabase';

describe('Recherche d’aliments (findFoodInDatabase) : non-régression', () => {
  // Noms typiques renvoyés par l'IA → aliment attendu (id). Plusieurs de ces cas renvoyaient
  // auparavant un aliment sans rapport (ex. « Couscous au poulet » → poulet seul, 0 g de glucides).
  it.each([
    ['Couscous (semoule cuite vapeur)', 'fec-07'],
    ['Couscous au poulet', 'plat-new-couscous-poulet'],
    ['Couscous agneau légumes', 'plat-01'],
    ['Couscous Osban traditionnel', 'plat-new-couscous-osban'],
    ['Légumes de couscous', 'div-17'],
    ['Poulet mijoté', 'div-16'],
    ['Boisson gazeuse sucrée (ڤازوزة صغيرة)', 'div-07'],
    ['Coca zéro', 'div-08'],
    ['Boisson gazeuse sans sucre', 'div-08'],
    ['قازوزة لايت', 'div-08'],
    ['Pain tabouna', 'fec-04'],
    ['Pain', 'fec-01'],
    ['Pois chiches en bouillon', 'leg-01'],
    ['Pommes de terre', 'fec-10'],
    ['Lait', 'ind-09'],
    ['Dattes', 'div-01'],
    ['Ojja merguez', 'plat-04'],
    ['Riz', 'fec-09'],
    ['كسكسي', 'fec-07'],
    ['خبز', 'fec-01'],
    ['لبلابي', 'plat-03'],
    ['Oeuf', 'viande-oeuf-dur'],
  ])('« %s » → %s', (query, expectedId) => {
    expect(findFoodInDatabase(query)?.id).toBe(expectedId);
  });

  // Noms qui correspondaient à tort à un plat contenant le mot (glucides faux)
  it.each(['Sucre', 'Huile d’olive', 'Eau', 'Sauce tomate', 'Miel', 'Amandes', 'Tomates', 'سكر'])(
    '« %s » ne correspond plus à un plat sans rapport',
    (query) => {
      expect(findFoodInDatabase(query)).toBeUndefined();
    }
  );

  it('ne rattache jamais une négation (« sans sucre ») au mot nié', () => {
    const match = findFoodInDatabase('Yaourt sans sucre');
    expect(match?.carbs_per_100g ?? 0).toBeLessThan(6);
  });

  it('signale les correspondances approximatives (début de nom seulement)', () => {
    expect(findFoodMatch('Semoule')?.quality).toBe('prefix');
    expect(findFoodMatch('Couscous au poulet')?.quality).toBe('exact');
  });

  it('retrouve chaque aliment de la base par son nom et ses alias (ou un doublon portant exactement ce nom)', () => {
    for (const item of TUNISIAN_FOOD_DATABASE) {
      for (const name of [item.name_fr, ...(item.aliases || [])]) {
        const match = findFoodMatch(name);
        expect(match, name).toBeDefined();
        if (match!.item.id !== item.id) {
          // Égalité entre doublons de la base : l'aliment retenu porte exactement ce nom
          expect(match!.quality, `${name} → ${match!.item.id}`).toBe('exact');
        }
      }
    }
  });
});
