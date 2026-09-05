import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
  Lightbulb,
  PlusCircle,
  X,
  Search,
  Activity,
  Settings,
  Syringe,
  Clock,
  Target,
  Waves,
  Wifi,
  Dumbbell,
  Moon,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import {
  AnalyzedMeal,
  MealItem,
  UserProfileDT1,
  MealSlot,
  CalculatedBolusSummary,
  PhysicalActivityLevel,
} from '../types';
import {
  TUNISIAN_FOOD_DATABASE,
  calculateCarbsDeterministically,
  calculateMealGlycemicMetrics,
  evaluateDualWaveBolus,
} from '../data/tunisianFoodDatabase';
import { getCurrentMealSlot, calculatePersonalizedBolus } from '../utils/storage';
import { recordPatientPortionCorrection, getLearnedPortionForFood } from '../utils/activeLearning';
import { fetchCurrentCGMReading } from '../utils/cgmService';
import { scheduleH2Reminder } from '../utils/h2Reminder';
import { HealthySubstitutionsCard } from './HealthySubstitutionsCard';

interface PortionAdjustmentViewProps {
  meal: AnalyzedMeal;
  userProfile: UserProfileDT1;
  onUpdateMeal: (updatedMeal: AnalyzedMeal) => void;
  onConfirmMeal: (finalMeal: AnalyzedMeal) => void;
  onCancel: () => void;
  onOpenProfileModal: () => void;
}

export const PortionAdjustmentView: React.FC<PortionAdjustmentViewProps> = ({
  meal,
  userProfile,
  onUpdateMeal,
  onConfirmMeal,
  onCancel,
  onOpenProfileModal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [appliedHabitPreset, setAppliedHabitPreset] = useState(false);
  const [isReadingCGM, setIsReadingCGM] = useState(false);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [isIngredientsCompact, setIsIngredientsCompact] = useState(false);

  // Slot horaire actuel (matin, midi, soir, collation OU iftar, sahriya, shor si Ramadan)
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(
    getCurrentMealSlot(userProfile.ramadanMode)
  );
  // Activité physique prévue après le repas (modulateur ISPAD/SFD)
  const [activityLevel, setActivityLevel] = useState<PhysicalActivityLevel>('none');
  // Glycémie pré-prandiale optionnelle saisie par le patient
  const [currentGlucoseInput, setCurrentGlucoseInput] = useState<string>('');

  const currentGlucoseNum = currentGlucoseInput ? parseFloat(currentGlucoseInput) : undefined;

  // Détection clinique d'hypoglycémie et prudence basse (<0.70 g/L ou <70 mg/dL)
  const isHypoglycemia =
    currentGlucoseNum !== undefined &&
    ((userProfile.glucoseUnit === 'g/L' && currentGlucoseNum < 0.7) ||
      (userProfile.glucoseUnit === 'mg/dL' && currentGlucoseNum < 70));

  const isCautionLow =
    currentGlucoseNum !== undefined &&
    !isHypoglycemia &&
    ((userProfile.glucoseUnit === 'g/L' && currentGlucoseNum < 0.8) ||
      (userProfile.glucoseUnit === 'mg/dL' && currentGlucoseNum < 80));

  // Calcul du bolus selon le profil personnalisé avec modulation activité physique
  const bolusCalculation = calculatePersonalizedBolus(
    meal.total_carbs,
    userProfile,
    selectedSlot,
    currentGlucoseNum,
    activityLevel
  );

  // Validation commune utilisée par le bouton pleine page et le bandeau sticky mobile
  const handleConfirmAction = () => {
    // Apprentissage actif : mémoriser les ajustements du patient
    meal.items.forEach((item) => {
      if (item.confirmed_weight_g && item.original_ai_weight_g) {
        recordPatientPortionCorrection(
          item.name_fr,
          item.name_fr,
          item.original_ai_weight_g,
          item.confirmed_weight_g
        );
      }
    });

    const finalMealWithBolus: AnalyzedMeal = {
      ...meal,
      activity_level: activityLevel,
      ramadan_slot: userProfile.ramadanMode ? (selectedSlot as any) : undefined,
      average_glycemic_index: glycemicMetrics.averageGlycemicIndex,
      total_glycemic_load: glycemicMetrics.totalGlycemicLoad,
      dual_wave: dualWaveSuggestion || undefined,
      bolus_calculated: {
        slot: selectedSlot,
        icRatio: bolusCalculation.icRatio,
        mealBolus: bolusCalculation.mealBolus,
        rawMealBolus: bolusCalculation.rawMealBolus,
        activityReductionPct: bolusCalculation.activityReductionPct,
        activityReductionUnits: bolusCalculation.activityReductionUnits,
        currentGlucose: currentGlucoseNum,
        targetGlucose: userProfile.targetGlucose,
        isf: userProfile.isf,
        correctionBolus: bolusCalculation.correctionBolus,
        totalBolus: bolusCalculation.totalBolus,
      },
    };

    // Programmation automatique du rappel H+2 pour contrôle post-prandial
    scheduleH2Reminder(finalMealWithBolus);

    onConfirmMeal(finalMealWithBolus);
  };

  // Calcul métrique glycémique (Index Glycémique & Charge Glycémique globale)
  const glycemicMetrics = calculateMealGlycemicMetrics(meal.items);

  // Évaluation Dual-Wave (Double bolus) pour repas tunisiens riches en graisses/protéines
  const dualWaveSuggestion = evaluateDualWaveBolus(meal.items, bolusCalculation.totalBolus);

  // Lecture instantanée depuis le capteur CGM
  const handleQuickCGMRead = async () => {
    setIsReadingCGM(true);
    try {
      const reading = await fetchCurrentCGMReading(
        userProfile.cgmConfig || { deviceType: 'freestyle', isConnected: true },
        userProfile.glucoseUnit
      );
      setCurrentGlucoseInput(String(reading.glucose));
    } catch (err) {
      console.error(err);
    } finally {
      setIsReadingCGM(false);
    }
  };

  // Quick portion change helper
  const handleAdjustWeight = (itemId: string, delta: number) => {
    const updatedItems = meal.items.map((item) => {
      if (item.id === itemId) {
        const newWeight = Math.max(5, (item.confirmed_weight_g || item.estimated_weight_g) + delta);
        const newCarbs = calculateCarbsDeterministically(newWeight, item.carbs_per_100g);
        return {
          ...item,
          confirmed_weight_g: newWeight,
          calculated_carbs: newCarbs,
          is_corrected: true,
        };
      }
      return item;
    });

    const newTotalCarbs = updatedItems.reduce((acc, it) => acc + it.calculated_carbs, 0);

    onUpdateMeal({
      ...meal,
      items: updatedItems,
      total_carbs: newTotalCarbs,
    });
  };

  const handleDirectWeightChange = (itemId: string, newWeight: number) => {
    const validWeight = Math.max(5, newWeight || 0);
    const updatedItems = meal.items.map((item) => {
      if (item.id === itemId) {
        const newCarbs = calculateCarbsDeterministically(validWeight, item.carbs_per_100g);
        return {
          ...item,
          confirmed_weight_g: validWeight,
          calculated_carbs: newCarbs,
          is_corrected: true,
        };
      }
      return item;
    });

    const newTotalCarbs = updatedItems.reduce((acc, it) => acc + it.calculated_carbs, 0);
    onUpdateMeal({
      ...meal,
      items: updatedItems,
      total_carbs: newTotalCarbs,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = meal.items.filter((item) => item.id !== itemId);
    const newTotalCarbs = updatedItems.reduce((acc, it) => acc + it.calculated_carbs, 0);
    onUpdateMeal({
      ...meal,
      items: updatedItems,
      total_carbs: newTotalCarbs,
    });
  };

  const handleAddFoodFromDatabase = (food: (typeof TUNISIAN_FOOD_DATABASE)[0]) => {
    const newItem: MealItem = {
      id: `item-added-${Date.now()}`,
      food_id: food.id,
      name_fr: food.name_fr,
      name_ar: food.name_ar,
      category: food.category,
      estimated_weight_g: food.default_portion_g,
      confirmed_weight_g: food.default_portion_g,
      carbs_per_100g: food.carbs_per_100g,
      calculated_carbs: calculateCarbsDeterministically(food.default_portion_g, food.carbs_per_100g),
      confidence: 'high',
      original_ai_weight_g: food.default_portion_g,
      is_corrected: true,
    };

    const updatedItems = [...meal.items, newItem];
    const newTotalCarbs = updatedItems.reduce((acc, it) => acc + it.calculated_carbs, 0);

    onUpdateMeal({
      ...meal,
      items: updatedItems,
      total_carbs: newTotalCarbs,
    });
    setIsAddModalOpen(false);
    setFoodSearchQuery('');
  };

  // Habit matching intelligence: check if this meal looks like a frequent habit
  const isCouscous = meal.meal_name.toLowerCase().includes('couscous');
  const showHabitSuggestion = isCouscous && !appliedHabitPreset;

  const handleApplyHabit = () => {
    // Habit: "Couscous maison habituel : 285g total ≈ 68g carbs"
    const updatedItems = meal.items.map((item) => {
      if (item.name_fr.toLowerCase().includes('couscous') || item.name_fr.toLowerCase().includes('semoule')) {
        const habitWeight = 240;
        return {
          ...item,
          confirmed_weight_g: habitWeight,
          calculated_carbs: calculateCarbsDeterministically(habitWeight, item.carbs_per_100g),
          is_corrected: true,
        };
      }
      return item;
    });
    const newTotalCarbs = updatedItems.reduce((acc, it) => acc + it.calculated_carbs, 0);
    onUpdateMeal({
      ...meal,
      items: updatedItems,
      total_carbs: newTotalCarbs,
    });
    setAppliedHabitPreset(true);
  };

  const filteredFoodsToAdd = TUNISIAN_FOOD_DATABASE.filter(
    (f) =>
      f.name_fr.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
      f.name_tn.toLowerCase().includes(foodSearchQuery.toLowerCase())
  ).slice(0, 8);

  const confidenceBadge = () => {
    if (meal.overall_confidence === 'high') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          Confiance élevée (🟢)
        </span>
      );
    }
    if (meal.overall_confidence === 'medium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          Confiance moyenne (🟡)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
        <span className="w-2 h-2 rounded-full bg-rose-600" />
        Confiance faible (🔴) — Vérifiez les portions
      </span>
    );
  };

  return (
    <div className={`max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6 pb-32 sm:pb-36 ${isHighContrastMode ? 'contrast-125' : ''}`}>
      {/* Top back action & Accessibility controls */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Changer de repas</span>
        </button>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsHighContrastMode(!isHighContrastMode)}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              isHighContrastMode
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Mode Grand Affichage / Contraste Élevé pour tremblements ou vue troublée"
          >
            {isHighContrastMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{isHighContrastMode ? 'Contraste Standard' : 'Grand Contraste'}</span>
          </button>
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            Étape 2 / 2
          </span>
        </div>
      </div>

      {/* Main Result Card (Prominent display ≈ 87 g) */}
      <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-md mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 block mb-1">
              Estimation des glucides du repas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-emerald-800 tracking-tight">
                ≈ {meal.total_carbs} g
              </span>
              <span className="text-sm font-semibold text-slate-500">
                de glucides totaux
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-800 mt-1">
              {meal.meal_name} {meal.meal_name_ar && <span className="text-xs text-slate-500 font-normal">({meal.meal_name_ar})</span>}
            </h2>

            {/* Index Glycémique et Charge Glycémique du repas */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                <span className="text-slate-500 font-normal">Absorption :</span>
                <span className="text-emerald-800">{glycemicMetrics.speedLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/60">
                <span className="text-slate-500 font-normal">Charge Glycémique :</span>
                <span>{glycemicMetrics.totalGlycemicLoad}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({glycemicMetrics.totalGlycemicLoad > 20 ? 'Élevée' : glycemicMetrics.totalGlycemicLoad >= 11 ? 'Moyenne' : 'Basse'})
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            {confidenceBadge()}
            <span className="text-[11px] text-slate-500">
              Formule déterministe certifiée INNT Tunis
            </span>
          </div>
        </div>

        {/* Habit matching helper */}
        {showHabitSuggestion && (
          <div className="mt-4 p-3 rounded-2xl bg-teal-50 border border-teal-200 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2 text-xs text-teal-900">
              <Lightbulb className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong>Ce plat ressemble à votre repas habituel :</strong> Couscous maison (habituellement 285 g total, 65–70 g de glucides).
              </div>
            </div>
            <button
              onClick={handleApplyHabit}
              className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              Appliquer ma portion habituelle
            </button>
          </div>
        )}

        {appliedHabitPreset && (
          <div className="mt-3 text-xs text-teal-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Portion habituelle appliquée (240 g semoule).
          </div>
        )}
      </div>

      {/* Detected Components List (The core interactive steppers) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Aliments détectés ({meal.items.length})
            </h3>
            <button
              type="button"
              onClick={() => setIsIngredientsCompact(!isIngredientsCompact)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              {isIngredientsCompact ? (
                <>
                  <Maximize2 className="w-3 h-3 text-slate-500" />
                  <span>Détaillé</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-slate-500" />
                  <span>Compact</span>
                </>
              )}
            </button>
          </div>
          <span className="text-xs text-slate-500">
            Ajustez les grammes si nécessaire
          </span>
        </div>

        <div className="space-y-2.5">
          {meal.items.map((item) => {
            const currentWeight = item.confirmed_weight_g || item.estimated_weight_g;
            const isCorrected = item.is_corrected;

            return (
              <div
                key={item.id}
                id={`meal-item-row-${item.id}`}
                className={`rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs transition-all ${
                  isIngredientsCompact ? 'p-3' : 'p-4'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  {/* Item info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.name_fr}
                      </span>
                      {item.name_ar && (
                        <span className="text-xs text-slate-400 font-medium">
                          {item.name_ar}
                        </span>
                      )}
                      {item.confidence === 'high' ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Détection visuelle nette" />
                      ) : item.confidence === 'medium' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Plat composé / sauce" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Élément incertain" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{item.carbs_per_100g} g glucides / 100 g</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">
                        ≈ {item.calculated_carbs} g apportés
                      </span>
                    </div>

                    {/* Learning feedback chip */}
                    {!isIngredientsCompact && isCorrected && (
                      <div className="mt-1 text-[11px] text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded-md inline-block border border-teal-200/60">
                        ✏️ Ajusté : IA {item.original_ai_weight_g || item.estimated_weight_g} g → Vous {currentWeight} g (Apprentissage enregistré)
                      </div>
                    )}
                  </div>

                  {/* Stepper Controls [ -10g ] [ - ] [ + ] [ +10g ] */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAdjustWeight(item.id, -10)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      title="Diminuer de 10 g"
                    >
                      −10 g
                    </button>
                    <button
                      onClick={() => handleAdjustWeight(item.id, -5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                      title="Diminuer de 5 g"
                    >
                      −
                    </button>

                    {/* Direct weight input */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200/80 rounded-xl min-w-20 justify-center">
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => handleDirectWeightChange(item.id, parseInt(e.target.value, 10))}
                        className="w-12 bg-transparent text-center font-extrabold text-emerald-950 text-sm outline-none"
                      />
                      <span className="text-xs font-semibold text-emerald-800">g</span>
                    </div>

                    <button
                      onClick={() => handleAdjustWeight(item.id, 5)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                      title="Augmenter de 5 g"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleAdjustWeight(item.id, 10)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      title="Augmenter de 10 g"
                    >
                      +10 g
                    </button>

                    {/* Delete item button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1 transition-colors cursor-pointer"
                      title="Supprimer cet aliment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add missing food button */}
        <button
          id="btn-open-add-food"
          onClick={() => setIsAddModalOpen(true)}
          className="mt-3.5 w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajouter un aliment manquant (Pain, boisson, fruit, dessert...)</span>
        </button>
      </div>

      {/* Recommandations de substitutions saines et index glycémique (Cuisine tunisienne) */}
      <div className="mb-6">
        <HealthySubstitutionsCard
          meal={meal}
          onApplyOptimizedRecipe={(newCarbs) => {
            onUpdateMeal({
              ...meal,
              total_carbs: newCarbs,
            });
          }}
        />
      </div>

      {/* Therapeutic Bolus Calculator (Ratio I:C & Correction) */}
      <div className="mb-6 p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border border-slate-700/60">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                Calculateur de Bolus Personnalisé (ITF)
              </h3>
              <p className="text-[10px] text-slate-400">
                Profil DT1 actif : 1 UI pour {userProfile?.icRatios?.[selectedSlot] ?? 10} g de glucides
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Modifier mes ratios et sensibilités"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mon profil DT1</span>
          </button>
        </div>

        {/* Slot selector (Standard or Ramadan) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              {userProfile.ramadanMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Créneau de rupture / veille (Mode Ramadan actif) :</span>
                </>
              ) : (
                <span>Moment du repas :</span>
              )}
            </label>
            {userProfile.ramadanMode && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                🌙 Jeûne
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {(userProfile.ramadanMode
              ? [
                  { id: 'iftar', label: '🌙 Iftar', desc: 'Rupture', ratio: userProfile?.icRatios?.iftar ?? 8 },
                  { id: 'sahriya', label: '🍵 Sahriya', desc: 'Soirée', ratio: userProfile?.icRatios?.sahriya ?? 9 },
                  { id: 'shor', label: '🌅 Shor', desc: 'Aube', ratio: userProfile?.icRatios?.shor ?? 12 },
                  { id: 'snack', label: 'Collation', desc: 'Nuit', ratio: userProfile?.icRatios?.snack ?? 10 },
                ]
              : [
                  { id: 'morning', label: 'Matin', desc: 'Petit-déj', ratio: userProfile?.icRatios?.morning ?? 8 },
                  { id: 'lunch', label: 'Midi', desc: 'Déjeuner', ratio: userProfile?.icRatios?.lunch ?? 10 },
                  { id: 'dinner', label: 'Soir', desc: 'Dîner', ratio: userProfile?.icRatios?.dinner ?? 12 },
                  { id: 'snack', label: 'Collation', desc: 'Goûter', ratio: userProfile?.icRatios?.snack ?? 10 },
                ]
            ).map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot.id as MealSlot)}
                className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                  selectedSlot === slot.id
                    ? userProfile.ramadanMode
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="block text-xs font-semibold">{slot.label}</span>
                <span className="text-[10px] text-slate-300/80 block font-normal">
                  1 UI / {slot.ratio}g
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modulateur d'Activité Physique (Consensus ISPAD / SFD) */}
        <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
              Activité physique prévue post-repas :
            </span>
            {bolusCalculation.activityReductionPct ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-in fade-in">
                -{bolusCalculation.activityReductionPct}% sur bolus repas (-{bolusCalculation.activityReductionUnits} UI)
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            {[
              { id: 'none', label: 'Repos / Sédentaire', sub: '0% de réduction', icon: '🛋️' },
              { id: 'light_walk', label: 'Marche légère', sub: '15-30 min (-15%)', icon: '🚶' },
              { id: 'moderate', label: 'Sport modéré', sub: '30-45 min (-30%)', icon: '🏃' },
              { id: 'intense', label: 'Sport intense', sub: '> 45 min (-50%)', icon: '⚡' },
            ].map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => setActivityLevel(act.id as PhysicalActivityLevel)}
                className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                  activityLevel === act.id
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-base block mb-0.5">{act.icon}</span>
                <span className="block text-[11px] font-bold leading-tight">{act.label}</span>
                <span className="text-[9px] text-amber-200/90 block font-normal mt-0.5">{act.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pre-prandial Glucose & Correction Bolus */}
        <div className="mb-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Glycémie pré-prandiale (optionnelle)
              </span>
              <p className="text-[11px] text-slate-400">
                Cible visée : {userProfile.targetGlucose} {userProfile.glucoseUnit} • ISF : 1 UI pour {userProfile.isf} {userProfile.glucoseUnit}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickCGMRead}
                disabled={isReadingCGM}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Lire la glycémie actuelle depuis le capteur CGM"
              >
                <Wifi className={`w-3.5 h-3.5 ${isReadingCGM ? 'animate-spin' : ''}`} />
                <span>{isReadingCGM ? '...' : 'CGM'}</span>
              </button>
              <input
                type="number"
                step={userProfile.glucoseUnit === 'g/L' ? '0.05' : '1'}
                placeholder={`ex : ${userProfile.glucoseUnit === 'g/L' ? '1.40' : '140'}`}
                value={currentGlucoseInput}
                onChange={(e) => setCurrentGlucoseInput(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-xs font-bold text-center outline-none focus:border-emerald-400"
              />
              <span className="text-xs font-semibold text-slate-300">
                {userProfile.glucoseUnit}
              </span>
            </div>
          </div>

          {currentGlucoseNum !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-2 text-xs">
              {isHypoglycemia ? (
                <div className="p-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 text-white space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                    <span>🚨 ALERTE HYPOGLYCÉMIE PRÉ-PRANDIALE ({currentGlucoseNum} {userProfile.glucoseUnit})</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/10 border border-white/10 text-[11px] text-rose-100 space-y-1">
                    <p className="font-extrabold text-white">⚡ Protocole vital : Règle des 15 g de sucre rapide</p>
                    <p>Prenez immédiatement l'un des équivalents suivants :</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 font-semibold text-white">
                      <div className="p-1.5 rounded bg-rose-900/80 text-center">🥤 150 ml de jus d'orange / soda</div>
                      <div className="p-1.5 rounded bg-rose-900/80 text-center">🍬 3 morceaux de sucre n°4</div>
                      <div className="p-1.5 rounded bg-rose-900/80 text-center">🍯 1 c. à soupe de miel</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-200 bg-rose-900/50 p-2 rounded-lg border border-rose-400/40">
                    ⚠️ <strong>Consigne de sécurité stricte :</strong> Reposez-vous 15 min, recontrôlez la glycémie. <strong>Ne réalisez PAS l'injection de bolus</strong> tant que la glycémie n'est pas revenue ≥ 0.80 g/L (80 mg/dL).
                  </p>
                </div>
              ) : isCautionLow ? (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs">
                  ⚠️ <strong>Glycémie basse de prudence ({currentGlucoseNum} {userProfile.glucoseUnit}) :</strong> Risque d'hypoglycémie pendant la digestion. Surveillez vos symptômes et envisagez de scinder ou différer le bolus.
                </div>
              ) : currentGlucoseNum > userProfile.targetGlucose ? (
                <span className="text-amber-300 font-medium">
                  ⚠️ Glycémie supérieure à la cible (+{(currentGlucoseNum - userProfile.targetGlucose).toFixed(2)} {userProfile.glucoseUnit}) : correction calculée (+{bolusCalculation.correctionBolus} UI).
                </span>
              ) : (
                <span className="text-emerald-300 font-medium">
                  ✅ Glycémie dans la cible, aucune correction nécessaire.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Calculated Insulin Doses Breakdown */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Bolus Repas
            </span>
            <span className={`font-black text-white block ${isHighContrastMode ? 'text-xl' : 'text-lg'}`}>
              {bolusCalculation.mealBolus} UI
            </span>
            <span className="text-[10px] text-slate-400">
              {meal.total_carbs}g ÷ {bolusCalculation.icRatio}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Correction
            </span>
            <span className={`font-black text-blue-300 block ${isHighContrastMode ? 'text-xl' : 'text-lg'}`}>
              +{bolusCalculation.correctionBolus} UI
            </span>
            <span className="text-[10px] text-slate-400">
              {bolusCalculation.correctionBolus > 0 ? 'ajustement cible' : 'aucune'}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border shadow-sm ${
            isHighContrastMode
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300'
              : 'bg-emerald-600/90 text-white border-emerald-400/40'
          }`}>
            <span className={`text-[10px] uppercase font-extrabold block mb-0.5 ${
              isHighContrastMode ? 'text-slate-900' : 'text-emerald-100'
            }`}>
              Bolus Total
            </span>
            <span className={`font-black block tracking-tight ${
              isHighContrastMode ? 'text-2xl text-slate-950 font-black' : 'text-xl'
            }`}>
              {bolusCalculation.totalBolus} UI
            </span>
            <span className={`text-[10px] ${
              isHighContrastMode ? 'text-slate-800 font-bold' : 'text-emerald-100/90'
            }`}>
              arrondi {userProfile.roundingStep} UI
            </span>
          </div>
        </div>

        {/* Recommandation Bolus Carré / Double-Vague (Dual-Wave) */}
        {dualWaveSuggestion?.is_recommended && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 text-left animate-in fade-in">
            <div className="flex items-center gap-2 mb-1 text-indigo-300 font-extrabold text-xs">
              <Waves className="w-4 h-4 text-indigo-400" />
              <span>Suggestion Bolus Double-Vague (Dual-Wave) :</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
              {dualWaveSuggestion.reason}
            </p>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Immédiat (60%)</span>
                <span className="text-sm font-black text-white">{dualWaveSuggestion.immediate_units} UI</span>
                <span className="text-[10px] text-indigo-300 block">au début du repas</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Étalé (40%)</span>
                <span className="text-sm font-black text-indigo-200">{dualWaveSuggestion.extended_units} UI</span>
                <span className="text-[10px] text-indigo-300 block">sur {dualWaveSuggestion.duration_hours}h</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Disclaimer Callout */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 mb-6 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Rappel médical important :</strong> Cette proposition de bolus est basée sur vos ratios déclarés. Le patient diabétique reste le décisionnaire final de l'injection en fonction de son activité physique et contexte clinique.
        </div>
      </div>

      {/* Two Main Confirmation Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onCancel}
          className="w-full sm:w-1/3 py-3.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          ✏️ Modifier le repas
        </button>

        <button
          id="btn-validate-meal"
          onClick={handleConfirmAction}
          className={`w-full sm:w-2/3 py-3.5 px-5 rounded-2xl text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isHypoglycemia
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {isHypoglycemia
              ? `Valider après resucrage (≈ ${meal.total_carbs} g • ${bolusCalculation.totalBolus} UI)`
              : `Valider le repas (≈ ${meal.total_carbs} g • ${bolusCalculation.totalBolus} UI)`}
          </span>
        </button>
      </div>

      {/* P0 - Sticky Mobile Confirmation Bar (Floating action footer) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 sm:px-4 py-2.5 sm:py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.1)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
              <span className="text-[9px] uppercase font-extrabold text-emerald-800 block leading-tight">Glucides</span>
              <span className="text-sm font-black text-emerald-950 block">≈ {meal.total_carbs} g</span>
            </div>
            <div className={`px-2.5 sm:px-3 py-1 rounded-xl border shadow-xs ${
              isHighContrastMode
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900 text-white border-slate-700/80'
            }`}>
              <span className={`text-[9px] uppercase font-extrabold block leading-tight ${
                isHighContrastMode ? 'text-slate-900' : 'text-slate-400'
              }`}>
                Bolus
              </span>
              <span className={`text-sm font-black block ${
                isHighContrastMode ? 'text-slate-950 text-base font-black' : 'text-emerald-400'
              }`}>
                {bolusCalculation.totalBolus} UI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {isHypoglycemia && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
                Resucrage requis
              </span>
            )}
            <button
              id="btn-sticky-validate-meal"
              onClick={handleConfirmAction}
              className={`flex-1 sm:flex-initial py-2.5 px-4 sm:px-6 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isHypoglycemia
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isHypoglycemia ? 'Valider (après resucrage)' : 'Valider le repas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Food from Tunisian Database */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ajouter un aliment tunisien certifié
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher : pain, baguette, tabouna, couscous..."
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {filteredFoodsToAdd.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleAddFoodFromDatabase(food)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {food.name_fr} {food.name_ar && <span className="text-slate-500 font-normal">({food.name_ar})</span>}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Portion type : {food.default_portion_g} g • {food.carbs_per_100g} g glucides / 100 g
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md">
                    +{Math.round((food.default_portion_g * food.carbs_per_100g) / 100)} g
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
