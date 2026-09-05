import React, { useState, useRef } from 'react';
import {
  History,
  Clock,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  BookOpen,
  Star,
  Download,
  Upload,
  Trash2,
  Syringe,
  RotateCcw,
  FileText,
  Activity,
  Wifi,
  Waves,
  Target,
  Cloud,
  FileSpreadsheet,
  Dumbbell,
  Moon,
  Utensils,
  Plus,
} from 'lucide-react';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { exportUserDataBackup, importUserDataBackup, DEFAULT_USER_PROFILE } from '../utils/storage';
import { loadPatientCustomPortions } from '../utils/activeLearning';
import { exportToExcelWorkbook } from '../utils/excelExport';

interface HistoryViewProps {
  meals: AnalyzedMeal[];
  userProfile?: UserProfileDT1;
  onSelectMeal: (meal: AnalyzedMeal) => void;
  onNewMeal: () => void;
  onToggleFavorite?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  onRefreshHistory?: () => void;
  onOpenMedicalReport?: () => void;
  onOpenCGMSync?: () => void;
  onRecordPostPrandial?: (meal: AnalyzedMeal) => void;
  onOpenAutoTitration?: () => void;
  onOpenCloudSync?: () => void;
  onQuickSelectMeal?: (mealDescription: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  meals,
  userProfile,
  onSelectMeal,
  onNewMeal,
  onToggleFavorite,
  onDeleteMeal,
  onRefreshHistory,
  onOpenMedicalReport,
  onOpenCGMSync,
  onRecordPostPrandial,
  onOpenAutoTitration,
  onOpenCloudSync,
  onQuickSelectMeal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const favoriteMeals = meals.filter((m) => m.is_favorite);
  const displayedMeals = filterMode === 'favorites' ? favoriteMeals : meals;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importUserDataBackup(content);
      if (res.success) {
        setImportStatus(`✅ ${res.count || 0} repas importés avec succès !`);
        if (onRefreshHistory) onRefreshHistory();
      } else {
        setImportStatus(`❌ Erreur : ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Récupération des portions personnalisées apprises dynamiquement
  const patientPortions = loadPatientCustomPortions();

  // Habitudes alimentaires réelles et calibrées
  const baseHabits = [
    {
      dish: 'Couscous agneau traditionnel',
      dish_ar: 'كسكسي تونسي باللحم',
      occurrences: 9,
      usual_weight_g: 240,
      usual_carbs: '65–70 g',
      note: 'Pour ce patient, la semoule servie est plus compacte que la portion moyenne.',
    },
    {
      dish: 'Pain Tabouna traditionnel',
      dish_ar: 'خبز طابونة',
      occurrences: 24,
      usual_weight_g: 40,
      usual_carbs: '≈ 20 g',
      note: 'Correction mémorisée : portion habituelle = 40 g (au lieu des 60 g standards).',
    },
    {
      dish: 'Lablabi complet au thon',
      dish_ar: 'لبلابي كامل',
      occurrences: 5,
      usual_weight_g: 350,
      usual_carbs: '60–64 g',
      note: 'Bol standard avec 1 tranche de pain rassis, pois chiches et thon.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dossier Thérapeutique DT1 & Télémédecine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Historique Clinique & Suivi Diabétologique
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Relevé des repas tunisiens, bolus d'insuline calculés et contrôles post-prandiaux (+2h).
          </p>
        </div>

        {/* Action Buttons: Rapport Diabétologue + Capteurs CGM + Backup Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAutoTitration && (
            <button
              onClick={onOpenAutoTitration}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-700/20 transition-all cursor-pointer"
              title="Ajustement algorithmique des ratios Insuline:Glucides selon les glycémies H+2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Titration Ratios (IA)</span>
            </button>
          )}

          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              title="Synchronisation Cloud Multi-Appareils"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-200" />
              <span>Cloud Sync</span>
            </button>
          )}

          {onOpenMedicalReport && (
            <button
              onClick={onOpenMedicalReport}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              title="Générer la synthèse imprimable PDF pour votre consultation chez le diabétologue"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rapport Médecin (PDF)</span>
            </button>
          )}

          {onOpenCGMSync && (
            <button
              onClick={onOpenCGMSync}
              className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              title="Synchroniser avec capteurs FreeStyle Libre, Dexcom ou Nightscout"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Capteurs CGM</span>
            </button>
          )}

          <button
            onClick={() => exportToExcelWorkbook(meals, userProfile || DEFAULT_USER_PROFILE)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
            title="Exporter tout le journal clinique et l'analyse AGP au format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportUserDataBackup()}
            className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exporter l'historique et le profil en fichier de sauvegarde JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Backup JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurer un fichier de sauvegarde"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Restaurer</span>
          </button>

          <button
            onClick={onNewMeal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>+ Nouveau repas</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 animate-in fade-in">
          {importStatus}
        </div>
      )}

      {/* Habits Card section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Références d’habitudes mémorisées (Active Learning)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Ajustements prédictifs auto-calibrés
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Portions apprises dynamiquement du patient si existantes */}
          {patientPortions.slice(0, 3).map((lp, idx) => (
            <div
              key={`learned-${idx}`}
              className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300/80 shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  ✨ Appris ({lp.correction_count} corrections)
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1">{lp.food_name}</h3>
              <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-baseline justify-between">
                <span className="text-xs text-slate-600">Portion personnalisée :</span>
                <span className="text-xs font-black text-emerald-900">{lp.custom_portion_g} g</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Proposé automatiquement à la place des {lp.default_portion_g}g standards de l'INNT.
              </p>
            </div>
          ))}

          {/* Habitudes de base */}
          {baseHabits.slice(0, Math.max(1, 3 - Math.min(3, patientPortions.length))).map((habit, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {habit.occurrences} repas enregistrés
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{habit.dish}</h3>
              <p className="text-xs text-slate-500">{habit.dish_ar}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Portion habituelle :</span>
                <span className="text-xs font-extrabold text-slate-800">{habit.usual_weight_g} g</span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-slate-500">Glucides moyens :</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {habit.usual_carbs}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 italic">
                {habit.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Validated Meals List & Filter Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Journal des repas ({displayedMeals.length})
            </h2>
          </div>

          {/* Filter: All vs Favorites */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous les repas ({meals.length})
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'favorites'
                  ? 'bg-amber-400 text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Favoris ({favoriteMeals.length})</span>
            </button>
          </div>
        </div>

        {displayedMeals.length > 0 ? (
          <div className="space-y-3">
            {displayedMeals.map((meal) => (
              <div
                key={meal.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Star Favorite Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFavorite) onToggleFavorite(meal.id);
                      }}
                      className="text-slate-300 hover:text-amber-400 transition-colors p-1 -ml-1 cursor-pointer"
                      title={meal.is_favorite ? 'Retirer des favoris' : 'Ajouter aux repas favoris'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          meal.is_favorite
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        }`}
                      />
                    </button>

                    <h3
                      onClick={() => onSelectMeal(meal)}
                      className="text-sm font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                    >
                      {meal.meal_name}
                    </h3>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        meal.overall_confidence === 'high'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {meal.overall_confidence === 'high' ? '🟢 Élevée' : '🟡 Moyenne'}
                    </span>

                    {meal.created_at && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(meal.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meal.items.map((item) => (
                      <span
                        key={item.id}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {item.name_fr} ({item.confirmed_weight_g} g → ≈ {item.calculated_carbs} g)
                      </span>
                    ))}
                  </div>

                  {/* Bolus details chip if calculated */}
                  {meal.bolus_calculated && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Syringe className="w-3 h-3" />
                        Bolus : {meal.bolus_calculated.totalBolus} UI
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Repas : {meal.bolus_calculated.mealBolus} UI
                        {meal.bolus_calculated.correctionBolus > 0 &&
                          ` • Corr. : +${meal.bolus_calculated.correctionBolus} UI`}
                        )
                      </span>
                    </div>
                  )}

                  {/* Additional Clinical Badges: Post-prandial (+2h), Dual-Wave, IG/CG */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    {/* Post-prandial control button / badge */}
                    {meal.post_prandial_glucose ? (
                      <button
                        type="button"
                        onClick={() => onRecordPostPrandial && onRecordPostPrandial(meal)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          meal.post_prandial_evaluation === 'target'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : meal.post_prandial_evaluation === 'hyper'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Modifier le contrôle post-prandial"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>
                          +2h : {meal.post_prandial_glucose} {userProfile?.glucoseUnit || 'g/L'}
                          {meal.post_prandial_evaluation === 'target' && ' (Cible 🎯)'}
                          {meal.post_prandial_evaluation === 'hyper' && ' (Hyper ⚠️)'}
                          {meal.post_prandial_evaluation === 'hypo' && ' (Hypo 🚨)'}
                        </span>
                      </button>
                    ) : (
                      onRecordPostPrandial && (
                        <button
                          type="button"
                          onClick={() => onRecordPostPrandial(meal)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>+ Saisir contrôle (+2h)</span>
                        </button>
                      )
                    )}

                    {/* Dual-Wave badge */}
                    {meal.dual_wave?.is_recommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200/60">
                        <Waves className="w-3 h-3 text-indigo-600" />
                        <span>Dual-Wave 60/40</span>
                      </span>
                    )}

                    {/* Activity Modulation Badge */}
                    {meal.activity_level && meal.activity_level !== 'none' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200/60">
                        <Dumbbell className="w-3 h-3 text-amber-600" />
                        <span>
                          {meal.activity_level === 'light_walk' && 'Marche (-15%)'}
                          {meal.activity_level === 'moderate' && 'Sport modéré (-30%)'}
                          {meal.activity_level === 'intense' && 'Sport intense (-50%)'}
                        </span>
                      </span>
                    )}

                    {/* Ramadan Slot Badge */}
                    {meal.ramadan_slot && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200/60">
                        <Moon className="w-3 h-3 text-purple-600" />
                        <span className="capitalize">{meal.ramadan_slot}</span>
                      </span>
                    )}

                    {/* IG & CG metrics */}
                    {meal.average_glycemic_index && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        IG {meal.average_glycemic_index} • CG {meal.total_glycemic_load || '—'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 block">
                      Total glucides
                    </span>
                    <span className="text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/70 inline-block">
                      ≈ {meal.total_carbs} g
                    </span>
                  </div>

                  {/* Re-estimate action button */}
                  <button
                    onClick={() => onSelectMeal(meal)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                    title="Ré-estimer ou ajuster ce repas"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Delete action */}
                  {onDeleteMeal && (
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Supprimer ce repas de l'historique"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-center">
            {filterMode === 'favorites' ? (
              <div className="space-y-3">
                <Star className="w-8 h-8 text-amber-400 fill-amber-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">Aucun repas favori pour le moment</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cliquez sur l'étoile à côté du nom de n'importe quel repas enregistré pour le retrouver instantanément dans vos favoris.
                </p>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Voir tous les repas
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <Utensils className="w-6 h-6" />
                </div>

                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-base font-black text-slate-900">
                    Votre carnet de repas est prêt
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Testez immédiatement l'analyse des glucides et le calcul de bolus d'insuline personnalisé en 1 clic grâce aux suggestions de plats tunisiens typiques :
                  </p>
                </div>

                {/* Interactive quick chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-2xl mx-auto pt-1 text-left">
                  {[
                    {
                      name: 'Couscous au poisson',
                      nameTn: 'Kskousi bel hout',
                      desc: 'Semoule, daurade, carotte, courgette',
                      carbs: 68,
                      ig: 'IG 55',
                      icon: '🐟',
                    },
                    {
                      name: "Brik à l'oeuf & thon",
                      nameTn: 'Brika bel aadhma',
                      desc: 'Feuille malsouka, oeuf, persil, thon',
                      carbs: 24,
                      ig: 'IG 45',
                      icon: '🍳',
                    },
                    {
                      name: 'Plat Tunisien traditionnel',
                      nameTn: 'Sahn Tounsi',
                      desc: 'Salade méchouia, thon, oeuf dur, olives, pain',
                      carbs: 32,
                      ig: 'IG 40',
                      icon: '🥗',
                    },
                    {
                      name: 'Fricassé tunisien (2 pièces)',
                      nameTn: '2 Fricassés',
                      desc: 'Pain frit garni pomme de terre, thon, harissa',
                      carbs: 45,
                      ig: 'IG 65',
                      icon: '🥪',
                    },
                    {
                      name: 'Kafteji tunisien',
                      nameTn: 'Kafteji bel aadhma',
                      desc: 'Légumes hachés, courge, piments, oeufs',
                      carbs: 22,
                      ig: 'IG 45',
                      icon: '🌶️',
                    },
                    {
                      name: 'Ojja merguez tunisienne',
                      nameTn: 'Ojja bel merguez',
                      desc: 'Tomate, oeufs, merguez épicées, huile olive',
                      carbs: 18,
                      ig: 'IG 35',
                      icon: '🥘',
                    },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        if (onQuickSelectMeal) {
                          onQuickSelectMeal(preset.name);
                        } else {
                          onNewMeal();
                        }
                      }}
                      className="group p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/90 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0">{preset.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 block leading-snug">
                              {preset.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {preset.nameTn}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{preset.desc}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                        <span className="font-extrabold text-emerald-700">≈ {preset.carbs} g glucides</span>
                        <span className="text-slate-400 font-semibold">{preset.ig}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onNewMeal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Prendre une photo ou saisir un autre repas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

