import React from 'react';
import { CheckCircle2, Sparkles, History, PlusCircle } from 'lucide-react';
import { AnalyzedMeal } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface MealValidationSuccessProps {
  meal: AnalyzedMeal;
  onNewMeal: () => void;
  onViewHistory: () => void;
}

export const MealValidationSuccess: React.FC<MealValidationSuccessProps> = ({
  meal,
  onNewMeal,
  onViewHistory,
}) => {
  const { language, t } = useLanguage();
  const correctedCount = meal.items.filter((i) => i.is_corrected).length;

  return (
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 text-center animate-in zoom-in-95 duration-200">
      {/* Big Animated Success Badge */}
      <div className="w-18 h-18 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/15">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        {language === 'ar' ? 'تم تسجيل الوجبة وتثبيتها بنجاح' : 'Repas validé et enregistré'}
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {meal.meal_name}
      </h1>

      {/* Main Carb Total Display & Calculated Bolus */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {language === 'ar' ? 'الكربوهيدرات المعتمدة' : 'Glucides validés'}
          </span>
          <span className="text-4xl sm:text-5xl font-black text-emerald-700 tracking-tight block">
            ≈ {meal.total_carbs} {language === 'ar' ? 'غ' : 'g'}
          </span>
          <span className="text-xs text-slate-500 mt-2 block">
            {language === 'ar' ? `${meal.items.length} أصناف تم التحقق منها` : `${meal.items.length} composants vérifiés`}
          </span>
        </div>

        {meal.bolus_calculated ? (
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xs text-center flex flex-col justify-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              {language === 'ar' ? 'جرعة الإنسولين المقترحة' : 'Bolus d’insuline suggéré'}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight block">
              {meal.bolus_calculated.totalBolus} {language === 'ar' ? 'وحدة' : 'UI'}
            </span>
            <span className="text-xs text-slate-400 mt-2 block">
              {language === 'ar'
                ? `الوجبة: ${meal.bolus_calculated.mealBolus} و${meal.bolus_calculated.correctionBolus > 0 ? ` • تصحيح: +${meal.bolus_calculated.correctionBolus} و` : ''}`
                : `Repas : ${meal.bolus_calculated.mealBolus} UI${meal.bolus_calculated.correctionBolus > 0 ? ` • Correction : +${meal.bolus_calculated.correctionBolus} UI` : ''}`}
            </span>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs text-center flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {language === 'ar' ? 'مكافئ الخبز والسكر' : 'Équivalence Pain'}
            </span>
            <span className="text-3xl font-black text-slate-800 tracking-tight block">
              ≈ {Math.round(meal.total_carbs / 10)} {language === 'ar' ? 'قطع سكر' : 'morceaux'}
            </span>
            <span className="text-xs text-slate-500 mt-2 block">
              {language === 'ar' ? '(قطعة سكر ≈ 5 غ • ربع باقية خبز ≈ 30 غ)' : '(1 morceau de sucre ≈ 5 g • 1/4 baguette ≈ 30 g)'}
            </span>
          </div>
        )}
      </div>

      {/* Active Learning Callout */}
      {correctedCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-left rtl:text-right text-xs text-teal-950">
          <strong className="font-bold text-teal-900 block mb-1">
            {language === 'ar' ? '🧠 خوارزمية التعلم النشط المستمر (Active Learning)' : '🧠 Boucle d’apprentissage active (Active Learning)'}
          </strong>
          {language === 'ar'
            ? `تم تسجيل ${correctedCount} تعديل(ات) على الحصص. يقوم نظام الذكاء الاصطناعي بتخصيص تقديراتك المستقبلية لتتطابق تلقائياً مع عاداتك الغذائية.`
            : `${correctedCount} ajustement(s) de portion enregistré(s). L’IA GlucoMeal affine votre profil personnalisé pour vous proposer vos portions habituelles lors des prochains repas.`}
        </div>
      )}

      {/* Habit reference note */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left rtl:text-right text-xs text-slate-600">
        <strong className="text-slate-800 block mb-1">
          {language === 'ar' ? '💡 مرجع العادات الغذائية المحلية' : '💡 Habitude alimentaire locale'}
        </strong>
        {language === 'ar'
          ? 'تمت إضافة هذه الوجبة إلى سجلك التونسي المرجعي. يمكنك إعادة استخدامها بنقرة واحدة في الوجبات القادمة.'
          : 'Ce repas s’inscrit dans votre historique de référence tunisien. Vous pourrez le retrouver d’un simple clic pour vos prochaines estimations.'}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          id="btn-success-new-meal"
          onClick={onNewMeal}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('success_new_meal_btn')}</span>
        </button>

        <button
          id="btn-success-view-history"
          onClick={onViewHistory}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <History className="w-4 h-4" />
          <span>{t('success_view_history_btn')}</span>
        </button>
      </div>
    </div>
  );
};
