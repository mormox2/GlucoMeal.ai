import React, { useState, useRef, useEffect } from 'react';
import { Camera, BookOpen, Database, Sparkles, History, ShieldAlert, Settings, Syringe, FileText, Wifi, Cloud, Stethoscope, Heart, User, Home, MoreHorizontal, ChevronDown, Check } from 'lucide-react';
import { UserProfileDT1 } from '../types';

interface HeaderProps {
  currentTab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor';
  setCurrentTab: (tab: 'app' | 'history' | 'database' | 'benchmark' | 'specs' | 'doctor') => void;
  activeMealCount: number;
  onOpenProfileModal: () => void;
  onOpenMedicalReport?: () => void;
  onOpenCGM?: () => void;
  onOpenCloudSync?: () => void;
  onOpenLanding?: () => void;
  onOpenAuth?: () => void;
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
  userProfile,
}) => {
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
  const tabletMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabletMenuRef.current && !tabletMenuRef.current.contains(event.target as Node)) {
        setIsTabletMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isChildProfile = userProfile?.accountType === 'parent' || !!userProfile?.childProfile;
  const childName = userProfile?.childProfile?.childName || 'Enfant DT1';

  const isToolTabActive = ['database', 'benchmark', 'specs'].includes(currentTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Brand Logo & Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              id="brand-logo"
              onClick={() => setCurrentTab('app')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                    GlucoMeal<span className="text-emerald-600">.AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Clinique
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">
                  Glucides & Bolus • Diabète Type 1
                </p>
              </div>
            </div>

            {/* PARENT / CHILD BADGE (Adaptive for Tablet md+) */}
            {isChildProfile ? (
              <div
                onClick={onOpenProfileModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors shrink-0"
                title="Profil Enfant DT1 géré par un parent"
              >
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span className="max-w-[110px] sm:max-w-none truncate">{childName}</span>
                <span className="text-[10px] font-mono bg-rose-200/80 px-1.5 py-0.2 rounded text-rose-950">
                  {userProfile?.roundingStep === 0.5 ? '0.5 U' : 'Pompe'}
                </span>
              </div>
            ) : null}
          </div>

          {/* TABLET NAVIGATION (Visible on md to lg screens: 768px - 1279px) */}
          <nav className="hidden md:flex xl:hidden items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tablet-nav-tab-app"
              onClick={() => setCurrentTab('app')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'app'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Estimer</span>
            </button>

            <button
              id="tablet-nav-tab-history"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique</span>
              {activeMealCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeMealCount}
                </span>
              )}
            </button>

            <button
              id="tablet-nav-tab-doctor"
              onClick={() => setCurrentTab('doctor')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'doctor'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-teal-900 hover:bg-teal-100/70'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Diabéto</span>
            </button>

            {/* Tablet "Outils DT1" Dropdown Menu */}
            <div className="relative" ref={tabletMenuRef}>
              <button
                type="button"
                onClick={() => setIsTabletMenuOpen(!isTabletMenuOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isToolTabActive || isTabletMenuOpen
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Outils</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTabletMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTabletMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Bases & Références
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab('database');
                      setIsTabletMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentTab === 'database' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Base Tunisienne</div>
                      <div className="text-[10px] text-slate-400">200+ plats certifiés INNT</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('benchmark');
                      setIsTabletMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentTab === 'benchmark' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Dataset 100 Repas</div>
                      <div className="text-[10px] text-slate-400">Ground Truth métrologique</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('specs');
                      setIsTabletMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      currentTab === 'specs' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">Spécifications ITF</div>
                      <div className="text-[10px] text-slate-400">Formules et algorithmes</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    {onOpenMedicalReport && (
                      <button
                        onClick={() => {
                          onOpenMedicalReport();
                          setIsTabletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-slate-50 text-slate-700"
                      >
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Rapport PDF Consultation</span>
                      </button>
                    )}
                    {onOpenCGM && (
                      <button
                        onClick={() => {
                          onOpenCGM();
                          setIsTabletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-slate-50 text-slate-700"
                      >
                        <Wifi className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Capteur CGM (Dexcom / Libre)</span>
                      </button>
                    )}
                    {onOpenCloudSync && (
                      <button
                        onClick={() => {
                          onOpenCloudSync();
                          setIsTabletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-slate-50 text-slate-700"
                      >
                        <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>Synchronisation Cloud</span>
                      </button>
                    )}
                    {onOpenLanding && (
                      <button
                        onClick={() => {
                          onOpenLanding();
                          setIsTabletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-slate-50 text-slate-700"
                      >
                        <Home className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Présentation & Guide DT1</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* DESKTOP NAVIGATION TABS (Visible only on XL screens: >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-app"
              onClick={() => setCurrentTab('app')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'app'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estimer</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>Historique</span>
              {activeMealCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeMealCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-database"
              onClick={() => setCurrentTab('database')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'database'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Base Tunisienne</span>
            </button>

            <button
              id="nav-tab-benchmark"
              onClick={() => setCurrentTab('benchmark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'benchmark'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Dataset 100</span>
            </button>

            <button
              id="nav-tab-specs"
              onClick={() => setCurrentTab('specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'specs'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Specs ITF</span>
            </button>

            <button
              id="nav-tab-doctor"
              onClick={() => setCurrentTab('doctor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentTab === 'doctor'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-teal-900 hover:bg-teal-100/70'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Espace Diabéto</span>
            </button>
          </nav>

          {/* Right Actions: Responsive for Tablet & Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenMedicalReport && (
              <button
                onClick={onOpenMedicalReport}
                className="hidden xl:flex items-center gap-1.5 px-2.5 2xl:px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors whitespace-nowrap"
                title="Consulter ou imprimer le rapport médical de consultation"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Rapport PDF</span>
              </button>
            )}

            {onOpenCloudSync && (
              <button
                onClick={onOpenCloudSync}
                className="hidden 2xl:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold border border-sky-200 cursor-pointer transition-colors whitespace-nowrap"
                title="Synchronisation Cloud Multi-Appareils"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-700" />
                <span>Cloud</span>
              </button>
            )}

            {onOpenCGM && (
              <button
                onClick={onOpenCGM}
                className="hidden 2xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 cursor-pointer transition-colors whitespace-nowrap"
                title="Synchroniser capteur continu de glycémie"
              >
                <Wifi className="w-3.5 h-3.5 text-blue-700" />
                <span>CGM</span>
              </button>
            )}

            {onOpenLanding && (
              <button
                onClick={onOpenLanding}
                className="hidden 2xl:flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                title="Présentation et guide de GlucoMeal AI"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Présentation</span>
              </button>
            )}

            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Gérer mon compte Parent / Patient et profil enfant"
              >
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">
                  {userProfile?.parentEmail ? 'Mon Compte' : 'Connexion'}
                </span>
              </button>
            )}

            <button
              id="btn-open-profile"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Configurer mes ratios d'insuline (I:C) et cible glycémique"
            >
              <Syringe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Profil DT1 (Ratios)</span>
              <span className="md:hidden">Profil DT1</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
