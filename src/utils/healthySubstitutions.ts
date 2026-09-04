import { AnalyzedMeal, MealItem } from '../types';

export interface HealthyAlternativeItem {
  id: string;
  originalFoodName: string;
  substituteFoodName: string;
  substituteFoodNameAr?: string;
  originalCarbs: number;
  newCarbs: number;
  originalGI: number;
  newGI: number;
  healthBenefit: string;
  culinaryTip: string;
}

export interface MealSubstitutionAdvice {
  hasSubstitutions: boolean;
  dishCategory: 'couscous' | 'pasta' | 'lablabi' | 'fried' | 'bread' | 'pastry' | 'general';
  title: string;
  generalHealthTip: string;
  foodSequencingTip: string;
  substitutions: HealthyAlternativeItem[];
  projectedCarbsSavings: number;
  projectedNewTotalCarbs: number;
  projectedNewGI: number;
}

/**
 * Analyse les aliments du repas et génère des recommandations de substitutions culinaires tunisiennes saines
 */
export function getTunisianHealthySubstitutions(meal: AnalyzedMeal): MealSubstitutionAdvice {
  const mealNameLower = (meal.meal_name + ' ' + (meal.notes || '')).toLowerCase();
  const itemsText = meal.items.map((it) => it.name_fr.toLowerCase()).join(' ');

  const allText = `${mealNameLower} ${itemsText}`;

  const substitutions: HealthyAlternativeItem[] = [];
  let category: MealSubstitutionAdvice['dishCategory'] = 'general';
  let title = 'Optimisation Diététique & Indice Glycémique (Cuisine Tunisienne)';
  let generalTip =
    'Favoriser les fibres et l’huile d’olive vierge crue pour lisser l’absorption glucidique des plats tunisiens traditionnels.';
  let sequencingTip =
    'Conseil de séquençage : consommer une entrée de légumes ou crudités (salade tunisienne, salade méchouia) 10 minutes avant les féculents pour réduire le pic glycémique de 30%.';

  // 1. Détection Couscous
  if (allText.includes('couscous') || allText.includes('kousksi') || allText.includes('semoule')) {
    category = 'couscous';
    title = 'Couscous Santé : Semoule d’Orge (Chîr / Malthouth)';
    generalTip =
      'La semoule d’orge (Kousksi Chîr ou Malthouth) est riche en bêta-glucanes qui forment un gel dans l’estomac et diminuent significativement la vitesse d’absorption du glucose.';
    sequencingTip =
      'Commencer par le bouillon de légumes vapeur (courgettes, navets, potiron) avant la semoule d’orge pour saturer les récepteurs d’absorption intestinale.';

    const couscousItem = meal.items.find(
      (it) => it.name_fr.toLowerCase().includes('couscous') || it.name_fr.toLowerCase().includes('semoule')
    );

    if (couscousItem) {
      substitutions.push({
        id: 'sub-couscous',
        originalFoodName: couscousItem.name_fr,
        substituteFoodName: 'Couscous d’Orge complet (Kousksi Chîr / Malthouth) + Courgettes vapeur',
        substituteFoodNameAr: 'كسكسي شعير أو ملثوث بالخضار',
        originalCarbs: couscousItem.calculated_carbs,
        newCarbs: Math.round(couscousItem.calculated_carbs * 0.72),
        originalGI: 65,
        newGI: 40,
        healthBenefit: '-28% de glucides absorbables et réduction du pic glycémique post-prandial.',
        culinaryTip: 'Cuire la semoule d’orge au couscoussier traditionnel à la vapeur avec une pointe d’huile d’olive extra-vierge.',
      });
    }
  }

  // 2. Détection Pâtes / Makrouna / Nwasser
  else if (allText.includes('makrouna') || allText.includes('pâte') || allText.includes('nwasser') || allText.includes('rechta')) {
    category = 'pasta';
    title = 'Makrouna & Pâtes : Cuisson Al Dente & Séquençage Fibres';
    generalTip =
      'La cuisson "Al Dente" préserve la structure cristalline de l’amidon (amidon résistant), abaissant l’index glycémique de 70 à 45.';
    sequencingTip =
      'Manger 3 cuillères de Salade Méchouia ou Omek Houria en entrée avant la Makrouna pour tapisser la muqueuse digestive de fibres.';

    const pastaItem = meal.items.find(
      (it) => it.name_fr.toLowerCase().includes('makrouna') || it.name_fr.toLowerCase().includes('pâte')
    );

    if (pastaItem) {
      substitutions.push({
        id: 'sub-pasta',
        originalFoodName: pastaItem.name_fr,
        substituteFoodName: 'Makrouna Al Dente au blé dur complet + portion Salade Méchouia',
        substituteFoodNameAr: 'مقرونة قمح كامل مع سلطة مشوية',
        originalCarbs: pastaItem.calculated_carbs,
        newCarbs: Math.round(pastaItem.calculated_carbs * 0.85),
        originalGI: 68,
        newGI: 42,
        healthBenefit: 'Ralentit considérablement l’assimilation intestinale et évite l’hyperglycémie à H+2.',
        culinaryTip: 'Stopper la cuisson dès que la pâte est ferme sous la dent et ajouter du persil frais haché en fin de cuisson.',
      });
    }
  }

  // 3. Détection Lablabi
  else if (allText.includes('lablabi') || allText.includes('pois chiche')) {
    category = 'lablabi';
    title = 'Lablabi Équilibré : Moins de pain blanc, plus de pois chiches entiers';
    generalTip =
      'Dans le Lablabi traditionnel, le pain blanc rassis représente 70% de la charge glucidique rapide. En augmentant la part de pois chiches entiers et d’huile d’olive, on stabilise la courbe.';
    sequencingTip =
      'Arroser d’une cuillère à soupe d’huile d’olive crue et de cumin moulu (stimule la digestion et ralentit la vidange de l’estomac).';

    const breadItem = meal.items.find((it) => it.name_fr.toLowerCase().includes('pain'));
    if (breadItem) {
      substitutions.push({
        id: 'sub-lablabi-bread',
        originalFoodName: breadItem.name_fr,
        substituteFoodName: 'Pain Tabouna complet trempé (demi-portion) + Louche de pois chiches',
        substituteFoodNameAr: 'خبز طابونة قمح كامل مع حمص إضافي',
        originalCarbs: breadItem.calculated_carbs,
        newCarbs: Math.round(breadItem.calculated_carbs * 0.55),
        originalGI: 85,
        newGI: 48,
        healthBenefit: 'Divise par deux le pic glucidique rapide du pain blanc de boulangerie.',
        culinaryTip: 'Utiliser du pain complet rassis de la veille découpé en petits morceaux.',
      });
    }
  }

  // 4. Détection Kafteji / Fritures / Brik
  else if (allText.includes('kafteji') || allText.includes('frit') || allText.includes('brik')) {
    category = 'fried';
    title = 'Kafteji & Brik : Cuisson Dorée au Four (Sans bain d’huile)';
    generalTip =
      'La friture en bain d’huile sature les aliments en acides gras chauffés qui induisent une résistance à l’insuline 3 à 5 heures après le repas. La cuisson au four préserve les saveurs sans effet rebond.';
    sequencingTip =
      'Accompagner d’une tranche de foie grillé ou d’un œuf mollet pour équilibrer l’apport protéique.';

    const friedItem = meal.items.find(
      (it) =>
        it.name_fr.toLowerCase().includes('kafteji') ||
        it.name_fr.toLowerCase().includes('brik') ||
        it.name_fr.toLowerCase().includes('frite')
    );

    if (friedItem) {
      substitutions.push({
        id: 'sub-kafteji-oven',
        originalFoodName: friedItem.name_fr,
        substituteFoodName: 'Kafteji rôti au four à l’huile d’olive vierge (poivrons, tomates, courgettes, potiron)',
        substituteFoodNameAr: 'كفتاجي مشوي في الفرن بزيت الزيتون',
        originalCarbs: friedItem.calculated_carbs,
        newCarbs: Math.round(friedItem.calculated_carbs * 0.8),
        originalGI: 55,
        newGI: 35,
        healthBenefit: '-65% de lipides dégradés, améliore la sensibilité à l’insuline et évite l’hyperglycémie tardive.',
        culinaryTip: 'Couper les légumes en dés, arroser d’un filet d’huile d’olive et enfourner 25 min à 200°C avant de hacher aux deux couteaux.',
      });
    }
  }

  // 5. Détection Pain / Baguette seule
  else if (allText.includes('pain') || allText.includes('baguette') || allText.includes('tabouna') || allText.includes('mlawi')) {
    category = 'bread';
    title = 'Pain & Galettes : Pain d’Orge (Khobz Chîr) ou Tabouna Blé Intégral';
    generalTip =
      'La baguette blanche tunisienne a un index glycémique très élevé (~85-90). Le pain complet ou d’orge apporte des fibres insolubles qui ralentissent la vidange gastrique.';
    sequencingTip =
      'Tremper le pain complet dans l’huile d’olive extra-vierge plutôt que de le consommer sec.';

    const breadItem = meal.items.find((it) => it.name_fr.toLowerCase().includes('pain') || it.name_fr.toLowerCase().includes('baguette'));
    if (breadItem) {
      substitutions.push({
        id: 'sub-bread-wholegrain',
        originalFoodName: breadItem.name_fr,
        substituteFoodName: 'Pain Tabouna au blé dur complet (Gamh) ou Pain d’orge (Chîr)',
        substituteFoodNameAr: 'خبز طابونة قمح كامل أو شعير',
        originalCarbs: breadItem.calculated_carbs,
        newCarbs: Math.round(breadItem.calculated_carbs * 0.8),
        originalGI: 85,
        newGI: 48,
        healthBenefit: 'Réduction de 40 points d’index glycémique, saturation durable et glycémie lissée.',
        culinaryTip: 'Privilégier les boulangeries traditionnelles utilisant de la farine bise semi-complète T80 ou T110.',
      });
    }
  }

  // Fallback si pas de substitution directe identifiée
  if (substitutions.length === 0 && meal.items.length > 0) {
    const highestCarbItem = [...meal.items].sort((a, b) => b.calculated_carbs - a.calculated_carbs)[0];
    if (highestCarbItem && highestCarbItem.calculated_carbs > 15) {
      substitutions.push({
        id: 'sub-generic',
        originalFoodName: highestCarbItem.name_fr,
        substituteFoodName: `${highestCarbItem.name_fr} (Portion modérée) + Salade Tunisienne fraîche (tomate, concombre, oignon, menthe)`,
        substituteFoodNameAr: 'وجبة متوازنة مع سلطة تونسية خضراء',
        originalCarbs: highestCarbItem.calculated_carbs,
        newCarbs: Math.round(highestCarbItem.calculated_carbs * 0.78),
        originalGI: 60,
        newGI: 42,
        healthBenefit: 'Augmentation du volume stomacal par les fibres végétales sans élévation glycémique.',
        culinaryTip: 'Ajouter du jus de citron frais et de la menthe séchée pour stimuler la sensibilité insulinique.',
      });
    }
  }

  const carbsSavings = substitutions.reduce((sum, s) => sum + (s.originalCarbs - s.newCarbs), 0);
  const projectedCarbs = Math.max(5, meal.total_carbs - carbsSavings);

  return {
    hasSubstitutions: substitutions.length > 0,
    dishCategory: category,
    title,
    generalHealthTip: generalTip,
    foodSequencingTip: sequencingTip,
    substitutions,
    projectedCarbsSavings: carbsSavings,
    projectedNewTotalCarbs: projectedCarbs,
    projectedNewGI: 42,
  };
}
