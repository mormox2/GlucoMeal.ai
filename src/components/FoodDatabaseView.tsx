import React, { useState } from 'react';
import { Database, Search, Filter, Sparkles, CheckCircle2, Bookmark, Activity, Info, ChevronRight, X } from 'lucide-react';
import { TUNISIAN_FOOD_DATABASE, getGlycemicCategory } from '../data/tunisianFoodDatabase';
import { FoodCategory, FoodItem } from '../types';

export const FoodDatabaseView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIgFilter, setSelectedIgFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [inspectedFood, setInspectedFood] = useState<FoodItem | null>(null);

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Tous les aliments (200+)', count: TUNISIAN_FOOD_DATABASE.length },
    { id: 'plats', label: '1. Plats & Spécialités', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'plats').length },
    { id: 'feculents', label: '2. Féculents & Pains', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'feculents').length },
    { id: 'legumineuses', label: '3. Légumineuses', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'legumineuses').length },
    { id: 'patisseries', label: '4. Pâtisseries & Douceurs', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'patisseries').length },
    { id: 'fruits_legumes', label: '5. Fruits & Légumes', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'fruits_legumes').length },
    { id: 'produits_industriels', label: '6. Produits industriels', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'produits_industriels').length },
    { id: 'boissons', label: '7. Boissons', count: TUNISIAN_FOOD_DATABASE.filter((f) => f.category === 'boissons').length },
  ];

  const filteredFoods = TUNISIAN_FOOD_DATABASE.filter((food) => {
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      food.name_fr.toLowerCase().includes(q) ||
      food.name_tn.toLowerCase().includes(q) ||
      (food.name_ar && food.name_ar.includes(q)) ||
      food.source.toLowerCase().includes(q);

    // IG filter
    let matchesIg = true;
    if (selectedIgFilter === 'low') {
      matchesIg = (food.glycemic_index || 50) < 55;
    } else if (selectedIgFilter === 'medium') {
      const ig = food.glycemic_index || 50;
      matchesIg = ig >= 55 && ig <= 69;
    } else if (selectedIgFilter === 'high') {
      matchesIg = (food.glycemic_index || 50) >= 70;
    }

    return matchesCategory && matchesSearch && matchesIg;
  });

  return (
    <div className="max-w-6xl 2xl:max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Référentiel certifié • INNT Tunis & CIQUAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Base Alimentaire Tunisienne & Maghrébine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            200+ aliments avec teneur certifiée en glucides pour 100 g, Index Glycémique (IG) et Charge Glycémique (CG). C’est cette base déterministe qui élimine tout risque d’hallucination par l’IA.
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher : kafteji, makrouna, mloukhiya, brik, fricassé, chorba, tabouna, couscous..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Suggestions rapides :
          </span>
          {[
            'Couscous',
            "Brik à l'oeuf",
            'Plat Tunisien',
            'Fricassé',
            'Kafteji',
            'Ojja',
            'Chorba',
            'Lablabi',
            'Makroudh',
            'Bambalouni',
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSearchQuery(item);
                setSelectedCategory('all');
                setSelectedIgFilter('all');
              }}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer border ${
                searchQuery.toLowerCase() === item.toLowerCase()
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                  : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 border-emerald-200/70'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Categories Chips */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Glycemic Index (IG) Filter Toolbar */}
        <div className="flex items-center gap-2 pt-1 text-xs flex-wrap border-t border-slate-100">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Filtre Index Glycémique :
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedIgFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedIgFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedIgFilter('low')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedIgFilter === 'low'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>IG Bas (&lt; 55)</span>
            </button>
            <button
              onClick={() => setSelectedIgFilter('medium')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedIgFilter === 'medium'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>IG Moyen (55-69)</span>
            </button>
            <button
              onClick={() => setSelectedIgFilter('high')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                selectedIgFilter === 'high'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>IG Élevé (≥ 70)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Affichage de {filteredFoods.length} aliment(s) certifié(s)</span>
          <span className="text-slate-400">Glucides • IG • Charge Glycémique (CG)</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filteredFoods.length > 0 ? (
            filteredFoods.map((food) => {
              const carbsPerPortion = Math.round((food.default_portion_g * food.carbs_per_100g) / 100);
              const ig = food.glycemic_index || 50;
              const cg = food.glycemic_load || Math.round((ig * carbsPerPortion) / 100);
              const igCat = getGlycemicCategory(ig);

              return (
                <div
                  key={food.id}
                  onClick={() => setInspectedFood(food)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {food.name_fr}
                      </span>
                      {food.name_ar && (
                        <span className="text-xs text-slate-500 font-medium font-arabic">
                          ({food.name_ar})
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {food.category}
                      </span>

                      {/* IG Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          igCat.color === 'emerald'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : igCat.color === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={igCat.description}
                      >
                        IG {ig} ({igCat.label})
                      </span>

                      {/* CG Badge */}
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        CG {cg}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      Nom tunisien (Derja) : <span className="font-semibold text-slate-700">{food.name_tn}</span> • Portion : {food.serving_unit_description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        {food.carbs_per_100g} g / 100 g
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Portion : {food.default_portion_g} g
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right min-w-22">
                      <span className="text-xs font-extrabold text-emerald-800 block">
                        ≈ {carbsPerPortion} g
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        par portion
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 sm:p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">
                  Aucun aliment trouvé {searchQuery ? `pour « ${searchQuery} »` : 'avec ces critères'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  La base tunisienne compte plus de 200 plats certifiés. Cliquez sur une suggestion populaire pour lancer la recherche :
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto pt-1">
                {[
                  'Couscous',
                  "Brik à l'oeuf",
                  'Plat Tunisien',
                  'Fricassé',
                  'Kafteji',
                  'Ojja',
                  'Chorba',
                  'Lablabi',
                  'Makroudh',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item);
                      setSelectedCategory('all');
                      setSelectedIgFilter('all');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedIgFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Fiche Nutritionnelle Détaillée Aliment Tunisien */}
      {inspectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Fiche Nutritionnelle Spécialité Tunisienne
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {inspectedFood.name_fr}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectedFood.name_ar} • {inspectedFood.name_tn}
                </p>
              </div>
              <button
                onClick={() => setInspectedFood(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Portion Standard */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[11px]">Portion type recommandée :</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {inspectedFood.serving_unit_description}
                </span>
              </div>

              {/* Composition Macro Nutritionnelle */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase">Glucides</span>
                  <span className="text-base font-black text-emerald-900">{inspectedFood.carbs_per_100g} g</span>
                  <span className="text-[10px] text-emerald-600">/ 100 g</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-700 block uppercase">Protéines</span>
                  <span className="text-base font-black text-blue-900">{inspectedFood.protein_per_100g} g</span>
                  <span className="text-[10px] text-blue-600">/ 100 g</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 block uppercase">Lipides</span>
                  <span className="text-base font-black text-amber-900">{inspectedFood.fat_per_100g} g</span>
                  <span className="text-[10px] text-amber-600">/ 100 g</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-700 block uppercase">Fibres</span>
                  <span className="text-base font-black text-purple-900">{inspectedFood.fiber_per_100g} g</span>
                  <span className="text-[10px] text-purple-600">/ 100 g</span>
                </div>
              </div>

              {/* Focus Diabète Type 1 : IG & CG */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Impact Glycémique DT1
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Index Glycémique : {inspectedFood.glycemic_index || 50}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                  <span className="text-slate-300">Charge glycémique (CG) par portion :</span>
                  <span className="font-extrabold text-emerald-300 text-sm">
                    {inspectedFood.glycemic_load || Math.round(((inspectedFood.glycemic_index || 50) * inspectedFood.default_portion_g * inspectedFood.carbs_per_100g) / 10000)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                  {getGlycemicCategory(inspectedFood.glycemic_index).description}.
                  {inspectedFood.id === 'plat-mloukhiya-01' && " Note DT1 : Les lipides abondants de la mloukhiya ralentissent l'absorption du pain d'accompagnement (bolus carré/mixte recommandé sous pompe)."}
                  {inspectedFood.id === 'plat-makrouna-salsa-01' && " Note DT1 : Teneur glucidique élevée, surveiller la glycémie 2h à 3h après le repas."}
                  {(inspectedFood.category === 'viandes_proteines' || inspectedFood.carbs_per_100g === 0) && " Note DT1 : Les protéines pures ne contiennent pas de glucides directs. Cependant, un apport protéique et lipidique important retarde la vidange gastrique et peut nécessiter un bolus prolongé (dual-wave) 2h à 4h après le repas."}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Source officielle : {inspectedFood.source}</span>
                <span>Fiabilité : {inspectedFood.confidence_base === 'high' ? 'Certifié 100%' : 'Standard'}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectedFood(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

