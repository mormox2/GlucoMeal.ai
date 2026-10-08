/**
 * Recherche d'un produit par code-barres : petit catalogue de démonstration, puis OpenFoodFacts.
 * Un code inconnu ou sans valeur de glucides renvoie une erreur (jamais de valeur générique).
 */
export type BarcodeLookupError = { error: string; status: number; code: string };

export async function lookupBarcodeProduct(barcode: string) {
  const cleanCode = barcode.replace(/[^0-9]/g, '');

  // 1. Petit catalogue local d'exemples de démonstration (codes proposés dans l'écran code-barres)
  const localTunisianCatalog: Record<string, any> = {
    '6191234567890': {
      name_fr: 'Boga Cidre (Canette 250 ml)',
      name_ar: 'بوغة سيدر',
      portion_g: 250,
      carbs_per_100g: 10.5,
      calculated_carbs: 26,
      source: 'SFBT Tunisie',
      glycemic_index: 75,
    },
    '6191234567891': {
      name_fr: 'Boga Lim (Canette 250 ml)',
      name_ar: 'بوغة ليم',
      portion_g: 250,
      carbs_per_100g: 10.0,
      calculated_carbs: 25,
      source: 'SFBT Tunisie',
      glycemic_index: 75,
    },
    '6191234567892': {
      name_fr: 'Boga Light / Sans Sucre (Canette 250 ml)',
      name_ar: 'بوغة لايت',
      portion_g: 250,
      carbs_per_100g: 0,
      calculated_carbs: 0,
      source: 'SFBT Tunisie',
      glycemic_index: 0,
    },
    '6194000123456': {
      name_fr: 'Biscuits Saïda Carré (Paquet 4 biscuits)',
      name_ar: 'بسكويت سيدة مربع',
      portion_g: 30,
      carbs_per_100g: 74,
      calculated_carbs: 22,
      source: 'Saïda Group Tunisie',
      glycemic_index: 70,
    },
    '6194000654321': {
      name_fr: 'Biscuits Saïda Major Chocolat (3 biscuits)',
      name_ar: 'بسكويت ماجور شوكولا',
      portion_g: 35,
      carbs_per_100g: 68,
      calculated_carbs: 24,
      source: 'Saïda Group Tunisie',
      glycemic_index: 68,
    },
    '6192000543210': {
      name_fr: 'Yaourt Délice Danone à boire fraise',
      name_ar: 'ياغورت ديليس فراولة',
      portion_g: 180,
      carbs_per_100g: 12.0,
      calculated_carbs: 22,
      source: 'Danone Délice Tunisie',
      glycemic_index: 45,
    },
    '6192000111222': {
      name_fr: 'Yaourt Délice Nature sans sucre',
      name_ar: 'ياغورت ديليس طبيعي',
      portion_g: 110,
      carbs_per_100g: 4.2,
      calculated_carbs: 5,
      source: 'Danone Délice Tunisie',
      glycemic_index: 35,
    },
    '6191000888999': {
      name_fr: 'Double concentré de tomates Sicam (1 cuillère à soupe)',
      name_ar: 'طماطم معجونة سيكام',
      portion_g: 30,
      carbs_per_100g: 14.5,
      calculated_carbs: 4,
      source: 'Sicam Agro-Alimentaire Tunisie',
      glycemic_index: 38,
    },
    '6195550001112': {
      name_fr: 'Couscous Moyen Safir (Portion crue 80g)',
      name_ar: 'كسكسي سفير متوسط',
      portion_g: 80,
      carbs_per_100g: 72,
      calculated_carbs: 58,
      source: 'Safir Semoulerie Tunisie',
      glycemic_index: 65,
    },
    '6193330004445': {
      name_fr: 'Eau minérale naturelle Sabrine (Bouteille 500 ml)',
      name_ar: 'ماء معدني صبرين',
      portion_g: 500,
      carbs_per_100g: 0,
      calculated_carbs: 0,
      source: 'Sabrine Tunisie',
      glycemic_index: 0,
    },
  };

  if (localTunisianCatalog[cleanCode]) {
    const prod = localTunisianCatalog[cleanCode];
    return {
      meal_name: prod.name_fr,
      meal_name_ar: prod.name_ar || '',
      items: [
        {
          id: 'item-1',
          name_fr: prod.name_fr,
          name_ar: prod.name_ar,
          estimated_weight_g: prod.portion_g,
          confirmed_weight_g: prod.portion_g,
          carbs_per_100g: prod.carbs_per_100g,
          calculated_carbs: prod.calculated_carbs,
          confidence: 'high' as const,
          original_ai_weight_g: prod.portion_g,
          is_corrected: false,
          glycemic_index: prod.glycemic_index || 60,
        },
      ],
      total_carbs: prod.calculated_carbs,
      overall_confidence: 'high' as const,
      confidence_score: 90,
      notes: `Exemple de démonstration (${prod.source}) : vérifiez les glucides et la portion indiqués sur l’emballage.`,
    };
  }

  // 2. Query OpenFoodFacts API for international & Tunisian registered products
  if (cleanCode.length >= 8) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GlucoMealAI-T1D/1.0 (contact@glucomal.app)',
        },
      });
      clearTimeout(timeoutId);

      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          const name = p.product_name_fr || p.product_name || p.generic_name || `Produit EAN ${cleanCode}`;
          const brand = p.brands ? ` (${p.brands})` : '';
          const fullName = `${name}${brand}`.trim();

          const nutriments = p.nutriments || {};
          const carbs100g =
            typeof nutriments.carbohydrates_100g === 'number'
              ? nutriments.carbohydrates_100g
              : typeof nutriments['carbohydrates_value'] === 'number'
              ? nutriments['carbohydrates_value']
              : null;

          // Pas de valeur glucidique publiée : on ne devine pas
          if (carbs100g === null || !Number.isFinite(carbs100g) || carbs100g < 0) {
            const missing: BarcodeLookupError = {
              status: 422,
              code: 'CARBS_UNAVAILABLE',
              error: `Produit trouvé (${fullName}) mais sans valeur de glucides publiée. Saisissez la valeur indiquée sur l’emballage.`,
            };
            return missing;
          }

          // Determine portion
          let portionG = 100;
          if (typeof nutriments.serving_quantity === 'number' && nutriments.serving_quantity > 0) {
            portionG = Math.round(nutriments.serving_quantity);
          } else if (typeof p.serving_quantity === 'number' && p.serving_quantity > 0) {
            portionG = Math.round(p.serving_quantity);
          } else if (p.serving_size) {
            const match = p.serving_size.match(/(\d+[\.,]?\d*)\s*(g|ml)/i);
            if (match) {
              portionG = Math.round(parseFloat(match[1].replace(',', '.')));
            }
          }

          const calculatedCarbs = Math.round((portionG * carbs100g) / 100);
          const sugars = nutriments.sugars_100g || 0;

          return {
            meal_name: fullName,
            meal_name_ar: p.product_name_ar || '',
            items: [
              {
                id: 'item-1',
                name_fr: fullName,
                name_ar: p.product_name_ar || '',
                estimated_weight_g: portionG,
                confirmed_weight_g: portionG,
                carbs_per_100g: Math.round(carbs100g * 10) / 10,
                calculated_carbs: calculatedCarbs,
                confidence: 'high' as const,
                original_ai_weight_g: portionG,
                is_corrected: false,
                glycemic_index: sugars > 15 ? 75 : 55,
              },
            ],
            total_carbs: calculatedCarbs,
            overall_confidence: 'high' as const,
            confidence_score: 90,
            notes: `Données OpenFoodFacts (base collaborative) : ${carbs100g}g glucides pour 100g. Portion : ${portionG}g. Vérifiez avec l’emballage.`,
          };
        }
      }
    } catch (offErr: any) {
      console.warn('OpenFoodFacts fetch failed or timed out:', offErr.message);
    }
  }

  // 3. Code inconnu : aucune valeur générique (elle pourrait fausser la dose d'insuline)
  const notFound: BarcodeLookupError = {
    status: 404,
    code: 'BARCODE_NOT_FOUND',
    error: `Produit EAN ${cleanCode} introuvable. Scannez l’étiquette nutritionnelle ou saisissez les glucides manuellement.`,
  };
  return notFound;
}

// Estimation par mots-clés pour un aliment absent de la base. Les aliments concernés sont toujours
// marqués en confiance 'low' pour que l'utilisateur vérifie la valeur avant de valider.
