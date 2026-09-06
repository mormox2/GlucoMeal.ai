import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Database,
  Sparkles,
  History,
  Syringe,
  FileText,
  Wifi,
  Cloud,
  Stethoscope,
  Heart,
  User,
  Home,
  ChevronDown,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { UserProfileDT1 } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  currentTab: 'app' | 'history' | 'database' | 'benchmark' | 'doctor';
  setCurrentTab: (tab: 'app' | 'history' | 'database' | 'benchmark' | 'doctor') => void;
  activeMealCount: number;
  onOpenProfileModal: () => void;
  onOpenMedicalReport?: () => void;
  onOpenCGM?: () => void;
  onOpenCloudSync?: () => void;
  onOpenLanding?: () => void;
  onOpenAuth?: () => void;
  onOpenInstallModal?: () => void;
  userProfile?: UserProfileDT1;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeMealCount,
  onOpenProfileModal,
  onOpenMedicalReport,
  onOpenCGM,
  onOpenCloudSync,
  onOpenLanding,
  onOpenAuth,
  onOpenInstallModal,
  userProfile,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isChildProfile = userProfile?.accountType === 'parent' || !!userProfile?.childProfile;
  const childName = userProfile?.childProfile?.childName || (language === 'ar' ? 'الطفل السكري' : 'Enfant DT1');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-1.5 sm:gap-3">
          {/* 1. Brand Logo & Child Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div
              id="brand-logo"
              onClick={() => setCurrentTab('app')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0 border border-emerald-900/10">
                <img src="/icon.svg" alt="GlucoMeal.AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-900">
                    GlucoMeal<span className="text-emerald-600">.AI</span>
                  </span>
                  <span className="hidden min-[340px]:inline-block px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    {t('clinical_badge')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  {t('app_subtitle')}
                </p>
              </div>
            </div>

            {/* Child Profile Badge (Visible on lg+ screens) */}
            {isChildProfile && (
              <div
                onClick={onOpenProfileModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors shrink-0"
                title={t('parent_badge')}
              >
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
                <span className="max-w-[90px] xl:max-w-[120px] truncate">{childName}</span>
                <span className="text-[10px] font-mono bg-rose-200/80 px-1.5 py-0.2 rounded text-rose-950 shrink-0">
                  {userProfile?.roundingStep === 0.5 ? '0.5 U' : (language === 'ar' ? 'مضخة' : 'Pompe')}
                </span>
              </div>
            )}
          </div>

          {/* 2. Main Navigation Tabs (Visible on md+ screens: >= 768px) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              id="nav-tab-app"
              onClick={() => setCurrentTab('app')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'app'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t('nav_app')}</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t('nav_history')}</span>
              {activeMealCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {activeMealCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-database"
              onClick={() => setCurrentTab('database')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'database'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t('nav_database')}</span>
            </button>

            <button
              id="nav-tab-benchmark"
              onClick={() => setCurrentTab('benchmark')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'benchmark'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{t('nav_benchmark')}</span>
            </button>

            <button
              id="nav-tab-doctor"
              onClick={() => setCurrentTab('doctor')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'doctor'
                  ? 'bg-teal-800 text-white shadow-xs font-bold'
                  : 'text-teal-900 hover:bg-teal-100/70'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav_doctor')}</span>
            </button>
          </nav>

          {/* 3. Right-Side Compact Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            {/* Quick Medical Report (PDF) */}
            {onOpenMedicalReport && (
              <button
                id="btn-header-report"
                type="button"
                onClick={onOpenMedicalReport}
                className="flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                title="Consulter et imprimer le rapport médical PDF pour diabétologue"
                aria-label="Rapport médical PDF"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="hidden md:inline">{t('report_btn')}</span>
                <span className="hidden sm:inline md:hidden">PDF</span>
              </button>
            )}

            {/* Services & Tools Dropdown Menu */}
            {(onOpenMedicalReport || onOpenCloudSync || onOpenCGM || onOpenLanding || onOpenAuth || onOpenInstallModal) && (
              <div className="relative" ref={servicesMenuRef}>
                <button
                  id="btn-header-services"
                  type="button"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className={`flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    isServicesOpen
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Services cliniques, synchronisation et outils"
                  aria-label="Menu des services et outils"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="hidden sm:inline">{t('services_menu_btn')}</span>
                  <ChevronDown
                    className={`hidden sm:inline w-3 h-3 text-slate-500 transition-transform shrink-0 ${
                      isServicesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isServicesOpen && (
                  <>
                    {/* Mobile Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40 sm:hidden bg-slate-900/20 backdrop-blur-2xs"
                      onClick={() => setIsServicesOpen(false)}
                    />

                    <div
                      className={`fixed left-3 right-3 top-16 sm:left-auto sm:top-full ${
                        isRtl ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
                      } sm:mt-2 w-auto sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto`}
                    >
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {t('services_menu_title')}
                      </div>

                      {/* Profil DT1 inside menu */}
                      <button
                        id="menu-item-profile"
                        onClick={() => {
                          onOpenProfileModal();
                          setIsServicesOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                          <Syringe className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900">{t('profile_btn_desktop')}</div>
                          <div className="text-[10px] text-slate-500">
                            {language === 'ar' ? 'معاملات الكربوهيدرات والهدف' : 'Ratios I:C & Cible glycémique'}
                          </div>
                        </div>
                      </button>

                      {onOpenMedicalReport && (
                        <button
                          id="menu-item-report"
                          onClick={() => {
                            onOpenMedicalReport();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{t('report_btn')}</div>
                            <div className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'تقرير طبي مطبوع للاستشارة' : 'Bilan imprimable pour diabétologue'}
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenCloudSync && (
                        <button
                          id="menu-item-cloud-sync"
                          onClick={() => {
                            onOpenCloudSync();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-sky-50 hover:text-sky-900 text-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                            <Cloud className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{t('cloud_btn')}</div>
                            <div className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'مزامنة سحابية متعددة الأجهزة' : 'Partage multi-appareils & code GLUCO'}
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenCGM && (
                        <button
                          id="menu-item-cgm"
                          onClick={() => {
                            onOpenCGM();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-blue-50 hover:text-blue-900 text-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Wifi className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{t('cgm_btn')}</div>
                            <div className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'مستشعر السكر المستمر (Dexcom / LinX)' : 'Liaison continue LinX, Dexcom, Syai'}
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenAuth && (
                        <button
                          id="menu-item-auth"
                          onClick={() => {
                            onOpenAuth();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">
                              {userProfile?.parentEmail ? t('account_btn') : t('login_btn')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {userProfile?.parentEmail || (language === 'ar' ? 'تسجيل الدخول وإدارة الحساب' : 'Connexion et profil parent / patient')}
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenInstallModal && (
                        <button
                          id="menu-item-install"
                          onClick={() => {
                            onOpenInstallModal();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{t('install_btn')}</div>
                            <div className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'تثبيت التطبيق للعمل دون إنترنت' : 'Application PWA autonome & hors-ligne'}
                            </div>
                          </div>
                        </button>
                      )}

                      {onOpenLanding && (
                        <button
                          id="menu-item-landing"
                          onClick={() => {
                            onOpenLanding();
                            setIsServicesOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left rtl:text-right hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Home className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{t('presentation_btn')}</div>
                            <div className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'دليل وشرح المنظومة' : 'Présentation et guide clinique DT1'}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Auth / Account Button */}
            {onOpenAuth && (
              <button
                id="btn-header-auth"
                type="button"
                onClick={onOpenAuth}
                className="hidden min-[360px]:flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                title="Gérer mon compte Parent / Patient et profil enfant"
                aria-label="Mon compte"
              >
                <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="hidden xl:inline">
                  {userProfile?.parentEmail ? t('account_btn') : t('login_btn')}
                </span>
              </button>
            )}

            {/* PWA Install Button */}
            {onOpenInstallModal && (
              <button
                id="btn-header-install-pwa"
                type="button"
                onClick={onOpenInstallModal}
                className="hidden min-[380px]:flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Installer GlucoMeal sur votre téléphone ou ordinateur (PWA)"
                aria-label="Installer l'application PWA"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">{t('install_btn')}</span>
              </button>
            )}

            {/* PRIMARY CLINICAL CTA: Profil DT1 (Ratios & Cible) */}
            <button
              id="btn-open-profile"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Configurer mes ratios d'insuline (I:C) et cible glycémique"
              aria-label="Profil DT1 Ratios et Cible"
            >
              <Syringe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden md:inline">{t('profile_btn_desktop')}</span>
              <span className="hidden min-[480px]:inline md:hidden">{t('profile_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
