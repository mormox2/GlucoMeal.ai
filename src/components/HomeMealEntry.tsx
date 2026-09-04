import React from 'react';
import { Camera, Mic, Keyboard, Barcode, Clock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { AnalyzedMeal, InputMode } from '../types';

interface HomeMealEntryProps {
  onSelectMode: (mode: InputMode) => void;
  recentMeals: AnalyzedMeal[];
  onSelectRecentMeal: (meal: AnalyzedMeal) => void;
  onOpenBenchmark: () => void;
}

export const HomeMealEntry: React.FC<HomeMealEntryProps> = ({
  onSelectMode,
  recentMeals,
  onSelectRecentMeal,
  onOpenBenchmark,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Title & Slogan */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Moteur déterministe • Zéro hallucination</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Qu’avez-vous mangé ?
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-md mx-auto">
          Photographiez ou décrivez votre assiette. Estimez vos glucides en quelques secondes.
        </p>
      </div>

      {/* 4 Main Action Buttons (Accessible, tactile, prominent) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-10">
        {/* 1. Photo */}
        <button
          id="btn-mode-photo"
          onClick={() => onSelectMode('photo')}
          className="group relative flex items-center p-4 sm:p-5 rounded-2xl bg-white border-2 border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                Photographier
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Principal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Photo de l’assiette ou sélection de repas type
            </p>
          </div>
        </button>

        {/* 2. Voix */}
        <button
          id="btn-mode-voice"
          onClick={() => onSelectMode('voice')}
          className="group relative flex items-center p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                Décrire à la voix
              </span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                FR / Derja
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              « كلّيت صحن مقرونة و زوز خبزات »
            </p>
          </div>
        </button>

        {/* 3. Texte */}
        <button
          id="btn-mode-text"
          onClick={() => onSelectMode('text')}
          className="group relative flex items-center p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Keyboard className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <span className="font-bold text-slate-900 text-base group-hover:text-indigo-700 transition-colors block">
              Écrire mon repas
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              « 2 tranches de pain + omelette + pomme »
            </p>
          </div>
        </button>

        {/* 4. Code-barres */}
        <button
          id="btn-mode-barcode"
          onClick={() => onSelectMode('barcode')}
          className="group relative flex items-center p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Barcode className="w-6 h-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                Scanner un produit
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                Code EAN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Produit industriel ou photo d’étiquette
            </p>
          </div>
        </button>
      </div>

      {/* Fundamental rule callout banner */}
      <div className="mb-10 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5 font-bold text-xs">
          ≈ g
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-emerald-900 font-semibold block mb-0.5">
            Règle fondamentale GlucoMeal
          </strong>
          L’application affiche toujours une estimation prudente (ex :{' '}
          <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
            ≈ 85 g
          </span>
          ) et jamais de fausse précision clinique trompeuse (comme 85,37 g). Vous gardez toujours le contrôle pour ajuster chaque portion.
        </div>
      </div>

      {/* Section: Derniers Repas */}
      <div className="border-t border-slate-200/70 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Derniers repas enregistrés
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Historique personnel
          </span>
        </div>

        {recentMeals.length > 0 ? (
          <div className="space-y-2.5">
            {recentMeals.slice(0, 4).map((meal) => (
              <div
                key={meal.id}
                id={`recent-meal-${meal.id}`}
                onClick={() => onSelectRecentMeal(meal)}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-base">
                    {meal.meal_name.toLowerCase().includes('couscous') ? '🥣' :
                     meal.meal_name.toLowerCase().includes('lablabi') ? '🥣' :
                     meal.meal_name.toLowerCase().includes('ojja') ? '🍳' :
                     meal.meal_name.toLowerCase().includes('makrouna') || meal.meal_name.toLowerCase().includes('pâte') ? '🍝' :
                     meal.meal_name.toLowerCase().includes('pain') ? '🥖' : '🍽️'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {meal.meal_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {meal.items.map((i) => i.name_fr.split(' ')[0]).join(' + ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                      ≈ {meal.total_carbs} g
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {meal.overall_confidence === 'high' ? '🟢 Élevée' : meal.overall_confidence === 'medium' ? '🟡 Moyenne' : '🔴 Faible'}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-xs text-slate-500">
              Aucun repas encore validé aujourd’hui. Choisissez un mode d’entrée ci-dessus pour estimer votre première assiette !
            </p>
          </div>
        )}
      </div>

      {/* Benchmark CTA */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-amber-900">
            🔬 Dataset de validation tunisien (100 repas)
          </h4>
          <p className="text-xs text-amber-700/90 mt-0.5">
            Testez la précision de reconnaissance sur le benchmark officiel de plats tunisiens.
          </p>
        </div>
        <button
          onClick={onOpenBenchmark}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors cursor-pointer"
        >
          Ouvrir le benchmark
        </button>
      </div>
    </div>
  );
};
