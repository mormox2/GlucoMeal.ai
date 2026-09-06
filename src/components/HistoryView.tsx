import React, { useState, useRef } from 'react';
import {
  History,
  Clock,
  Lightbulb,
  Sparkles,
  Star,
  Download,
  Upload,
  Trash2,
  Syringe,
  RotateCcw,
  FileText,
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
import { useLanguage } from '../i18n/LanguageContext';

interface HistoryViewProps {
  meals: AnalyzedMeal[];
  userProfile?: UserProfileDT1;
  onSelectMeal: (meal: AnalyzedMeal) => void;
  onNewMeal: () => void;
  onToggleFavorite?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  onClearAllMeals?: () => void;
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
  onClearAllMeals,
  onRefreshHistory,
  onOpenMedicalReport,
  onOpenCGMSync,
  onRecordPostPrandial,
  onOpenAutoTitration,
  onOpenCloudSync,
  onQuickSelectMeal,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const favoriteMeals = meals.filter((m) => m.is_favorite);
  const displayedMeals = filterMode === 'favorites' ? favoriteMeals : meals;

  const handleClearAll = () => {
    const confirmMsg = isAr
      ? 'هل أنت متأكد من رغبتك في حذف جميع الوجبات من سجلك؟ هذا الإجراء لا يمكن التراجع عنه.'
      : 'Êtes-vous sûr de vouloir supprimer tous les repas de votre historique ? Cette action est irréversible.';
    if (window.confirm(confirmMsg)) {
      if (onClearAllMeals) {
        onClearAllMeals();
      }
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importUserDataBackup(content);
      if (res.success) {
        setImportStatus(isAr ? `✅ تم استيراد ${res.count || 0} وجبة بنجاح!` : `✅ ${res.count || 0} repas importés avec succès !`);
        if (onRefreshHistory) onRefreshHistory();
      } else {
        setImportStatus(isAr ? `❌ خطأ في الاستيراد: ${res.error}` : `❌ Erreur : ${res.error}`);
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Récupération des portions personnalisées apprises dynamiquement
  const patientPortions = loadPatientCustomPortions();

  return (
    <div className={`max-w-5xl xl:max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 ${isAr ? 'font-arabic' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'الملف العلاجي للسكري والمتابعة السريرية' : 'Dossier Thérapeutique DT1 & Télémédecine'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAr ? 'سجل الوجبات والمتابعة الطبية' : 'Historique Clinique & Suivi Diabétologique'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isAr
              ? 'متابعة الأكلات، الكربوهيدرات المحسوبة، جرعات الإنسولين السريع ومستويات السكر بعد الأكل (+ساعتان).'
              : 'Relevé des repas tunisiens, bolus d\'insuline calculés et contrôles post-prandiaux (+2h).'}
          </p>
        </div>

        {/* Action Buttons: Rapport Diabétologue + Capteurs CGM + Backup Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAutoTitration && (
            <button
              onClick={onOpenAutoTitration}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-700/20 transition-all cursor-pointer"
              title={isAr ? 'معايرة نسب الإنسولين / الكربوهيدرات بالذكاء الاصطناعي' : "Ajustement algorithmique des ratios Insuline:Glucides selon les glycémies H+2"}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'معايرة النسب (ذكاء اصطناعي)' : 'Titration Ratios (IA)'}</span>
            </button>
          )}

          {onOpenCloudSync && (
            <button
              onClick={onOpenCloudSync}
              className="px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              title={isAr ? 'المزامنة السحابية عبر الأجهزة' : 'Synchronisation Cloud Multi-Appareils'}
            >
              <Cloud className="w-3.5 h-3.5 text-sky-200" />
              <span>{isAr ? 'مزامنة سحابية' : 'Cloud Sync'}</span>
            </button>
          )}

          {onOpenMedicalReport && (
            <button
              onClick={onOpenMedicalReport}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              title={isAr ? 'إنشاء تقرير PDF مطبوع لطبيب السكري' : 'Générer la synthèse imprimable PDF pour votre consultation chez le diabétologue'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير الطبيب (PDF)' : 'Rapport Médecin (PDF)'}</span>
            </button>
          )}

          {onOpenCGMSync && (
            <button
              onClick={onOpenCGMSync}
              className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              title={isAr ? 'الربط بمستشعرات السكر المستمر FreeStyle أو Dexcom' : 'Synchroniser avec capteurs FreeStyle Libre, Dexcom ou Nightscout'}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{isAr ? 'مستشعرات CGM' : 'Capteurs CGM'}</span>
            </button>
          )}

          <button
            onClick={() => exportToExcelWorkbook(meals, userProfile || DEFAULT_USER_PROFILE)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-800/20 transition-all cursor-pointer"
            title={isAr ? 'تصدير السجل الطبي وتحليل AGP إلى ملف إكسيل' : "Exporter tout le journal clinique et l'analyse AGP au format Excel (.xlsx)"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isAr ? 'تصدير إكسيل (.xlsx)' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => exportUserDataBackup()}
            className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isAr ? 'نسخ احتياطي للسجل والملف الشخصي' : "Exporter l'historique et le profil en fichier de sauvegarde JSON"}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{isAr ? 'نسخ احتياطي' : 'Backup JSON'}</span>
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
            title={isAr ? 'استرجاع ملف النسخة الاحتياطية' : 'Restaurer un fichier de sauvegarde'}
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{isAr ? 'استرجاع' : 'Restaurer'}</span>
          </button>

          <button
            onClick={onNewMeal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>{isAr ? '+ وجبة جديدة' : '+ Nouveau repas'}</span>
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
              {isAr ? 'التعلم النشط للحصص الشخصية (Active Learning)' : 'Références d’habitudes mémorisées (Active Learning)'}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {isAr ? 'تعديلات تلقائية مبنية على اختياراتك السابقة' : 'Ajustements prédictifs auto-calibrés'}
          </span>
        </div>

        {patientPortions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {patientPortions.slice(0, 3).map((lp, idx) => (
              <div
                key={`learned-${idx}`}
                className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300/80 shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {isAr ? `✨ تم التعلم (${lp.correction_count} تعديلات)` : `✨ Appris (${lp.correction_count} corrections)`}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-1">{lp.food_name}</h3>
                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600">{isAr ? 'حصتك المعتادة:' : 'Portion personnalisée :'}</span>
                  <span className="text-xs font-black text-emerald-900">{lp.custom_portion_g} {isAr ? 'غ' : 'g'}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  {isAr
                    ? `تُقترح تلقائياً بدلاً من حصة المعهد القياسية (${lp.default_portion_g} غ).`
                    : `Proposé automatiquement à la place des ${lp.default_portion_g}g standards de l'INNT.`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                {isAr ? 'التعلم النشط للحصص الواقعية' : 'Apprentissage actif de vos portions réelles'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {isAr
                  ? 'لم يتم حفظ أي عادة بعد. عندما تقوم بتعديل الحصص يدوياً أثناء حساب وجباتك (مثل الكسكسي أو الخبز أو المقرونة)، سيتعلم النظام مقاديرك المعتادة ويقترحها تلقائياً في المرات القادمة.'
                  : 'Aucune habitude encore mémorisée. Lorsque vous ajusterez manuellement les portions de vos aliments lors d\'un repas (ex. semoule, pain tabouna, pâtes), l\'application mémorisera vos quantités habituelles pour les proposer automatiquement.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Validated Meals List & Filter Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {isAr ? `سجل الوجبات (${displayedMeals.length})` : `Journal des repas (${displayedMeals.length})`}
            </h2>
          </div>

          {/* Filter: All vs Favorites & Clear Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? `جميع الوجبات (${meals.length})` : `Tous les repas (${meals.length})`}
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
                <span>{isAr ? `المفضلة (${favoriteMeals.length})` : `Favoris (${favoriteMeals.length})`}</span>
              </button>
            </div>

            {onClearAllMeals && meals.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'حذف جميع الوجبات من السجل' : "Supprimer définitivement tous les repas de l'historique"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مسح السجل' : 'Vider l\'historique'}</span>
              </button>
            )}
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
                      title={isAr ? (meal.is_favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة') : (meal.is_favorite ? 'Retirer des favoris' : 'Ajouter aux repas favoris')}
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
                      {isAr ? (meal.meal_name_ar || meal.meal_name) : meal.meal_name}
                    </h3>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        meal.overall_confidence === 'high'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {meal.overall_confidence === 'high'
                        ? (isAr ? '🟢 دقة عالية' : '🟢 Élevée')
                        : (isAr ? '🟡 متوسطة' : '🟡 Moyenne')}
                    </span>

                    {meal.created_at && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(meal.created_at).toLocaleDateString(isAr ? 'ar-TN' : 'fr-FR', {
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
                        {isAr
                          ? `${item.name_ar || item.name_fr} (${item.confirmed_weight_g || item.estimated_weight_g} غ ← ≈ ${item.calculated_carbs} غ)`
                          : `${item.name_fr} (${item.confirmed_weight_g || item.estimated_weight_g} g → ≈ ${item.calculated_carbs} g)`}
                      </span>
                    ))}
                  </div>

                  {/* Bolus details chip if calculated */}
                  {meal.bolus_calculated && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Syringe className="w-3 h-3" />
                        {isAr
                          ? `الجرعة: ${meal.bolus_calculated.totalBolus} وحدة`
                          : `Bolus : ${meal.bolus_calculated.totalBolus} UI`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (
                        {isAr
                          ? `طعام: ${meal.bolus_calculated.mealBolus} و`
                          : `Repas : ${meal.bolus_calculated.mealBolus} UI`}
                        {meal.bolus_calculated.correctionBolus > 0 &&
                          (isAr
                            ? ` • تصحيح: +${meal.bolus_calculated.correctionBolus} و`
                            : ` • Corr. : +${meal.bolus_calculated.correctionBolus} UI`)}
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
                        title={isAr ? 'تعديل قياس سكر ما بعد الأكل' : 'Modifier le contrôle post-prandial'}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>
                          {isAr ? '+2 س :' : '+2h :'} {meal.post_prandial_glucose} {userProfile?.glucoseUnit || (isAr ? 'غ/ل' : 'g/L')}
                          {meal.post_prandial_evaluation === 'target' && (isAr ? ' (الهدف 🎯)' : ' (Cible 🎯)')}
                          {meal.post_prandial_evaluation === 'hyper' && (isAr ? ' (مرتفع ⚠️)' : ' (Hyper ⚠️)')}
                          {meal.post_prandial_evaluation === 'hypo' && (isAr ? ' (منخفض 🚨)' : ' (Hypo 🚨)')}
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
                          <span>{isAr ? '+ تسجيل سكر ما بعد الأكل (+2س)' : '+ Saisir contrôle (+2h)'}</span>
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
                          {meal.activity_level === 'light_walk' && (isAr ? 'مشي خفيف (-15%)' : 'Marche (-15%)')}
                          {meal.activity_level === 'moderate' && (isAr ? 'رياضة معتدلة (-30%)' : 'Sport modéré (-30%)')}
                          {meal.activity_level === 'intense' && (isAr ? 'رياضة مكثفة (-50%)' : 'Sport intense (-50%)')}
                        </span>
                      </span>
                    )}

                    {/* Ramadan Slot Badge */}
                    {meal.ramadan_slot && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200/60">
                        <Moon className="w-3 h-3 text-purple-600" />
                        <span>
                          {meal.ramadan_slot === 'iftar' ? (isAr ? 'الإفطار' : 'Iftar') :
                           meal.ramadan_slot === 'sahriya' ? (isAr ? 'السهرية' : 'Sahriya') :
                           meal.ramadan_slot === 'shor' ? (isAr ? 'السحور' : 'Shor') : (isAr ? 'وجبة خفيفة' : 'Collation')}
                        </span>
                      </span>
                    )}

                    {/* IG & CG metrics */}
                    {meal.average_glycemic_index && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isAr ? `مؤشر السكر ${meal.average_glycemic_index} • الحمل السكري ${meal.total_glycemic_load || '—'}` : `IG ${meal.average_glycemic_index} • CG ${meal.total_glycemic_load || '—'}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className={isAr ? 'text-left' : 'text-right'}>
                    <span className="text-xs font-bold text-slate-500 block">
                      {isAr ? 'إجمالي الكربوهيدرات' : 'Total glucides'}
                    </span>
                    <span className="text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/70 inline-block">
                      ≈ {meal.total_carbs} {isAr ? 'غ' : 'g'}
                    </span>
                  </div>

                  {/* Re-estimate action button */}
                  <button
                    onClick={() => onSelectMeal(meal)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer"
                    title={isAr ? 'إعادة تقدير أو تعديل هذه الوجبة' : 'Ré-estimer ou ajuster ce repas'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Delete action */}
                  {onDeleteMeal && (
                    <button
                      onClick={() => onDeleteMeal(meal.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title={isAr ? 'حذف هذه الوجبة من السجل' : "Supprimer ce repas de l'historique"}
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
                <h3 className="text-base font-extrabold text-slate-800">
                  {isAr ? 'لا توجد وجبات مفضلة حتى الآن' : 'Aucun repas favori pour le moment'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isAr
                    ? 'انقر على النجمة بجانب أي وجبة مسجلة لحفظها في المفضلة والوصول إليها بسرعة.'
                    : 'Cliquez sur l\'étoile à côté du nom de n\'importe quel repas enregistré pour le retrouver instantanément dans vos favoris.'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'عرض جميع الوجبات' : 'Voir tous les repas'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <Utensils className="w-6 h-6" />
                </div>

                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-base font-black text-slate-900">
                    {isAr ? 'دفتر وجباتك جاهز لتسجيل وجبتك الأولى' : 'Votre carnet de repas est prêt'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr
                      ? 'اختبر فوراً حساب الكربوهيدرات وجرعة الإنسولين السريع بنقرة واحدة عبر باقة من أشهر الأكلات التونسية:'
                      : 'Testez immédiatement l\'analyse des glucides et le calcul de bolus d\'insuline personnalisé en 1 clic grâce aux suggestions de plats tunisiens typiques :'}
                  </p>
                </div>

                {/* Interactive quick chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-2xl mx-auto pt-1 text-left rtl:text-right">
                  {[
                    {
                      name: isAr ? 'كسكسي بالسمك والخضار' : 'Couscous au poisson',
                      nameTn: isAr ? 'كسكسي بالحوت' : 'Kskousi bel hout',
                      desc: isAr ? 'سميد مطبوخ بالبخار، سمك وراتة، جزر، قرع' : 'Semoule, daurade, carotte, courgette',
                      carbs: 68,
                      ig: isAr ? 'مؤشر 55' : 'IG 55',
                      icon: '🐟',
                    },
                    {
                      name: isAr ? 'بريكة بالبيض والتونة' : "Brik à l'oeuf & thon",
                      nameTn: isAr ? 'بريكة بالعظمة والتن' : 'Brika bel aadhma',
                      desc: isAr ? 'ورقة ملسوقة مقلية، بيضة، بقدونس، تونة' : 'Feuille malsouka, oeuf, persil, thon',
                      carbs: 24,
                      ig: isAr ? 'مؤشر 45' : 'IG 45',
                      icon: '🍳',
                    },
                    {
                      name: isAr ? 'صحن تونسي تقليدي' : 'Plat Tunisien traditionnel',
                      nameTn: isAr ? 'صحن تونسي' : 'Sahn Tounsi',
                      desc: isAr ? 'سلاطة مشوية، تونة، بيض مسلوق، زيتون، خبز' : 'Salade méchouia, thon, oeuf dur, olives, pain',
                      carbs: 32,
                      ig: isAr ? 'مؤشر 40' : 'IG 40',
                      icon: '🥗',
                    },
                    {
                      name: isAr ? 'فريكاسي تونسي (قطعتان)' : 'Fricassé tunisien (2 pièces)',
                      nameTn: isAr ? '2 كعبات فريكاسي' : '2 Fricassés',
                      desc: isAr ? 'خبز مقلي، بطاطا، تونة، هريسة عربي' : 'Pain frit garni pomme de terre, thon, harissa',
                      carbs: 45,
                      ig: isAr ? 'مؤشر 65' : 'IG 65',
                      icon: '🥪',
                    },
                    {
                      name: isAr ? 'كفتاجي تونسي بالبيض' : 'Kafteji tunisien',
                      nameTn: isAr ? 'كفتاجي بالعظمة' : 'Kafteji bel aadhma',
                      desc: isAr ? 'قرع، فلفل، طماطم مقلية مع بيض مقلي' : 'Légumes hachés, courge, piments, oeufs',
                      carbs: 22,
                      ig: isAr ? 'مؤشر 45' : 'IG 45',
                      icon: '🌶️',
                    },
                    {
                      name: isAr ? 'عجة تونسية بالمرقاز' : 'Ojja merguez tunisienne',
                      nameTn: isAr ? 'عجة بالمرقاز' : 'Ojja bel merguez',
                      desc: isAr ? 'صلصة طماطم فواحة، بيض، مرقاز، زيت زيتون' : 'Tomate, oeufs, merguez épicées, huile olive',
                      carbs: 18,
                      ig: isAr ? 'مؤشر 35' : 'IG 35',
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
                        <span className="font-extrabold text-emerald-700">≈ {preset.carbs} {isAr ? 'غ كربوهيدرات' : 'g glucides'}</span>
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
                    <span>{isAr ? 'تصوير أو إدخال وجبة أخرى' : 'Prendre une photo ou saisir un autre repas'}</span>
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
