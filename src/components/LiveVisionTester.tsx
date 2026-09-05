import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { BenchmarkMeal } from '../types/benchmark';
import { SAMPLE_MEAL_PRESETS } from '../data/sampleMeals';

interface LiveVisionTesterProps {
  benchmarkMeals: BenchmarkMeal[];
  onApplyPrediction?: (mealId: string | number, predictedCarbs: number) => void;
}

interface InferenceResult {
  success: boolean;
  meal_id: string | number;
  meal_name: string;
  reference_carbs_g: number;
  predicted_carbs_g: number;
  delta_carbs_g: number;
  relative_error_pct: number;
  passed_clinical_threshold: boolean;
  insulin_impact_units: number;
  latency_ms: number;
  model: string;
  detected_components: {
    name: string;
    weight_g: number;
    carbs_per_100g: number;
    calculated_carbs_g: number;
    is_hidden?: boolean;
  }[];
  visual_notes: string;
}

export const LiveVisionTester: React.FC<LiveVisionTesterProps> = ({
  benchmarkMeals,
  onApplyPrediction,
}) => {
  const [selectedMealId, setSelectedMealId] = useState<string | number>(benchmarkMeals[0]?.id || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [appliedToBenchmark, setAppliedToBenchmark] = useState(false);

  const selectedMeal = benchmarkMeals.find((m) => m.id === selectedMealId) || benchmarkMeals[0];

  // Match sample preset image if available
  const samplePreset = SAMPLE_MEAL_PRESETS.find((p) =>
    selectedMeal.name_fr.toLowerCase().includes('couscous')
      ? p.id.includes('couscous')
      : selectedMeal.name_fr.toLowerCase().includes('lablabi')
      ? p.id.includes('lablabi')
      : selectedMeal.name_fr.toLowerCase().includes('ojja')
      ? p.id.includes('ojja')
      : false
  );

  const imageUrl = samplePreset?.sample_image_url || 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80';

  const handleRunInference = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedToBenchmark(false);

    try {
      const response = await fetch('/api/benchmark/live-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId: selectedMeal.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data: InferenceResult = await response.json();
      setInferenceResult(data);
    } catch (err: any) {
      console.error('Inference error:', err);
      setError(err.message || "Erreur lors de l'inférence");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (inferenceResult && onApplyPrediction) {
      onApplyPrediction(inferenceResult.meal_id, inferenceResult.predicted_carbs_g);
      setAppliedToBenchmark(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-900 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                Pipeline IA Réel : Test Inférence Vision
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                gemini-2.5-flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Confrontation directe entre la vision artificielle multimodale et la pesée métrologique certifiée
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleRunInference}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Inférence en cours…</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Tester ce plat avec Gemini Vision</span>
            </>
          )}
        </button>
      </div>

      {/* Body: Selector & Live Test Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Left: Meal Choice & Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Choisir le repas étalon à tester :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {benchmarkMeals.slice(0, 5).map((m) => {
                const isSelected = m.id === selectedMealId;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMealId(m.id);
                      setInferenceResult(null);
                      setAppliedToBenchmark(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-xs'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{m.name_fr}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {m.carbs_g}g glucides • {m.photo_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected meal preview card */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                <img
                  src={imageUrl}
                  alt={selectedMeal.name_fr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate">{selectedMeal.name_fr}</h4>
                <p className="text-[11px] text-slate-400">{selectedMeal.portion_desc || 'Portion étalon pesée'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-mono">
                    Poids : {selectedMeal.weight_g} g
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
                    Glucides étalon : {selectedMeal.carbs_g} g
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Ingrédients certifiés :
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedMeal.ingredients.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Inference Output (7 cols) */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Erreur d'inférence</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="h-64 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">Analyse multimodale en cours...</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Gemini 3.8 Flash décompose les textures, estime les volumes 3D et confronte les composants à la table tunisienne déterministe.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !inferenceResult && !error && (
            <div className="h-64 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Camera className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">
                Prêt pour l'inférence en direct
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Cliquez sur "Tester ce plat avec Gemini Vision" pour déclencher la requête multimodale et mesurer la précision métrologique.
              </p>
            </div>
          )}

          {!isLoading && inferenceResult && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Latency & Match KPI */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Glucides Réels</span>
                  <span className="text-lg font-black text-white font-mono">{inferenceResult.reference_carbs_g} g</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Prédits IA</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{inferenceResult.predicted_carbs_g} g</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Écart / Delta</span>
                  <span className="text-lg font-black text-white font-mono">
                    {inferenceResult.delta_carbs_g} g <span className="text-xs font-normal text-slate-400">({inferenceResult.relative_error_pct}%)</span>
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${inferenceResult.passed_clinical_threshold ? 'bg-emerald-950/50 border-emerald-700' : 'bg-rose-950/50 border-rose-700'}`}>
                  <span className="text-[10px] uppercase tracking-wider block font-bold text-slate-300">Statut DT1</span>
                  <span className={`text-xs font-black block mt-1 ${inferenceResult.passed_clinical_threshold ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {inferenceResult.passed_clinical_threshold ? 'CONFORME (≤ 15%)' : 'HORS SEUIL'}
                  </span>
                </div>
              </div>

              {/* Components detected breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Décomposition des composants détectés par l'IA :
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Latence : {inferenceResult.latency_ms} ms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {inferenceResult.detected_components.map((c, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                        c.is_hidden
                          ? 'bg-amber-950/40 border-amber-600/80 text-amber-200'
                          : 'bg-slate-900/60 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold block truncate">{c.name}</span>
                        {c.is_hidden && (
                          <span className="text-[9px] text-amber-400 font-bold block">
                            ⚠️ Composant masqué détecté
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span className="text-[11px] text-slate-300">{c.weight_g} g</span>
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          {c.calculated_carbs_g} g gluc
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {inferenceResult.visual_notes && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-700/70">
                    "{inferenceResult.visual_notes}"
                  </p>
                )}
              </div>

              {/* Action: Inject in Benchmark Table */}
              {onApplyPrediction && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Insuline calculée : ± {inferenceResult.insulin_impact_units} UI de bolus
                  </span>
                  <button
                    onClick={handleApply}
                    disabled={appliedToBenchmark}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      appliedToBenchmark
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 cursor-default'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {appliedToBenchmark ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Injecté dans le tableau de bord</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Appliquer au tableau d'évaluation</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
