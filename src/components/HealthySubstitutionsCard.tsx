import React, { useState } from 'react';
import {
  Sparkles,
  Leaf,
  TrendingDown,
  Clock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Utensils,
  Lightbulb,
} from 'lucide-react';
import { AnalyzedMeal } from '../types';
import { getTunisianHealthySubstitutions, MealSubstitutionAdvice } from '../utils/healthySubstitutions';

interface HealthySubstitutionsCardProps {
  meal: AnalyzedMeal;
  onApplyOptimizedRecipe?: (optimizedTotalCarbs: number) => void;
}

export const HealthySubstitutionsCard: React.FC<HealthySubstitutionsCardProps> = ({
  meal,
  onApplyOptimizedRecipe,
}) => {
  const [isApplied, setIsApplied] = useState(false);
  const advice: MealSubstitutionAdvice = getTunisianHealthySubstitutions(meal);

  if (!advice.hasSubstitutions) return null;

  const handleApply = () => {
    if (onApplyOptimizedRecipe) {
      onApplyOptimizedRecipe(advice.projectedNewTotalCarbs);
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 4000);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Leaf className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                Nutrition Tunisienne Saine
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{advice.title}</h3>
          </div>
        </div>

        {advice.projectedCarbsSavings > 0 && (
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Économie glucides</span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              -{advice.projectedCarbsSavings} g
            </span>
          </div>
        )}
      </div>

      {/* Séquençage alimentaire (Food Sequencing) */}
      <div className="p-3 rounded-2xl bg-white border border-emerald-100/90 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Règle de Séquençage (Lissage du Pic Glycémique)</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {advice.foodSequencingTip}
        </p>
      </div>

      {/* Liste des substitutions concrètes */}
      <div className="space-y-2">
        {advice.substitutions.map((sub) => (
          <div
            key={sub.id}
            className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 text-xs space-y-2 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-slate-400 line-through text-[11px] block">{sub.originalFoodName}</span>
                <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  {sub.substituteFoodName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-500">
                  {sub.originalCarbs}g → <strong className="text-emerald-700">{sub.newCarbs}g</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                  IG {sub.newGI}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
              💡 <em>{sub.healthBenefit}</em> {sub.culinaryTip}
            </p>
          </div>
        ))}
      </div>

      {/* Bouton pour simuler et recalculer le repas */}
      {onApplyOptimizedRecipe && (
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplied}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isApplied
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recette optimisée appliquée (≈ {advice.projectedNewTotalCarbs} g) !</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Simuler la variante saine (≈ {advice.projectedNewTotalCarbs} g de glucides)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
