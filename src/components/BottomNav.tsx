import React, { useState } from 'react';
import {
  Utensils,
  History,
  Stethoscope,
  Sliders,
  Syringe,
  Database,
  Wifi,
  Cloud,
  FileText,
  Sparkles,
  BookOpen,
  X,
  Download,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface BottomNavProps {
  currentTab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor';
  setCurrentTab: (tab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor') => void;
  activeMealCount: number;
  onOpenProfileModal: () => void;
  onOpenMedicalReport?: () => void;
  onOpenCGM?: () => void;
  onOpenCloudSync?: () => void;
  onOpenAutoTitration?: () => void;
  onOpenInstallModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  activeMealCount,
  onOpenProfileModal,
  onOpenMedicalReport,
  onOpenCGM,
  onOpenCloudSync,
  onOpenAutoTitration,
  onOpenInstallModal,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const isMedicalTab = currentTab === 'doctor';
  const isToolsActive = ['database', 'benchmark', 'specs'].includes(currentTab);

  return (
    <>
      {/* Tools / Profile Bottom Sheet Modal for Mobile */}
      {isToolsOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsToolsOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {language === 'ar' ? 'الملف الشخصي والأدوات' : 'Profil & Outils DT1'}
                </h3>
              </div>
              <button
                onClick={() => setIsToolsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selector for Mobile */}
            <LanguageSwitcher variant="mobile" />

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  onOpenProfileModal();
                }}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                  <Syringe className="w-4 h-4" />
                  <span>{t('profile_btn')}</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'المعاملات والهدف' : 'Ratios I:C & Cible'}
                </span>
              </button>

              {onOpenCGM && (
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenCGM();
                  }}
                  className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-xs">
                    <Wifi className="w-4 h-4" />
                    <span>{t('cgm_btn')}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Dexcom / FreeStyle</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  setCurrentTab('database');
                }}
                className={`p-3 rounded-2xl border text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer ${
                  currentTab === 'database'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className={`flex items-center gap-1.5 font-extrabold text-xs ${
                  currentTab === 'database' ? 'text-white' : 'text-slate-800'
                }`}>
                  <Database className="w-4 h-4" />
                  <span>{t('nav_database')}</span>
                </div>
                <span className={`text-[11px] ${currentTab === 'database' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {language === 'ar' ? 'أكثر من 200 طبق' : '200+ plats certifiés'}
                </span>
              </button>

              {onOpenCloudSync && (
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenCloudSync();
                  }}
                  className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200/70 text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-sky-700 font-extrabold text-xs">
                    <Cloud className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مزامنة سحابية' : 'Cloud Sync'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ar' ? 'مزامنة الأجهزة' : 'Multi-appareils'}
                  </span>
                </button>
              )}

              {onOpenMedicalReport && (
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenMedicalReport();
                  }}
                  className="p-3 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/70 text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تقرير PDF' : 'Rapport PDF'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ar' ? 'ملخص للطبيب' : 'Synthèse médecin'}
                  </span>
                </button>
              )}

              {onOpenAutoTitration && (
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenAutoTitration();
                  }}
                  className="p-3 rounded-2xl bg-violet-50 hover:bg-violet-100/80 border border-violet-200/70 text-slate-900 flex flex-col gap-1.5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-violet-700 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'ar' ? 'المعايرة الذكية' : 'Auto-Titration'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ar' ? 'تعديل النسب' : 'Ajustement ratios'}
                  </span>
                </button>
              )}

              {onOpenInstallModal && (
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    onOpenInstallModal();
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col gap-1.5 shadow-md shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-white">
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>{language === 'ar' ? 'تثبيت التطبيق (PWA)' : 'Installer l\'application (PWA)'}</span>
                  </div>
                  <span className="text-[11px] text-emerald-100">
                    {language === 'ar' ? 'على الشاشة الرئيسية • يعمل دون إنترنت' : 'Sur écran d\'accueil • Hors-ligne'}
                  </span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  setCurrentTab('benchmark');
                }}
                className="hover:text-emerald-700 cursor-pointer"
              >
                {language === 'ar' ? 'مجموعة التحقق (100 طبق)' : 'Dataset 100'}
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setIsToolsOpen(false);
                  setCurrentTab('specs');
                }}
                className="hover:text-emerald-700 cursor-pointer"
              >
                {language === 'ar' ? 'المواصفات الفنية' : 'Specs Techniques'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar on Mobile */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-2px_15px_rgba(0,0,0,0.06)]"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          {/* 1. Repas / Scanner */}
          <button
            id="bottom-nav-meal"
            onClick={() => setCurrentTab('app')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              currentTab === 'app'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === 'app' ? 'bg-emerald-50' : ''}`}>
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
              {language === 'ar' ? 'الوجبة' : 'Repas'}
            </span>
          </button>

          {/* 2. Historique */}
          <button
            id="bottom-nav-history"
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl relative transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${currentTab === 'history' ? 'bg-emerald-50' : ''}`}>
              <History className="w-5 h-5" />
              {activeMealCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {activeMealCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">
              {language === 'ar' ? 'السجل' : 'Historique'}
            </span>
          </button>

          {/* 3. Suivi Médical (Diabéto) */}
          <button
            id="bottom-nav-doctor"
            onClick={() => setCurrentTab('doctor')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              isMedicalTab
                ? 'text-teal-800 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMedicalTab ? 'bg-teal-50' : ''}`}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
              {language === 'ar' ? 'طبي' : 'Médical'}
            </span>
          </button>

          {/* 4. Profil & Outils */}
          <button
            id="bottom-nav-tools"
            onClick={() => setIsToolsOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              isToolsActive || isToolsOpen
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isToolsActive || isToolsOpen ? 'bg-emerald-50' : ''}`}>
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">
              {language === 'ar' ? 'أدوات' : 'Outils'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
