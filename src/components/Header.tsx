import React from 'react';
import { Camera, BookOpen, Database, Sparkles, History, ShieldAlert, Settings, Syringe, FileText, Wifi, Cloud, Stethoscope } from 'lucide-react';

interface HeaderProps {
  currentTab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor';
  setCurrentTab: (tab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor') => void;
  activeMealCount: number;
  onOpenProfileModal: () => void;
  onOpenMedicalReport?: () => void;
  onOpenCGM?: () => void;
  onOpenCloudSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeMealCount,
  onOpenProfileModal,
  onOpenMedicalReport,
  onOpenCGM,
  onOpenCloudSync,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Clinically Reassuring Identity */}
          <div
            id="brand-logo"
            onClick={() => setCurrentTab('app')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  GlucoMeal<span className="text-emerald-600">.AI</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  MVP V2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Comptage intelligent des glucides • Diabète Type 1
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-app"
              onClick={() => setCurrentTab('app')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'app'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Estimer un repas</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique & Habitudes</span>
              {activeMealCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeMealCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-database"
              onClick={() => setCurrentTab('database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'database'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Base tunisienne (200+)</span>
            </button>

            <button
              id="nav-tab-benchmark"
              onClick={() => setCurrentTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'benchmark'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Dataset 100 Repas</span>
            </button>

            <button
              id="nav-tab-specs"
              onClick={() => setCurrentTab('specs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'specs'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Specs Techniques</span>
            </button>

            <button
              id="nav-tab-doctor"
              onClick={() => setCurrentTab('doctor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'doctor'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-teal-900 hover:bg-teal-100/70'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Espace Diabéto</span>
            </button>
          </nav>

          {/* Right Actions: Medical Report + CGM + Cloud Sync + Profile DT1 Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenCloudSync && (
              <button
                onClick={onOpenCloudSync}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold border border-sky-200 cursor-pointer transition-colors"
                title="Synchronisation Cloud Multi-Appareils"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden lg:inline">Cloud Synchro</span>
              </button>
            )}

            {onOpenMedicalReport && (
              <button
                onClick={onOpenMedicalReport}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors"
                title="Consulter ou imprimer le rapport médical de consultation"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Rapport PDF</span>
              </button>
            )}

            {onOpenCGM && (
              <button
                onClick={onOpenCGM}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 cursor-pointer transition-colors"
                title="Synchroniser capteur continu de glycémie"
              >
                <Wifi className="w-3.5 h-3.5 text-blue-700" />
                <span>CGM</span>
              </button>
            )}

            <button
              id="btn-open-profile"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="Configurer mes ratios d'insuline (I:C) et cible glycémique"
            >
              <Syringe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Profil DT1 (Ratios)</span>
              <span className="sm:hidden">Profil DT1</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
