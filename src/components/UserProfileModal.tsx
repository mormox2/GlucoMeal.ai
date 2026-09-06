import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Clock, Activity, Target, Save, X, RotateCcw, Sparkles, CheckCircle2, Moon, AlertTriangle, LogOut, Cloud } from 'lucide-react';
import { UserProfileDT1 } from '../types';
import { DEFAULT_USER_PROFILE, sanitizeUserProfile } from '../utils/storage';
import { auth, logoutUser } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfileDT1;
  currentProfile?: UserProfileDT1;
  onSave: (updatedProfile: UserProfileDT1) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile: propProfile,
  currentProfile,
  onSave,
}) => {
  const profile = propProfile || currentProfile || DEFAULT_USER_PROFILE;
  const [formData, setFormData] = useState<UserProfileDT1>(() => sanitizeUserProfile(profile));
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(
    () => auth.currentUser?.email || profile?.parentEmail || null
  );

  useEffect(() => {
    const active = propProfile || currentProfile;
    if (active) {
      setFormData(sanitizeUserProfile(active));
      setCurrentUserEmail(auth.currentUser?.email || active?.parentEmail || null);
    }
  }, [propProfile, currentProfile, isOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const active = propProfile || currentProfile;
      setCurrentUserEmail(user?.email || active?.parentEmail || null);
    });
    return () => unsubscribe();
  }, [propProfile, currentProfile]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUserEmail(null);
      const cleared = { ...formData, parentEmail: undefined };
      setFormData(cleared);
      onSave(cleared);
      onClose();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  if (!isOpen) return null;

  const handleUnitChange = (unit: 'g/L' | 'mg/dL') => {
    if (unit === formData.glucoseUnit) return;
    if (unit === 'mg/dL') {
      setFormData({
        ...formData,
        glucoseUnit: 'mg/dL',
        targetGlucose: Math.round(formData.targetGlucose * 100),
        isf: Math.round(formData.isf * 100),
      });
    } else {
      setFormData({
        ...formData,
        glucoseUnit: 'g/L',
        targetGlucose: Number((formData.targetGlucose / 100).toFixed(2)),
        isf: Number((formData.isf / 100).toFixed(2)),
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProfile = sanitizeUserProfile(formData);
    onSave(cleanProfile);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_USER_PROFILE });
  };

  // Calcul démonstratif pour 60g de glucides à midi avec glycémie légèrement élevée
  const demoCarbs = 60;
  const demoCurrentGlucose =
    formData.glucoseUnit === 'g/L' ? formData.targetGlucose + 0.4 : formData.targetGlucose + 40;
  const demoLunchRatio = formData?.icRatios?.lunch || 10;
  const demoMealBolus = demoCarbs / demoLunchRatio;
  const demoCorrection =
    formData.isf > 0 ? (demoCurrentGlucose - formData.targetGlucose) / formData.isf : 0;
  const demoTotalRaw = demoMealBolus + demoCorrection;
  const demoTotal =
    Math.round(demoTotalRaw / (formData.roundingStep || 0.5)) * (formData.roundingStep || 0.5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-6 overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[11px] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Insulinothérapie Fonctionnelle (ITF)
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Profil Thérapeutique Diabète Type 1
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-md">
              Ratios glucides/insuline selon le moment de la journée, sensibilité (ISF) et bolus de correction.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* PARENT / CHILD PROFILE CARD */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👨‍👩‍👧</span>
                <div>
                  <span className="font-extrabold text-sm text-rose-950 block">
                    Mode Utilisateur : {formData.accountType === 'parent' ? "Parent d'un enfant DT1" : 'Patient Autonome'}
                  </span>
                  <p className="text-[11px] text-rose-900/80">
                    {formData.accountType === 'parent'
                      ? "Vous gérez les repas et les doses d'insuline pour votre enfant"
                      : "Vous calculez vos propres repas et doses d'insuline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      accountType: formData.accountType === 'parent' ? 'patient' : 'parent',
                      roundingStep: formData.accountType === 'parent' ? 1.0 : 0.5,
                      childProfile:
                        formData.childProfile || {
                          childName: 'Sarah',
                          age: 8,
                          insulinDeliveryType: 'pen_half_unit',
                          cgmSharingActive: true,
                        },
                    })
                  }
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  {formData.accountType === 'parent' ? 'Basculer en Patient Adulte' : "Activer Profil Enfant"}
                </button>
              </div>
            </div>

            {formData.accountType === 'parent' && (
              <div className="pt-2 border-t border-rose-200/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                    Prénom de l'enfant
                  </label>
                  <input
                    type="text"
                    value={formData.childProfile?.childName || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        childProfile: {
                          ...(formData.childProfile || {
                            age: 8,
                            insulinDeliveryType: 'pen_half_unit',
                            cgmSharingActive: true,
                          }),
                          childName: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Sarah"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 font-bold text-rose-950 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                    Âge de l'enfant
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="18"
                    value={formData.childProfile?.age || 8}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        childProfile: {
                          ...(formData.childProfile || {
                            childName: 'Enfant',
                            insulinDeliveryType: 'pen_half_unit',
                            cgmSharingActive: true,
                          }),
                          age: Number(e.target.value) || 8,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 font-bold text-rose-950 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-900 block mb-1">
                    Injection Enfant
                  </label>
                  <select
                    value={formData.childProfile?.insulinDeliveryType || 'pen_half_unit'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFormData({
                        ...formData,
                        roundingStep: val === 'pen_half_unit' ? 0.5 : val === 'pump' ? 0.1 : 1.0,
                        childProfile: {
                          ...(formData.childProfile || {
                            childName: 'Enfant',
                            age: 8,
                            cgmSharingActive: true,
                          }),
                          insulinDeliveryType: val,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 font-bold text-rose-950 text-xs outline-none"
                  >
                    <option value="pen_half_unit">Stylo 0.5 U (NovoPen Echo)</option>
                    <option value="pump">Pompe à insuline pédiatrique</option>
                    <option value="standard_pen">Stylo standard 1.0 U</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Unit selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Unité de mesure glycémique</span>
              <p className="text-[11px] text-slate-500">
                Format d'affichage de votre lecteur ou capteur de glycémie
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleUnitChange('g/L')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  formData.glucoseUnit === 'g/L'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                g/L (Tunisie / France)
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange('mg/dL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  formData.glucoseUnit === 'mg/dL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                mg/dL (USA / Int.)
              </button>
            </div>
          </div>

          {/* Section Période de Lune de Miel (Rémission Clinique Partielle DT1) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/80 border border-amber-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍯</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-amber-950 block">
                      Phase de Lune de Miel (Nouveau Patient DT1)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Rémission partielle
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80">
                    Besoins réduits en insuline grâce au reliquat de sécrétion pancréatique post-diagnostic
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.isHoneymoonPhase}
                  onChange={(e) => setFormData({ ...formData, isHoneymoonPhase: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {formData.isHoneymoonPhase && (
              <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-amber-900 block mb-1">
                      Mois & Année de découverte du DT1
                    </label>
                    <input
                      type="month"
                      value={formData.diagnosisDate || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-200 font-bold text-amber-950 text-xs outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          icRatios: {
                            ...formData.icRatios,
                            morning: 15,
                            lunch: 18,
                            dinner: 20,
                            snack: 18,
                            ...(formData.ramadanMode ? { iftar: 15, sahriya: 16, shor: 20 } : {}),
                          },
                          isf: formData.glucoseUnit === 'g/L' ? 0.6 : 60,
                        });
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Appliquer ratios prudents Lune de Miel (1 UI / 15-20g)</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-[11px] text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Consignes Thérapeutiques Cliniques (Consensus ISPAD / SFD) :</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900/90 leading-relaxed text-[10.5px]">
                    <li>
                      <strong>Vigilance Hypoglycémie :</strong> Vos besoins en insuline bolus sont allégés car vos cellules bêta résiduelles couvrent une part des glucides.
                    </li>
                    <li>
                      <strong>Ne jamais stopper la basale :</strong> Même si vos besoins sont très faibles, conservez une insuline basale (lente) minimale selon la prescription de votre médecin pour préserver la fonction bêta et prévenir l'acidocétose.
                    </li>
                    <li>
                      <strong>Fin de phase progressive :</strong> La lune de miel dure généralement plusieurs mois. GlucoMeal détectera toute hausse des glycémies post-prandiales pour vous alerter sur le déclin de la rémission.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Ratios Glucides / Insuline (I:C) par moment de la journée */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                1. Ratios Glucides / Insuline (Ratio I:C)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Nombre de grammes de glucides couverts par 1 unité d’insuline rapide (ex : 1 UI pour 10 g).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Matin */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  🌅 Matin
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">1 UI /</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={formData.icRatios.morning}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        icRatios: { ...formData.icRatios, morning: Number(e.target.value) || 8 },
                      })
                    }
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Petit-déjeuner</span>
              </div>

              {/* Midi */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  ☀️ Midi
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">1 UI /</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={formData.icRatios.lunch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        icRatios: { ...formData.icRatios, lunch: Number(e.target.value) || 10 },
                      })
                    }
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Déjeuner</span>
              </div>

              {/* Soir */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  🌙 Soir
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">1 UI /</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={formData.icRatios.dinner}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        icRatios: { ...formData.icRatios, dinner: Number(e.target.value) || 12 },
                      })
                    }
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Dîner</span>
              </div>

              {/* Collation */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  🍎 Collation
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">1 UI /</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    step="0.5"
                    value={formData.icRatios.snack}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        icRatios: { ...formData.icRatios, snack: Number(e.target.value) || 10 },
                      })
                    }
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">g</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Goûter</span>
              </div>
            </div>
          </div>

          {/* Section 1-bis: Mode Ramadan & Jeûne Intermittent */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-slate-50 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-700 text-amber-300 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">
                    Mode Ramadan & Jeûne Intermittent
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Adaptation des créneaux aux repas nocturnes (Iftar, Sahriya, Shor)
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.ramadanMode}
                  onChange={(e) => setFormData({ ...formData, ramadanMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.ramadanMode && (
              <div className="space-y-3 pt-2 border-t border-indigo-100 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Iftar */}
                  <div className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 block mb-1">
                      🌙 Iftar (Rupture)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">1 UI /</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        step="0.5"
                        value={formData.icRatios.iftar ?? 8}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            icRatios: {
                              ...formData.icRatios,
                              iftar: Number(e.target.value) || 8,
                            },
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-600">g</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Chorba, brik, dattes
                    </span>
                  </div>

                  {/* Sahriya */}
                  <div className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase text-purple-700 block mb-1">
                      🍵 Sahriya (Soirée)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">1 UI /</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        step="0.5"
                        value={formData.icRatios.sahriya ?? 9}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            icRatios: {
                              ...formData.icRatios,
                              sahriya: Number(e.target.value) || 9,
                            },
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-600">g</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Pâtisseries & thé
                    </span>
                  </div>

                  {/* Shor */}
                  <div className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase text-amber-700 block mb-1">
                      🌅 Shor (Aube)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">1 UI /</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        step="0.5"
                        value={formData.icRatios.shor ?? 12}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            icRatios: {
                              ...formData.icRatios,
                              shor: Number(e.target.value) || 12,
                            },
                          })
                        }
                        className="w-14 px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-900 text-sm text-center outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-600">g</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Sucres lents (Bsaissa)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Consigne médicale d'urgence (Consensus DAR / ADA) :</strong> Rompre impérativement le jeûne si votre glycémie descend en dessous de <strong>0.70 g/L (70 mg/dL)</strong> ou dépasse <strong>3.00 g/L</strong> à tout moment de la journée.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Sensibilité & Cible glycémique */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                2. Sensibilité à l'Insuline (ISF) & Cible Glycémique
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Facteur de sensibilité (ISF) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Facteur de Sensibilité (ISF)</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Correction
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  De combien 1 UI d’insuline fait baisser votre glycémie :
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={formData.glucoseUnit === 'g/L' ? '0.1' : '10'}
                    max={formData.glucoseUnit === 'g/L' ? '1.5' : '150'}
                    step={formData.glucoseUnit === 'g/L' ? '0.05' : '5'}
                    value={formData.isf}
                    onChange={(e) =>
                      setFormData({ ...formData, isf: Number(e.target.value) || 0.4 })
                    }
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 font-black text-slate-900 text-base text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-600">
                    {formData.glucoseUnit} par unité d’insuline
                  </span>
                </div>
              </div>

              {/* Cible glycémique */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Cible Glycémique Visée</span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                    Objectif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Votre glycémie idéale avant le repas (pré-prandiale) :
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={formData.glucoseUnit === 'g/L' ? '0.7' : '70'}
                    max={formData.glucoseUnit === 'g/L' ? '1.8' : '180'}
                    step={formData.glucoseUnit === 'g/L' ? '0.05' : '5'}
                    value={formData.targetGlucose}
                    onChange={(e) =>
                      setFormData({ ...formData, targetGlucose: Number(e.target.value) || 1.0 })
                    }
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 font-black text-slate-900 text-base text-center outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-600">{formData.glucoseUnit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pas d'arrondi */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Incrément de dose (Stylo / Pompe)
              </span>
              <p className="text-[11px] text-slate-500">
                Arrondi pratique pour l'injection
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { val: 0.5, label: '0.5 UI (Demi-unité)' },
                { val: 1.0, label: '1.0 UI (Stylo adulte)' },
                { val: 0.1, label: '0.1 UI (Pompe)' },
              ].map((step) => (
                <button
                  key={step.val}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, roundingStep: step.val as 0.5 | 1 | 0.1 })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formData.roundingStep === step.val
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          {/* Démonstrateur pédagogique en direct */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-900 block text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Exemple de calcul personnalisé en direct (Repas du midi) :
            </span>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Pour un repas de <strong>60 g de glucides</strong> avec une glycémie pré-prandiale de{' '}
              <strong>
                {demoCurrentGlucose.toFixed(2)} {formData.glucoseUnit}
              </strong>{' '}
              (cible : {formData.targetGlucose} {formData.glucoseUnit}) :
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-bold">
              <div className="bg-white/90 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 block font-medium">Bolus repas</span>
                <span className="text-emerald-800 text-sm">{demoMealBolus.toFixed(1)} UI</span>
                <span className="text-[9px] text-slate-400 block">60g ÷ {formData?.icRatios?.lunch ?? 10}</span>
              </div>
              <div className="bg-white/90 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 block font-medium">Correction</span>
                <span className="text-blue-800 text-sm">+{demoCorrection.toFixed(1)} UI</span>
                <span className="text-[9px] text-slate-400 block">Δ glycémie ÷ ISF</span>
              </div>
              <div className="bg-emerald-600 p-2 rounded-xl text-white">
                <span className="text-[10px] text-emerald-100 block font-medium">Bolus total</span>
                <span className="text-sm font-black">{demoTotal.toFixed(1)} UI</span>
                <span className="text-[9px] text-emerald-200 block">arrondi {formData.roundingStep} UI</span>
              </div>
            </div>
          </div>

          {/* Section 4: Statut du compte Firebase & Déconnexion */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {currentUserEmail ? 'Compte Cloud Firebase Connecté' : 'Mode Local / Anonyme Sécurisé'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate max-w-[220px] sm:max-w-xs">
                  {currentUserEmail ? currentUserEmail : 'Données synchronisées sur Firestore & cache IndexedDB'}
                </span>
              </div>
            </div>

            {currentUserEmail ? (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Trust Actif</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Valeurs par défaut</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                id="btn-save-dt1-profile"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                {savedFeedback ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Profil enregistré !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer mon profil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
