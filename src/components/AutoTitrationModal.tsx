import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AnalyzedMeal, UserProfileDT1, MealSlot } from '../types';
import { analyzePatientTitration, SlotTitrationAnalysis } from '../utils/autoTitration';

interface AutoTitrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meals: AnalyzedMeal[];
  userProfile: UserProfileDT1;
  onApplyNewRatio: (slot: MealSlot, newRatio: number) => void;
}

export const AutoTitrationModal: React.FC<AutoTitrationModalProps> = ({
  isOpen,
  onClose,
  meals,
  userProfile,
  onApplyNewRatio,
}) => {
  const [appliedSlots, setAppliedSlots] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const report = analyzePatientTitration(meals, userProfile);

  const handleApply = (slot: MealSlot, newRatio: number) => {
    onApplyNewRatio(slot, newRatio);
    setAppliedSlots((prev) => ({ ...prev, [slot]: true }));
    setTimeout(() => {
      setAppliedSlots((prev) => ({ ...prev, [slot]: false }));
    }, 3000);
  };

  const slotKeys: MealSlot[] = ['morning', 'lunch', 'dinner', 'snack'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40">
                  Algorithmique DT1 • Consensus SFD/ADA
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                Auto-Titration Intelligente des Ratios I:G
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Summary Bar */}
        <div className="bg-emerald-50/80 p-4 border-b border-emerald-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 font-medium">Contrôles H+2 analysés : </span>
              <span className="font-extrabold text-slate-800">{report.totalPostPrandials} repas</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Temps dans la Cible (+2h) : </span>
              <span className={`font-black ${report.globalTimeInRangePercent >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {report.globalTimeInRangePercent}%
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pas de palier sécurisé : ±15% max</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {report.priorityAlert && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Alerte Prioritaire : </span>
                <span>{report.priorityAlert}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600">
            L'algorithme de rétro-contrôle compare vos glycémies 2h post-prandiales à votre profil DT1. Lorsque des écarts répétés sont observés, une titration progressive vous est proposée afin d’ajuster précisément votre nombre de grammes de glucides couverts par 1 unité d’insuline.
          </p>

          {/* Cards for each slot */}
          <div className="space-y-3.5">
            {slotKeys.map((slot) => {
              const info: SlotTitrationAnalysis = report.slots[slot];
              const isApplied = appliedSlots[slot];
              const hasChange = info.status === 'increase_insulin' || info.status === 'decrease_insulin';

              return (
                <div
                  key={slot}
                  className={`p-4 rounded-2xl border transition-all ${
                    info.status === 'increase_insulin'
                      ? 'border-amber-200 bg-amber-50/40'
                      : info.status === 'decrease_insulin'
                      ? 'border-rose-200 bg-rose-50/40'
                      : info.status === 'optimal'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{info.slotLabel}</h3>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            info.status === 'optimal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : info.status === 'increase_insulin'
                              ? 'bg-amber-100 text-amber-900'
                              : info.status === 'decrease_insulin'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {info.recommendationTitle}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>{info.totalRecordedPostPrandial} contrôles H+2</span>
                        <span>•</span>
                        <span>Cible : {info.targetPercentage}%</span>
                        {info.hyperPercentage > 0 && (
                          <span className="text-amber-700 font-semibold">• Hyper : {info.hyperPercentage}%</span>
                        )}
                        {info.hypoPercentage > 0 && (
                          <span className="text-rose-700 font-semibold">• Hypo : {info.hypoPercentage}%</span>
                        )}
                      </div>
                    </div>

                    {/* Ratio Comparison Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Ratio Actuel</span>
                        <span className="text-xs font-black text-slate-700">1 UI / {info.currentRatio} g</span>
                      </div>

                      {hasChange && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-black text-emerald-600 block">Suggéré</span>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              1 UI / {info.suggestedRatio} g
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clinical Explanation */}
                  <p className="text-xs text-slate-700 mt-3 pt-2.5 border-t border-slate-200/60 leading-relaxed">
                    {info.clinicalRationale}
                  </p>

                  {/* Action button if change recommended */}
                  {hasChange && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleApply(slot, info.suggestedRatio)}
                        disabled={isApplied}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Ratio appliqué au profil !</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Appliquer ce ratio ({info.suggestedRatio} g/UI)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Toute modification peut être validée avec votre diabétologue.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
