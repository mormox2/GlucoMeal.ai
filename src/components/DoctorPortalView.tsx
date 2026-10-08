import React, { useState } from 'react';
import {
  Stethoscope,
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
import { classifyPostPrandial, getPostPrandialGlucose } from '../utils/postPrandial';
import { useLanguage } from '../i18n/LanguageContext';

// Portail de consultation en LECTURE SEULE : il ne modifie jamais le profil d'insuline.
// Il n'existe pas d'authentification praticien côté client ; un code partagé en dur dans
// l'application n'offrait aucune protection. Les ratios se modifient dans le profil DT1.
interface DoctorPortalViewProps {
  meals: AnalyzedMeal[];
  userProfile: UserProfileDT1;
  onOpenMedicalReport?: () => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({
  meals,
  userProfile,
  onOpenMedicalReport,
}) => {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

  const [consultationNotes, setConsultationNotes] = useState(() => {
    return localStorage.getItem('glucomal_doctor_notes_v1') || '';
  });
  const [doctorName, setDoctorName] = useState(() => {
    return (
      localStorage.getItem('glucomal_doctor_name_v1') ||
      (isAr ? 'د. م. بن سالم (طبيب أخصائي في السكري والغدد الصماء)' : 'Dr. M. Ben Salem (Diabétologue-Endocrinologue)')
    );
  });
  const [isSavedNotes, setIsSavedNotes] = useState(false);

  const report = analyzePatientTitration(meals, userProfile, language);

  // Indicateurs calculés sur les contrôles post-prandiaux ponctuels (glycémies normalisées dans l'unité
  // du profil). Ce ne sont pas des données CGM continues : TIR, GMI et CV ne sont donc pas calculés.
  // Sans mesure, aucune valeur n'est affichée (aucune statistique par défaut).
  const unit = userProfile.glucoseUnit;
  const isMgDl = unit === 'mg/dL';
  const ppStatuses = meals
    .map((m) => classifyPostPrandial(m, userProfile))
    .filter((status): status is NonNullable<typeof status> => status !== undefined);
  const totalPP = ppStatuses.length;
  const countOf = (status: string) => ppStatuses.filter((st) => st === status).length;
  const pctOf = (status: string) => (totalPP > 0 ? Math.round((countOf(status) / totalPP) * 100) : null);
  const tirPct = pctOf('target');
  const tarPct = pctOf('hyper');
  const tbrPct = pctOf('hypo');
  const formatPct = (pct: number | null) => (pct === null ? '—' : `${pct}%`);

  const ppValues = meals
    .map((m) => getPostPrandialGlucose(m, unit))
    .filter((v): v is number => v !== undefined);
  const avgPostPrandial =
    ppValues.length > 0
      ? isMgDl
        ? Math.round(ppValues.reduce((a, v) => a + v, 0) / ppValues.length)
        : Number((ppValues.reduce((a, v) => a + v, 0) / ppValues.length).toFixed(2))
      : null;
  const hypoLimit = isMgDl ? 70 : 0.7;
  const hyperLimit = isMgDl ? userProfile.targetGlucose + 40 : Number((userProfile.targetGlucose + 0.4).toFixed(2));

  const handleSaveNotes = () => {
    localStorage.setItem('glucomal_doctor_notes_v1', consultationNotes);
    localStorage.setItem('glucomal_doctor_name_v1', doctorName);
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 3000);
  };

  const slotKeys: MealSlot[] = ['morning', 'lunch', 'dinner', 'snack'];

  return (
    <div className={`max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-in fade-in ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-bold mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
              <span>
                {isAr
                  ? 'فضاء طبي للمحترفين • متابعة عن بُعد للسكري'
                  : 'Espace Médical Professionnel • Télésuivi Diabétologique'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isAr
                ? 'بوابة طبيب السكري والاستشارات عن بُعد DT1'
                : 'Portail Diabétologue & Téléconsultation DT1'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'تدقيق حسابي للوجبات التونسية، معايرة خوارزمية لمعاملات الإنسولين/الكربوهيدرات وملف AGP حسب توافق SFD/ADA.'
                : 'Audit métrologique des repas tunisiens, titration algorithmique des ratios Insuline:Glucides et profil AGP selon le consensus SFD/ADA.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMedicalReport && (
              <button
                onClick={onOpenMedicalReport}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة تقرير PDF' : 'Imprimer Rapport PDF'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
                  {isAr ? 'الملف الطبي نشط' : 'Dossier Actif'}
                </span>
                {userProfile.isHoneymoonPhase && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span>{isAr ? '🍯 مرحلة شهر العسل' : '🍯 Phase Lune de Miel'}</span>
                    {userProfile.diagnosisDate && <span className="opacity-80">({userProfile.diagnosisDate})</span>}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-3">
                <span>{isAr ? 'الهدف السكري :' : 'Cible :'} {userProfile.targetGlucose} {userProfile.glucoseUnit}</span>
                <span>•</span>
                <span>{isAr ? 'معامل الحساسية (ISF) :' : 'Sensibilité (ISF) :'} {userProfile.isf} {userProfile.glucoseUnit}/{isAr ? 'وحدة' : 'UI'}</span>
                <span>•</span>
                <span>{isAr ? 'الوجبات المتابعة :' : 'Repas suivis :'} {meals.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right rtl:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {isAr ? 'متوسط السكر بعد ساعتين' : 'Glycémie H+2 moyenne'}
              </span>
              <span className="text-lg font-black text-teal-700">
                {avgPostPrandial === null ? '—' : `${avgPostPrandial} ${unit}`}
              </span>
            </div>
            <div className="text-right rtl:text-left pl-3 rtl:pl-0 rtl:pr-3 border-l rtl:border-l-0 rtl:border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {isAr ? 'قياسات بعد ساعتين' : 'Contrôles H+2'}
              </span>
              <span className="text-lg font-black text-slate-800">{totalPP}</span>
            </div>
          </div>
        </div>

        {/* Contrôles post-prandiaux (H+2) : pas un profil AGP, faute de données CGM continues */}
        <p className="text-[11px] text-slate-500 -mb-2">
          {isAr
            ? 'مؤشرات محسوبة على قياسات متفرقة بعد الوجبات بساعتين، وليست على تسجيل CGM متواصل (لا يمكن حساب TIR وGMI).'
            : 'Indicateurs calculés sur les contrôles ponctuels à H+2, pas sur un enregistrement CGM continu (TIR et GMI non calculables).'}
          {totalPP === 0 && (isAr ? ' لا توجد قياسات بعد.' : ' Aucun contrôle enregistré pour le moment.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* TIR */}
          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                {isAr ? 'قياسات H+2 في الهدف' : 'Contrôles H+2 dans la cible'}
              </span>
              <span className="text-[10px] font-black bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded">
                {isAr ? 'الهدف > 70%' : 'Cible > 70%'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-800">{formatPct(tirPct)}</span>
              <span className="text-xs text-emerald-700 font-medium">{hypoLimit} - {hyperLimit} {unit}</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2">
              {isAr ? `${countOf('target')} من ${totalPP} قياس.` : `${countOf('target')} contrôle(s) sur ${totalPP}.`}
            </p>
          </div>

          {/* TAR */}
          <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                {isAr ? 'قياسات H+2 مرتفعة' : 'Contrôles H+2 au-dessus de la cible'}
              </span>
              <span className="text-[10px] font-black bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded">
                {isAr ? 'الهدف < 25%' : 'Cible < 25%'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-800">{formatPct(tarPct)}</span>
              <span className="text-xs text-amber-700 font-medium">&gt; {hyperLimit} {unit}</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-2">
              {isAr ? `${countOf('hyper')} من ${totalPP} قياس.` : `${countOf('hyper')} contrôle(s) sur ${totalPP}.`}
            </p>
          </div>

          {/* TBR */}
          <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                {isAr ? 'قياسات H+2 منخفضة' : 'Contrôles H+2 en hypoglycémie'}
              </span>
              <span className="text-[10px] font-black bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded">
                {isAr ? 'أمان سريري < 4%' : 'Sécurité < 4%'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-rose-800">{formatPct(tbrPct)}</span>
              <span className="text-xs text-rose-700 font-medium">&lt; {hypoLimit} {unit}</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-2">
              {isAr ? `${countOf('hypo')} من ${totalPP} قياس.` : `${countOf('hypo')} contrôle(s) sur ${totalPP}.`}
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
                    {isAr ? 'تدقيق الهدأة السريرية' : 'Audit Rémission Clinique'}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{report.honeymoonInsight.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions Section */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {isAr
              ? 'التعديلات العلاجية (معايرة معاملات الإنسولين والكربوهيدرات I:C)'
              : 'Ajustements Thérapeutiques (Titration Ratios I:G)'}
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isAr
              ? 'هذه البوابة للعرض فقط. أي تعديل للمعاملات يتم في الملف العلاجي من قبل المريض أو وليّه، بناءً على وصفة الطبيب.'
              : 'Ce portail est en lecture seule. Toute modification des ratios se fait dans le profil DT1, par le patient ou son parent, sur prescription du médecin.'}
          </p>
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
                        {isAr ? 'الفترة :' : 'Créneau :'} {info.slotLabel}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {isAr
                          ? `الحالي : 1 وحدة / ${userProfile.icRatios[slot]} غ`
                          : `Actuel : 1 UI / ${userProfile.icRatios[slot]} g`}
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
                    <p className="w-full py-2 px-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold text-center">
                      {isAr
                        ? `اقتراح للمناقشة : 1 وحدة / ${info.suggestedRatio} غ`
                        : `Piste à discuter : 1 UI / ${info.suggestedRatio} g`}
                    </p>
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
              {isAr ? 'ملاحظات الاستشارة والتوصيات الغذائية' : 'Notes de Consultation & Prescription Diététique'}
            </h3>
            {isSavedNotes && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isAr ? 'تم الحفظ بنجاح!' : 'Enregistré !'}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isAr ? 'الطبيب المعالج / المشرف :' : 'Praticien Référent :'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: د. محمد بن سالم (أخصائي السكري والغدد الصماء)' : 'Ex : Dr. Diabétologue-Endocrinologue'}
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isAr
                ? 'الملاحظات السريرية، تعليمات الجرعات وجدول المتابعة :'
                : 'Observations cliniques, consignes de bolus et calendrier de suivi :'}
            </label>
            <textarea
              rows={4}
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: مواصلة حساب الكربوهيدرات مع وزن الكسكسي. تثبيت معامل الغداء عند 1 وحدة / 10غ. في العشاء الدسم (كسكسي/كفتاجي) تطبيق الجرعة الثنائية الممتدة 60% فوري و40% على ساعتين...'
                  : 'Ex : Poursuivre le comptage glucidique avec pesée de la semoule. Maintien du ratio du midi à 1 UI / 10g. Pour les dîners copieux (couscous/kafteji), appliquer le bolus double-vague 60% immédiat et 40% sur 2 heures...'
              }
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
              <span>{isAr ? 'حفظ ملاحظات الاستشارة' : 'Enregistrer les notes de consultation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
