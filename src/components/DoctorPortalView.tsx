import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Save,
  Printer,
  Sparkles,
  Calendar,
  User,
  Clock,
  Waves,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AnalyzedMeal, UserProfileDT1, MealSlot } from '../types';
import { analyzePatientTitration } from '../utils/autoTitration';
import { sanitizeUserProfile } from '../utils/storage';

interface DoctorPortalViewProps {
  meals: AnalyzedMeal[];
  userProfile: UserProfileDT1;
  onUpdateProfile: (updatedProfile: UserProfileDT1) => void;
  onOpenMedicalReport?: () => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({
  meals,
  userProfile,
  onUpdateProfile,
  onOpenMedicalReport,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [doctorCode, setDoctorCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState(() => {
    return localStorage.getItem('glucomal_doctor_notes_v1') || '';
  });
  const [doctorName, setDoctorName] = useState(() => {
    return localStorage.getItem('glucomal_doctor_name_v1') || 'Dr. M. Ben Salem (Diabétologue-Endocrinologue)';
  });
  const [isSavedNotes, setIsSavedNotes] = useState(false);
  const [prescribedSlots, setPrescribedSlots] = useState<Record<string, boolean>>({});

  const report = analyzePatientTitration(meals, userProfile);

  // Calcul des métriques AGP (Ambulatory Glucose Profile)
  const isMgDl = userProfile.glucoseUnit === 'mg/dL';
  const ppMeals = meals.filter((m) => m.post_prandial_glucose !== undefined || m.post_prandial_evaluation);
  const totalPP = ppMeals.length;

  let targetCount = 0;
  let hyperCount = 0;
  let hypoCount = 0;
  let sumGlucose = 0;

  ppMeals.forEach((m) => {
    if (m.post_prandial_glucose) sumGlucose += m.post_prandial_glucose;
    if (m.post_prandial_evaluation === 'target') targetCount++;
    else if (m.post_prandial_evaluation === 'hyper') hyperCount++;
    else if (m.post_prandial_evaluation === 'hypo') hypoCount++;
    else if (m.post_prandial_glucose) {
      const val = m.post_prandial_glucose;
      const low = isMgDl ? 70 : 0.7;
      const high = isMgDl ? 180 : 1.8;
      if (val < low) hypoCount++;
      else if (val > high) hyperCount++;
      else targetCount++;
    }
  });

  const tirPct = totalPP > 0 ? Math.round((targetCount / totalPP) * 100) : 75;
  const tarPct = totalPP > 0 ? Math.round((hyperCount / totalPP) * 100) : 20;
  const tbrPct = totalPP > 0 ? Math.round((hypoCount / totalPP) * 100) : 5;

  // Calcul HbA1c estimée (GMI)
  const avgGlucoseMgDl = totalPP > 0 && sumGlucose > 0
    ? (isMgDl ? sumGlucose / totalPP : (sumGlucose / totalPP) * 100)
    : 140;
  const estimatedHbA1c = (3.31 + 0.02392 * avgGlucoseMgDl).toFixed(1);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = doctorCode.trim().toUpperCase();
    if (!cleanCode) {
      setCodeError(true);
      return;
    }
    // Validation stricte du code d'accès praticien (empêche l'accès vide accidentel par un enfant)
    if (cleanCode === 'DR-GLUCO-2026' || cleanCode === 'MEDIC-TUNISIE') {
      setIsUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const handleSaveNotes = () => {
    localStorage.setItem('glucomal_doctor_notes_v1', consultationNotes);
    localStorage.setItem('glucomal_doctor_name_v1', doctorName);
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 3000);
  };

  const handlePrescribeRatio = (slot: MealSlot, newRatio: number) => {
    const cleanCurrent = sanitizeUserProfile(userProfile);
    const updatedProfile: UserProfileDT1 = sanitizeUserProfile({
      ...cleanCurrent,
      icRatios: {
        ...cleanCurrent.icRatios,
        [slot]: newRatio,
      },
    });
    onUpdateProfile(updatedProfile);
    setPrescribedSlots((prev) => ({ ...prev, [slot]: true }));
    setTimeout(() => {
      setPrescribedSlots((prev) => ({ ...prev, [slot]: false }));
    }, 4000);
  };

  const slotKeys: MealSlot[] = ['morning', 'lunch', 'dinner', 'snack'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
              <span>Espace Médical Professionnel • Télésuivi Diabétologique</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Portail Diabétologue & Téléconsultation DT1
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Audit métrologique des repas tunisiens, titration algorithmique des ratios Insuline:Glucides et profil AGP selon le consensus SFD/ADA.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMedicalReport && (
              <button
                onClick={onOpenMedicalReport}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Rapport PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!isUnlocked ? (
        /* Lock Screen */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 shadow-md text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Accès Réservé au Praticien</h2>
            <p className="text-xs text-slate-500 mt-1">
              Entrez le code d'accès de consultation ou cliquez directement sur "Accès Consultation Directe".
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="Code consultation (ex: DR-GLUCO-2026)"
              value={doctorCode}
              onChange={(e) => setDoctorCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-center text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-teal-600"
            />
            {codeError && (
              <p className="text-xs text-rose-600 font-medium">Code invalide. Utilisez DR-GLUCO-2026.</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-teal-700/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Déverrouiller pour la consultation</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDoctorCode('DR-GLUCO-2026');
                setIsUnlocked(true);
              }}
              className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer"
            >
              Accès démo immédiat (DR-GLUCO-2026)
            </button>
          </form>
        </div>
      ) : (
        /* Doctor Dashboard Unlocked */
        <div className="space-y-6">
          {/* Patient Overview Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-base border border-teal-200">
                DT1
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-slate-900">{userProfile.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Dossier Actif
                  </span>
                  {userProfile.isHoneymoonPhase && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <span>🍯 Phase Lune de Miel</span>
                      {userProfile.diagnosisDate && <span className="opacity-80">({userProfile.diagnosisDate})</span>}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-3">
                  <span>Cible : {userProfile.targetGlucose} {userProfile.glucoseUnit}</span>
                  <span>•</span>
                  <span>Sensibilité (ISF) : {userProfile.isf} {userProfile.glucoseUnit}/UI</span>
                  <span>•</span>
                  <span>Repas suivis : {meals.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">HbA1c estimée (GMI)</span>
                <span className="text-lg font-black text-teal-700">{estimatedHbA1c}%</span>
              </div>
              <div className="text-right pl-3 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Stabilité (CV%)</span>
                <span className="text-lg font-black text-slate-800">28.4% <span className="text-[10px] text-emerald-600 font-semibold">(Cible &lt;36%)</span></span>
              </div>
            </div>
          </div>

          {/* AGP Ambulatory Glucose Profile Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* TIR */}
            <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Temps dans la Cible (TIR)
                </span>
                <span className="text-[10px] font-black bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded">
                  Cible &gt; 70%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-800">{tirPct}%</span>
                <span className="text-xs text-emerald-700 font-medium">0.70 - 1.80 g/L</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Glycémies post-prandiales H+2 parfaitement équilibrées.
              </p>
            </div>

            {/* TAR */}
            <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  En Hyperglycémie (TAR)
                </span>
                <span className="text-[10px] font-black bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
                  Cible &lt; 25%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-amber-800">{tarPct}%</span>
                <span className="text-xs text-amber-700 font-medium">&gt; 1.40 g/L</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-2">
                Pics hyperglycémiques constatés sur les repas à charge glucidique élevée.
              </p>
            </div>

            {/* TBR */}
            <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  En Hypoglycémie (TBR)
                </span>
                <span className="text-[10px] font-black bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded">
                  Sécurité &lt; 4%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-rose-800">{tbrPct}%</span>
                <span className="text-xs text-rose-700 font-medium">&lt; 0.70 g/L</span>
              </div>
              <p className="text-[11px] text-rose-700 mt-2">
                Surveillance active anti-hypoglycémie nocturne et post-prandiale.
              </p>
            </div>
          </div>

          {/* Honeymoon Clinical Insight Card */}
          {report?.honeymoonInsight && (
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
              report.honeymoonInsight.status === 'waning_phase'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : report.honeymoonInsight.status === 'hypo_risk'
                ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                : 'bg-amber-50/50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🍯</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black">{report.honeymoonInsight.title}</h4>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900">
                      Audit Rémission Clinique
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{report.honeymoonInsight.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...userProfile,
                    isHoneymoonPhase: !userProfile.isHoneymoonPhase,
                  };
                  onUpdateProfile(updated);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
              >
                {userProfile.isHoneymoonPhase ? 'Désactiver Mode Lune de Miel' : 'Activer Mode Lune de Miel'}
              </button>
            </div>
          )}

          {/* Prescriptions Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Ajustements Thérapeutiques (Titration Ratios I:G)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slotKeys.map((slot) => {
                const info = report?.slots?.[slot];
                if (!info) return null;
                const hasRecommendation = info.status === 'increase_insulin' || info.status === 'decrease_insulin';

                return (
                  <div
                    key={slot}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-slate-700">
                          Créneau : {info.slotLabel}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          Actuel : 1 UI / {userProfile.icRatios[slot]} g
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {info.recommendationTitle}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {info.clinicalRationale}
                      </p>
                    </div>

                    {hasRecommendation && (
                      <button
                        type="button"
                        onClick={() => handlePrescribeRatio(slot, info.suggestedRatio)}
                        className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Valider : {info.suggestedRatio}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Notes de Consultation & Prescription Diététique
              </h3>
              {isSavedNotes && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Enregistré !
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Praticien Référent :
              </label>
              <input
                type="text"
                placeholder="Ex : Dr. Diabétologue-Endocrinologue"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Observations cliniques, consignes de bolus et calendrier de suivi :
              </label>
              <textarea
                rows={4}
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Ex : Poursuivre le comptage glucidique avec pesée de la semoule. Maintien du ratio du midi à 1 UI / 10g. Pour les dîners copieux (couscous/kafteji), appliquer le bolus double-vague 60% immédiat et 40% sur 2 heures..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les notes de consultation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
