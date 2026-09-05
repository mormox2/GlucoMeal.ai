import React from 'react';
import { Camera, Mic, Keyboard, Barcode, Clock, ArrowRight, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { AnalyzedMeal, InputMode } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, isRtl, language } = useLanguage();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-6xl 2xl:max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Title & Slogan */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('banner_engine')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {t('home_title')}
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          {t('home_subtitle')}
        </p>
      </div>

      {/* 4 Main Action Cards: Spacious vertical layout for Large PC screens & Tablets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 mb-10 sm:mb-12">
        {/* 1. Photo */}
        <button
          id="btn-mode-photo"
          onClick={() => onSelectMode('photo')}
          className="group relative flex flex-col justify-between p-5 xl:p-6 rounded-3xl bg-white border-2 border-emerald-500/30 hover:border-emerald-500 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all text-left rtl:text-right cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between w-full mb-4">
              <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                {t('mode_photo_badge')}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base xl:text-lg group-hover:text-emerald-700 transition-colors leading-snug">
              {t('mode_photo_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('mode_photo_desc')}
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
            <span>{t('mode_photo_action')}</span>
            <ArrowIcon className="w-3.5 h-3.5 mx-1" />
          </div>
        </button>

        {/* 2. Voix */}
        <button
          id="btn-mode-voice"
          onClick={() => onSelectMode('voice')}
          className="group relative flex flex-col justify-between p-5 xl:p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all text-left rtl:text-right cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between w-full mb-4">
              <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                {t('mode_voice_badge')}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base xl:text-lg group-hover:text-teal-700 transition-colors leading-snug">
              {t('mode_voice_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('mode_voice_desc')}
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-teal-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
            <span>{t('mode_voice_action')}</span>
            <ArrowIcon className="w-3.5 h-3.5 mx-1" />
          </div>
        </button>

        {/* 3. Texte */}
        <button
          id="btn-mode-text"
          onClick={() => onSelectMode('text')}
          className="group relative flex flex-col justify-between p-5 xl:p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all text-left rtl:text-right cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between w-full mb-4">
              <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Keyboard className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
              <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                {t('mode_text_badge')}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base xl:text-lg group-hover:text-indigo-700 transition-colors leading-snug">
              {t('mode_text_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('mode_text_desc')}
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
            <span>{t('mode_text_action')}</span>
            <ArrowIcon className="w-3.5 h-3.5 mx-1" />
          </div>
        </button>

        {/* 4. Code-barres */}
        <button
          id="btn-mode-barcode"
          onClick={() => onSelectMode('barcode')}
          className="group relative flex flex-col justify-between p-5 xl:p-6 rounded-3xl bg-white border-2 border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all text-left rtl:text-right cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between w-full mb-4">
              <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Barcode className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                {t('mode_barcode_badge')}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base xl:text-lg group-hover:text-amber-700 transition-colors leading-snug">
              {t('mode_barcode_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('mode_barcode_desc')}
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-700 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
            <span>{t('mode_barcode_action')}</span>
            <ArrowIcon className="w-3.5 h-3.5 mx-1" />
          </div>
        </button>
      </div>

      {/* Fundamental rule callout banner */}
      <div className="mb-10 p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5 font-black text-xs">
          ≈ g
        </div>
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong className="text-emerald-900 font-bold block mb-0.5">
            {t('rule_banner_title')}
          </strong>
          {t('rule_banner_desc')}
        </div>
      </div>

      {/* Section: Derniers Repas (3-col Grid on Desktop PC) */}
      <div className="border-t border-slate-200/70 pt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {t('recent_meals_title')}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {t('recent_meals_subtitle')}
          </span>
        </div>

        {recentMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {recentMeals.slice(0, 6).map((meal) => (
              <div
                key={meal.id}
                id={`recent-meal-${meal.id}`}
                onClick={() => onSelectRecentMeal(meal)}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg shrink-0">
                    {meal.meal_name.toLowerCase().includes('couscous') ? '🥣' :
                     meal.meal_name.toLowerCase().includes('lablabi') ? '🥣' :
                     meal.meal_name.toLowerCase().includes('ojja') ? '🍳' :
                     meal.meal_name.toLowerCase().includes('makrouna') || meal.meal_name.toLowerCase().includes('pâte') ? '🍝' :
                     meal.meal_name.toLowerCase().includes('pain') ? '🥖' : '🍽️'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {meal.meal_name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {meal.items.map((i) => (language === 'ar' && i.name_ar ? i.name_ar : i.name_fr).split(' ')[0]).join(' + ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3 rtl:mr-3 rtl:ml-0">
                  <div className="text-right rtl:text-left">
                    <span className="text-sm font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 block">
                      ≈ {meal.total_carbs} {language === 'ar' ? 'غ' : 'g'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {meal.overall_confidence === 'high' ? (language === 'ar' ? '🟢 دقة عالية' : '🟢 Élevée') : meal.overall_confidence === 'medium' ? (language === 'ar' ? '🟡 متوسطة' : '🟡 Moyenne') : (language === 'ar' ? '🔴 منخفضة' : '🔴 Faible')}
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-xs text-slate-500">
              {t('empty_meals')}
            </p>
          </div>
        )}
      </div>

      {/* Benchmark CTA */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-amber-900">
            {t('benchmark_cta_title')}
          </h4>
          <p className="text-xs text-amber-700/90 mt-0.5">
            {t('benchmark_cta_desc')}
          </p>
        </div>
        <button
          onClick={onOpenBenchmark}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors cursor-pointer"
        >
          {t('benchmark_cta_btn')}
        </button>
      </div>
    </div>
  );
};

