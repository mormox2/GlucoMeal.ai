import React from 'react';
import {
  ShieldCheck,
  Camera,
  Activity,
  ArrowRight,
  Clock,
  Check,
  Lock,
  HeartPulse,
  Scale,
  Download,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingPageViewProps {
  onStartSignUp: () => void;
  onStartLogin: () => void;
  onEnterAppDirectly: () => void;
  onOpenDoctorPortal?: () => void;
  onOpenInstallModal?: () => void;
  deferredPrompt?: any;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onStartSignUp,
  onStartLogin,
  onEnterAppDirectly,
  onOpenDoctorPortal,
  onOpenInstallModal,
  deferredPrompt,
}) => {
  const { t, isRtl } = useLanguage();

  const handleInstall = () => {
    if (onOpenInstallModal) {
      onOpenInstallModal();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Top Clinical Compliance Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium text-center sm:text-start">
              {t('landing_top_banner')}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden md:inline shrink-0">
            {t('landing_top_sub')}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  GlucoMeal
                </span>
                <span className="text-emerald-700 font-semibold text-xs">Clinical</span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
                {t('landing_header_subtitle')}
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#parents" className="hover:text-slate-900 transition-colors">
              {t('landing_nav_parents')}
            </a>
            <a href="#algorithme" className="hover:text-slate-900 transition-colors">
              {t('landing_nav_algorithm')}
            </a>
            <a href="#base-alimentaire" className="hover:text-slate-900 transition-colors">
              {t('landing_nav_database')}
            </a>
            {onOpenDoctorPortal && (
              <button
                type="button"
                onClick={onOpenDoctorPortal}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                {t('landing_nav_doctor')}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="header" />
            <button
              type="button"
              id="btn-landing-header-install"
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
              title="Installer GlucoMeal sur votre téléphone ou ordinateur"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">{t('landing_nav_install')}</span>
            </button>
            <button
              type="button"
              onClick={onStartLogin}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('landing_nav_login')}
            </button>
            <button
              type="button"
              onClick={onStartSignUp}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('landing_nav_signup')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{t('landing_hero_badge')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t('landing_hero_title')}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing_hero_desc')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onStartSignUp}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>{t('landing_cta_signup')}</span>
                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                </button>

                <button
                  type="button"
                  id="btn-landing-hero-install"
                  onClick={handleInstall}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{t('landing_install_hero_cta')}</span>
                </button>

                <button
                  type="button"
                  onClick={onEnterAppDirectly}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>{t('landing_cta_direct')}</span>
                </button>
              </div>

              {/* Strict clinical specs */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{t('landing_spec_pediatric')}</span>
                  <span className="text-slate-500 text-[11px]">{t('landing_spec_pediatric_sub')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{t('landing_spec_database')}</span>
                  <span className="text-slate-500 text-[11px]">{t('landing_spec_database_sub')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{t('landing_spec_cgm')}</span>
                  <span className="text-slate-500 text-[11px]">{t('landing_spec_cgm_sub')}</span>
                </div>
              </div>
            </div>

            {/* Right Content: Clean Clinical Dashboard Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{t('landing_demo_child')}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {t('landing_demo_badge')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {t('landing_demo_tutor')}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                      {t('landing_demo_glycemia')}
                    </span>
                  </div>
                </div>

                {/* Clinical plate evaluation card */}
                <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      {t('landing_demo_meal_title')}
                    </span>
                    <span className="text-[11px] text-slate-500 shrink-0">{t('landing_demo_optics')}</span>
                  </div>

                  <div className="space-y-1 text-xs border-y border-slate-100 py-2">
                    <div className="flex justify-between text-slate-600 gap-2">
                      <span>{t('landing_demo_dish_1')}</span>
                      <span className="font-mono font-semibold text-slate-900 shrink-0">46 g</span>
                    </div>
                    <div className="flex justify-between text-slate-600 gap-2">
                      <span>{t('landing_demo_dish_2')}</span>
                      <span className="font-mono font-semibold text-slate-900 shrink-0">22 g</span>
                    </div>
                    <div className="flex justify-between text-slate-600 gap-2">
                      <span>{t('landing_demo_dish_3')}</span>
                      <span className="font-mono font-semibold text-slate-900 shrink-0">14 g</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-0.5">
                    <span className="font-bold text-slate-700">{t('landing_demo_total_carbs')}</span>
                    <span className="font-mono font-extrabold text-sm text-slate-900">82 g</span>
                  </div>
                </div>

                {/* Insulin dose breakdown */}
                <div className="bg-slate-100 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{t('landing_demo_calculated_rx')}</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t('landing_demo_rx_units')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t('landing_demo_formula')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION INSTALLATION PWA IMMEDIATE */}
      <section className="py-8 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/40">
                    {t('landing_install_badge')}
                  </span>
                  <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5" />
                    {t('pwa_offline_badge')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t('landing_install_banner_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {t('landing_install_banner_desc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              <button
                type="button"
                id="btn-landing-spotlight-install"
                onClick={handleInstall}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{t('landing_install_btn_now')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION PARENTS & PEDIATRIE */}
      <section id="parents" className="py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t('landing_parents_badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('landing_parents_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('landing_parents_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t('landing_parents_card1_title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('landing_parents_card1_desc')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t('landing_parents_card2_title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('landing_parents_card2_desc')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-slate-900">{t('landing_parents_card3_title')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('landing_parents_card3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ALGORITHME & METHODOLOGIE ITF */}
      <section id="algorithme" className="py-16 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t('landing_algo_badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('landing_algo_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('landing_algo_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Scale className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">{t('landing_algo_card1_title')}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t('landing_algo_card1_desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Activity className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">{t('landing_algo_card2_title')}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t('landing_algo_card2_desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <Clock className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">{t('landing_algo_card3_title')}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t('landing_algo_card3_desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <HeartPulse className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">{t('landing_algo_card4_title')}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t('landing_algo_card4_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION BASE DE DONNEES TUNISIENNE & RAMADAN */}
      <section id="base-alimentaire" className="py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {t('landing_db_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {t('landing_db_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('landing_db_desc')}
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{t('landing_db_point1')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{t('landing_db_point2')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>{t('landing_db_point3_title')} </strong>
                    {t('landing_db_point3_desc')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">{t('landing_db_sample_title')}</span>
                <span className="text-[11px] text-slate-500 font-mono">{t('landing_db_sample_count')}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{t('landing_db_item1_name')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('landing_db_item1_portion')}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{t('landing_db_item1_carbs')}</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{t('landing_db_item2_name')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('landing_db_item2_portion')}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{t('landing_db_item2_carbs')}</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{t('landing_db_item3_name')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('landing_db_item3_portion')}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{t('landing_db_item3_carbs')}</span>
                </div>

                <div className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{t('landing_db_item4_name')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('landing_db_item4_portion')}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{t('landing_db_item4_carbs')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>{t('landing_cta_security_badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('landing_cta_main_title')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {t('landing_cta_main_desc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartSignUp}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {t('landing_cta_btn_signup')}
            </button>

            <button
              type="button"
              id="btn-landing-footer-install"
              onClick={handleInstall}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>{t('landing_install_hero_cta')}</span>
            </button>

            <button
              type="button"
              onClick={onEnterAppDirectly}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('landing_cta_btn_guest')}
            </button>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-300 font-medium">
            <span>{t('landing_footer_brand')}</span>
            <span className="text-slate-500 text-[11px]">{t('landing_footer_version')}</span>
          </div>
          <div className="border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500 text-start">
            <p>
              <strong>{t('landing_footer_disclaimer_title')} </strong>
              {t('landing_footer_disclaimer_text')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
