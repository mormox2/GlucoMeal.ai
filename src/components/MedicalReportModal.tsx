import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Calendar,
  Syringe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  PieChart as PieIcon,
  ChevronRight,
  ShieldCheck,
  Clock,
  Heart,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meals: AnalyzedMeal[];
  userProfile: UserProfileDT1;
}

type PeriodFilter = 7 | 14 | 30 | 90;

export const MedicalReportModal: React.FC<MedicalReportModalProps> = ({
  isOpen,
  onClose,
  meals,
  userProfile,
}) => {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';
  const dateLocale = isAr ? 'ar-TN' : 'fr-FR';

  const [periodDays, setPeriodDays] = useState<PeriodFilter>(14);

  // Filtrer les repas sur la période sélectionnée
  const filteredMeals = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    return meals
      .filter((m) => {
        if (!m.created_at) return true;
        return new Date(m.created_at) >= cutoffDate;
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // plus récent en premier
      });
  }, [meals, periodDays]);

  // Agrégats statistiques pour le médecin
  const stats = useMemo(() => {
    const totalMealsCount = filteredMeals.length;
    if (totalMealsCount === 0) {
      return {
        totalMealsCount: 0,
        avgDailyCarbs: 0,
        avgDailyBolus: 0,
        totalCarbsSum: 0,
        totalBolusSum: 0,
        targetPostPrandialRate: 0,
        hyperPostPrandialCount: 0,
        hypoPostPrandialCount: 0,
        slotBreakdown: { morning: 0, lunch: 0, dinner: 0, snack: 0 },
        slotCarbsAvg: { morning: 0, lunch: 0, dinner: 0, snack: 0 },
        topMeals: [] as { name: string; count: number; avgCarbs: number }[],
        dailyData: [] as { date: string; dateLabel: string; carbs: number; bolus: number }[],
      };
    }

    let totalCarbsSum = 0;
    let totalBolusSum = 0;
    let postPrandialMeasured = 0;
    let postPrandialInTarget = 0;
    let hyperCount = 0;
    let hypoCount = 0;

    const slotCarbs: Record<string, { count: number; totalCarbs: number }> = {
      morning: { count: 0, totalCarbs: 0 },
      lunch: { count: 0, totalCarbs: 0 },
      dinner: { count: 0, totalCarbs: 0 },
      snack: { count: 0, totalCarbs: 0 },
    };

    const mealFrequency: Record<string, { count: number; totalCarbs: number }> = {};
    const daysMap: Record<string, { carbs: number; bolus: number; count: number }> = {};

    filteredMeals.forEach((meal) => {
      totalCarbsSum += meal.total_carbs;
      const bolusUnits = meal.bolus_calculated?.totalBolus || 0;
      totalBolusSum += bolusUnits;

      // Slot
      const slot = meal.bolus_calculated?.slot || 'lunch';
      if (slotCarbs[slot]) {
        slotCarbs[slot].count += 1;
        slotCarbs[slot].totalCarbs += meal.total_carbs;
      }

      // Post-prandial
      if (typeof meal.post_prandial_glucose === 'number') {
        postPrandialMeasured += 1;
        if (meal.post_prandial_evaluation === 'target') postPrandialInTarget += 1;
        if (meal.post_prandial_evaluation === 'hyper') hyperCount += 1;
        if (meal.post_prandial_evaluation === 'hypo') hypoCount += 1;
      }

      // Frequence plat
      const cleanName = (isAr && meal.meal_name_ar ? meal.meal_name_ar : meal.meal_name).trim();
      if (!mealFrequency[cleanName]) {
        mealFrequency[cleanName] = { count: 0, totalCarbs: 0 };
      }
      mealFrequency[cleanName].count += 1;
      mealFrequency[cleanName].totalCarbs += meal.total_carbs;

      // Agrégation jour par jour
      const d = meal.created_at ? new Date(meal.created_at) : new Date();
      const dayKey = d.toISOString().slice(0, 10);
      if (!daysMap[dayKey]) {
        daysMap[dayKey] = { carbs: 0, bolus: 0, count: 0 };
      }
      daysMap[dayKey].carbs += meal.total_carbs;
      daysMap[dayKey].bolus += bolusUnits;
      daysMap[dayKey].count += 1;
    });

    // Jours uniques enregistrés
    const uniqueDaysCount = Math.max(1, Object.keys(daysMap).length);
    const avgDailyCarbs = Math.round(totalCarbsSum / uniqueDaysCount);
    const avgDailyBolus = Number((totalBolusSum / uniqueDaysCount).toFixed(1));

    const targetPostPrandialRate =
      postPrandialMeasured > 0
        ? Math.round((postPrandialInTarget / postPrandialMeasured) * 100)
        : 85;

    // Top 5 repas
    const topMeals = Object.entries(mealFrequency)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgCarbs: Math.round(data.totalCarbs / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Chart daily data (tri chronologique)
    const dailyData = Object.entries(daysMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, val]) => {
        const d = new Date(dayKey);
        return {
          date: dayKey,
          dateLabel: d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' }),
          carbs: val.carbs,
          bolus: Number(val.bolus.toFixed(1)),
        };
      });

    return {
      totalMealsCount,
      avgDailyCarbs,
      avgDailyBolus,
      totalCarbsSum,
      totalBolusSum: Number(totalBolusSum.toFixed(1)),
      targetPostPrandialRate,
      hyperPostPrandialCount: hyperCount,
      hypoPostPrandialCount: hypoCount,
      slotBreakdown: {
        morning: slotCarbs.morning.count,
        lunch: slotCarbs.lunch.count,
        dinner: slotCarbs.dinner.count,
        snack: slotCarbs.snack.count,
      },
      slotCarbsAvg: {
        morning: slotCarbs.morning.count ? Math.round(slotCarbs.morning.totalCarbs / slotCarbs.morning.count) : 0,
        lunch: slotCarbs.lunch.count ? Math.round(slotCarbs.lunch.totalCarbs / slotCarbs.lunch.count) : 0,
        dinner: slotCarbs.dinner.count ? Math.round(slotCarbs.dinner.totalCarbs / slotCarbs.dinner.count) : 0,
        snack: slotCarbs.snack.count ? Math.round(slotCarbs.snack.totalCarbs / slotCarbs.snack.count) : 0,
      },
      topMeals,
      dailyData,
    };
  }, [filteredMeals, periodDays, isAr, dateLocale]);

  // Données de répartition des créneaux pour graphique Pie
  const slotPieData = [
    { name: isAr ? 'فطور الصباح' : 'Petit-déjeuner', value: stats.slotBreakdown.morning, color: '#3b82f6' },
    { name: isAr ? 'الغداء' : 'Déjeuner', value: stats.slotBreakdown.lunch, color: '#10b981' },
    { name: isAr ? 'العشاء' : 'Dîner', value: stats.slotBreakdown.dinner, color: '#8b5cf6' },
    { name: isAr ? 'لمجة' : 'Collation', value: stats.slotBreakdown.snack, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  // Impression native optimisée (mise en page A4 médicale)
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Médical structuré pour le diabétologue
  const handleExportCSV = () => {
    const headers = isAr
      ? [
          'التاريخ والوقت',
          'اسم الوجبة',
          'الفترة',
          'إجمالي الكربوهيدرات (غ)',
          'متوسط المؤشر السكري',
          'الحمل السكري',
          'معامل الكربوهيدرات (I:C)',
          'جرعة الوجبة (وحدة)',
          'جرعة التصحيح (وحدة)',
          'إجمالي الجرعة (وحدة)',
          'السكر قبل الأكل',
          'السكر بعد الأكل (+2س)',
          'تقييم بعد الأكل',
          'جرعة ثنائية مقترحة',
          'المكونات',
        ]
      : [
          'Date & Heure',
          'Nom du Repas',
          'Moment',
          'Total Glucides (g)',
          'Index Glycémique Moyen',
          'Charge Glycémique',
          'Ratio I:C (g/UI)',
          'Bolus Repas (UI)',
          'Bolus Correction (UI)',
          'Bolus Total (UI)',
          'Glycémie Pré-prandiale',
          'Glycémie Post-prandiale (+2h)',
          'Évaluation Post-prandiale',
          'Double Bolus Recommandé',
          'Composition Ingrédients',
        ];

    const rows = filteredMeals.map((m) => {
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleString(dateLocale) : '';
      const ingredients = m.items
        .map((i) => `${isAr && i.name_ar ? i.name_ar : i.name_fr} (${i.confirmed_weight_g}g -> ${i.calculated_carbs}g ${isAr ? 'كربوهيدرات' : 'glucides'})`)
        .join('; ');
      return [
        `"${dateStr}"`,
        `"${(isAr && m.meal_name_ar ? m.meal_name_ar : m.meal_name).replace(/"/g, '""')}"`,
        `"${m.bolus_calculated?.slot || ''}"`,
        m.total_carbs,
        m.average_glycemic_index || '',
        m.total_glycemic_load || '',
        m.bolus_calculated?.icRatio || '',
        m.bolus_calculated?.mealBolus || '',
        m.bolus_calculated?.correctionBolus || 0,
        m.bolus_calculated?.totalBolus || '',
        m.bolus_calculated?.currentGlucose ? `${m.bolus_calculated.currentGlucose} ${userProfile.glucoseUnit}` : '',
        m.post_prandial_glucose ? `${m.post_prandial_glucose} ${userProfile.glucoseUnit}` : '',
        `"${m.post_prandial_evaluation || (isAr ? 'لم يُقس' : 'Non renseigné')}"`,
        m.dual_wave?.is_recommended ? (isAr ? 'نعم (60% فوري / 40% ممتد)' : 'Oui (60% imm. / 40% étalé)') : (isAr ? 'لا' : 'Non'),
        `"${ingredients.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `glucomal-rapport-medical-${periodDays}j-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto ${
        isRtl ? 'font-arabic' : ''
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header non imprimable avec boutons d'actions */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isAr ? 'تقرير الاستشارة الطبية لمرض السكري' : 'Rapport de Consultation Diabétologique'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'ملخص سريري لاستهلاك الكربوهيدرات وجرعات الإنسولين وقياسات ما بعد الوجبات'
                  : 'Synthèse clinique des apports glucidiques, bolus et contrôles post-prandiaux'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Période selector */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriodDays(days)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    periodDays === days
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {isAr ? `${days} أيام` : `${days} jours`}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isAr ? 'تصدير كامل البيانات بصيغة CSV' : 'Exporter les données complètes au format CSV'}
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title={isAr ? 'طباعة أو حفظ بصيغة PDF' : "Imprimer ou enregistrer en PDF via la boîte d'impression du navigateur"}
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة / PDF' : 'Imprimer / PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENU PRINCIPAL DU RAPPORT (Imprimable) */}
        <div className="p-6 sm:p-8 space-y-6 print:p-6 print:space-y-4 text-slate-900">
          
          {/* Entête Médical Officiel */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 print:border-slate-300 print:bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                    {isAr ? 'جلوكوميل AI • السجل السريري للسكري النوع الأول' : 'GlucoMeal AI • Carnet Clinique DT1'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {isAr
                      ? `تاريخ الإصدار: ${new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : `Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {isAr ? 'الملخص العلاجي والسجل الغذائي' : 'Synthèse Thérapeutique & Journal Alimentaire'}
                </h1>
                <p className="text-xs text-slate-600">
                  {isAr
                    ? `المريض : `
                    : `Patient : `}
                  <strong className="text-slate-900">{userProfile.name}</strong>
                  {isAr
                    ? ` • الفترة المحللة : `
                    : ` • Période analysée : `}
                  <strong>
                    {isAr ? `آخر ${periodDays} يوماً` : `${periodDays} derniers jours`}
                  </strong>
                  {` (${stats.totalMealsCount} ${isAr ? 'وجبة موثقة' : 'repas documentés'})`}
                </p>
                {userProfile.isHoneymoonPhase && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-950 text-xs font-bold border border-amber-300">
                    <span>
                      {isAr
                        ? '🍯 مرحلة شهر العسل (هدأة سريرية جزئية)'
                        : '🍯 Phase de Lune de Miel (Rémission clinique partielle)'}
                    </span>
                    {userProfile.diagnosisDate && (
                      <span className="font-normal opacity-85">
                        {isAr ? `• التشخيص: ${userProfile.diagnosisDate}` : `• Diagnostic : ${userProfile.diagnosisDate}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Ratios ITF actifs */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs shrink-0">
                <span className="font-extrabold text-slate-800 block mb-1">
                  {isAr ? 'بروتوكول الإنسولين الوظيفي النشط :' : 'Protocole ITF Actif :'}
                </span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600 text-[11px]">
                  <span>
                    {isAr ? 'الصباح :' : 'Matin :'}{' '}
                    <strong>
                      {isAr
                        ? `1 و / ${userProfile?.icRatios?.morning ?? 8} غ`
                        : `1 UI / ${userProfile?.icRatios?.morning ?? 8}g`}
                    </strong>
                  </span>
                  <span>
                    {isAr ? 'الغداء :' : 'Midi :'}{' '}
                    <strong>
                      {isAr
                        ? `1 و / ${userProfile?.icRatios?.lunch ?? 10} غ`
                        : `1 UI / ${userProfile?.icRatios?.lunch ?? 10}g`}
                    </strong>
                  </span>
                  <span>
                    {isAr ? 'العشاء :' : 'Soir :'}{' '}
                    <strong>
                      {isAr
                        ? `1 و / ${userProfile?.icRatios?.dinner ?? 12} غ`
                        : `1 UI / ${userProfile?.icRatios?.dinner ?? 12}g`}
                    </strong>
                  </span>
                  <span>
                    {isAr ? 'اللمجة :' : 'Collation :'}{' '}
                    <strong>
                      {isAr
                        ? `1 و / ${userProfile?.icRatios?.snack ?? 10} غ`
                        : `1 UI / ${userProfile?.icRatios?.snack ?? 10}g`}
                    </strong>
                  </span>
                  <span className="col-span-2 pt-1 border-t border-slate-100 text-slate-500">
                    {isAr ? 'الهدف :' : 'Cible :'}{' '}
                    <strong>
                      {userProfile?.targetGlucose ?? 1.0} {userProfile?.glucoseUnit ?? 'g/L'}
                    </strong>
                    {' • '}
                    {isAr ? 'الحساسية (ISF) :' : 'ISF :'}{' '}
                    <strong>
                      {userProfile?.isf ?? 0.4} {userProfile?.glucoseUnit ?? 'g/L'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Indicateurs Clés pour Diabétologue */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isAr ? 'معدل الكربوهيدرات / اليوم' : 'Glucides Moyens / Jour'}
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  {stats.avgDailyCarbs}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {isAr ? 'غ/ي' : 'g/j'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAr ? `الإجمالي : ${stats.totalCarbsSum} غ` : `Total : ${stats.totalCarbsSum} g`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isAr ? 'معدل الإنسولين السريع / اليوم' : 'Bolus Moyen / Jour'}
                </span>
                <span className="text-2xl font-black text-blue-900">
                  {stats.avgDailyBolus}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {isAr ? 'و/ي' : 'UI/j'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAr
                    ? `إجمالي السريع : ${stats.totalBolusSum} وحدة`
                    : `Total insuline rapide : ${stats.totalBolusSum} UI`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isAr ? 'الهدف بعد الأكل (+2س)' : 'Objectif Post-Prandial (+2h)'}
                </span>
                <span className="text-2xl font-black text-emerald-800">
                  {stats.targetPostPrandialRate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {stats.hyperPostPrandialCount > 0 &&
                    `${stats.hyperPostPrandialCount} ${isAr ? 'ارتفاع ' : 'hyper '}`}
                  {stats.hypoPostPrandialCount > 0 &&
                    `• ${stats.hypoPostPrandialCount} ${isAr ? 'هبوط' : 'hypo'}`}
                  {stats.hyperPostPrandialCount === 0 &&
                    stats.hypoPostPrandialCount === 0 &&
                    (isAr ? 'جميع الوجبات في الهدف' : 'Repas en cible')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isAr ? 'توزيع الكربوهيدرات حسب الوجبات' : 'Répartition par Repas'}
                </span>
                <div className="text-xs font-bold text-slate-800 mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'الغداء :' : 'Midi :'}</span>
                    <span>
                      {stats.slotCarbsAvg.lunch} {isAr ? 'غ كربوهيدرات' : 'g gluc.'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'العشاء :' : 'Soir :'}</span>
                    <span>
                      {stats.slotCarbsAvg.dinner} {isAr ? 'غ كربوهيدرات' : 'g gluc.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques d'Évolution (Glucides vs Bolus sur la période) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Graphique 1 : Tendance journalière des apports glucidiques */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr
                      ? 'التطور اليومي للكربوهيدرات وجرعات الإنسولين'
                      : "Évolution quotidienne des glucides et doses d'insuline"}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {stats.dailyData.length} {isAr ? 'أيام مسجلة' : 'jours documentés'}
                </span>
              </div>

              {stats.dailyData.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(val: any, name: any) => [
                          name === 'carbs'
                            ? `${val} ${isAr ? 'غ' : 'g'}`
                            : `${val} ${isAr ? 'وحدة' : 'UI'}`,
                          name === 'carbs'
                            ? (isAr ? 'كربوهيدرات الوجبة' : 'Glucides consommés')
                            : (isAr ? 'إجمالي الإنسولين السريع' : 'Bolus rapide total'),
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'carbs'
                            ? (isAr ? 'كربوهيدرات (غ)' : 'Glucides (g)')
                            : (isAr ? 'إنسولين سريع (وحدة)' : 'Insuline rapide (UI)')
                        }
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="carbs" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="bolus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  {isAr
                    ? 'لم يتم تسجيل أي وجبة خلال هذه الفترة.'
                    : 'Aucun repas enregistré sur cette période.'}
                </div>
              )}
            </div>

            {/* Graphique 2 : Plats tunisiens les plus fréquents */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'الأطباق التونسية الأكثر تكراراً' : 'Plats tunisiens les plus fréquents'}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {stats.topMeals.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 last:border-none">
                      <div className="truncate max-w-[170px]">
                        <span className="font-bold text-slate-800 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.count} {isAr ? 'مرات' : 'fois consommé'}
                        </span>
                      </div>
                      <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                        ≈ {item.avgCarbs} {isAr ? 'غ' : 'g'}
                      </span>
                    </div>
                  ))}
                  {stats.topMeals.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">
                      {isAr ? 'لا توجد وجبات متكررة بعد' : 'Pas encore de répétitions de repas'}
                    </p>
                  )}
                </div>
              </div>

              {/* Note clinique pour double-vague */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                💡 <strong>{isAr ? 'نصيحة الإنسولين الوظيفي :' : 'Conseil ITF :'}</strong>{' '}
                {isAr
                  ? 'للأطباق التقليدية الغنية بالدهون والبروتين (كسكسي باللحم، عجة)، تحقق مما إذا كانت نسبة السكر بعد 3 ساعات تتطلب جرعة ثنائية ممتدة (Dual-Wave).'
                  : 'Pour les plats traditionnels gras (couscous agneau, ojja), vérifier si la glycémie à +3h nécessite un bolus carré (Dual-Wave).'}
              </div>
            </div>
          </div>

          {/* Tableau Détaillé des Repas pour Diabétologue */}
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isAr
                    ? `السجل الزمني للوجبات (${filteredMeals.length})`
                    : `Relevé chronologique des repas (${filteredMeals.length})`}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {isAr ? 'مرتبة من الأحدث إلى الأقدم' : 'Trié par date décroissante'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-3.5">{isAr ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                    <th className="py-3 px-3">{isAr ? 'الوجبة التونسية' : 'Repas Tunisien'}</th>
                    <th className="py-3 px-3">{isAr ? 'تفاصيل الكربوهيدرات' : 'Détail Glucidique'}</th>
                    <th className="py-3 px-2 text-center">{isAr ? 'المؤشر / الحمل' : 'IG / CG'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'جرعة الوجبة' : 'Bolus Repas'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'السكر قبل الأكل' : 'Glycémie Pré'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'السكر بعد ساعتين' : 'Glycémie +2h'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'نوع الجرعة' : 'Bolus Mixte'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeals.map((meal) => {
                    const dateObj = meal.created_at ? new Date(meal.created_at) : new Date();
                    const dateFormatted = dateObj.toLocaleDateString(dateLocale, {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={meal.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {isAr && meal.meal_name_ar ? meal.meal_name_ar : meal.meal_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {meal.items.map((it) => (isAr && it.name_ar ? it.name_ar : it.name_fr)).slice(0, 2).join('، ')}
                            {meal.items.length > 2 && '...'}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            ≈ {meal.total_carbs} {isAr ? 'غ' : 'g'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isAr
                              ? `المعامل : 1 و / ${meal.bolus_calculated?.icRatio || userProfile?.icRatios?.lunch || 10}غ`
                              : `Ratio : 1UI / ${meal.bolus_calculated?.icRatio || userProfile?.icRatios?.lunch || 10}g`}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className="text-[11px] font-bold text-slate-700">
                            {isAr ? 'م.س' : 'IG'} {meal.average_glycemic_index || 55}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {isAr ? 'ح.س' : 'CG'} {meal.total_glycemic_load || Math.round((meal.total_carbs * 55) / 100)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-black text-slate-900 bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md">
                            {meal.bolus_calculated?.totalBolus || '—'} {isAr ? 'وحدة' : 'UI'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          {meal.bolus_calculated?.currentGlucose
                            ? `${meal.bolus_calculated.currentGlucose} ${userProfile.glucoseUnit}`
                            : '—'}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {meal.post_prandial_glucose ? (
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md ${
                                meal.post_prandial_evaluation === 'target'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : meal.post_prandial_evaluation === 'hyper'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {meal.post_prandial_glucose} {userProfile.glucoseUnit}
                              {meal.post_prandial_evaluation === 'target' && ' 🎯'}
                              {meal.post_prandial_evaluation === 'hyper' && ' ⚠️'}
                              {meal.post_prandial_evaluation === 'hypo' && ' 🚨'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {isAr ? 'لم يُقس' : 'Non mesuré'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                          {meal.dual_wave?.is_recommended ? (
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                              {isAr ? 'ثنائي 60/40' : 'Dual 60/40'}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {isAr ? 'عادي' : 'Standard'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Notes Cliniques pour le Diabétologue */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-600 print:block">
            <h4 className="font-extrabold text-slate-800 mb-1">
              {isAr
                ? 'الملاحظات السريرية والتعديل العلاجي (طبيب السكري) :'
                : 'Observations Cliniques & Adaptation Thérapeutique (Diabétologue) :'}
            </h4>
            <div className="h-16 border-b border-slate-200 mt-2"></div>
            <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400">
              <span>
                {isAr
                  ? 'توقيع وخاتم الطبيب المعالج : _________________________'
                  : 'Signature & Cachet du Médecin : _________________________'}
              </span>
              <span>
                {isAr
                  ? 'موعد المراجعة القادم : _________________________'
                  : 'Prochain RDV de contrôle : _________________________'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
