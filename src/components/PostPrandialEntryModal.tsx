import React, { useState } from 'react';
import {
  Clock,
  Target,
  CheckCircle2,
  X,
  AlertTriangle,
  AlertCircle,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { evaluatePostPrandialResult, fetchCurrentCGMReading, loadCGMConfig } from '../utils/cgmService';
import { useLanguage } from '../i18n/LanguageContext';

interface PostPrandialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: AnalyzedMeal;
  userProfile: UserProfileDT1;
  onSavePostPrandial?: (mealId: string, glucose: number) => void;
  onSave?: (mealId: string, glucose: number) => void;
}

export const PostPrandialEntryModal: React.FC<PostPrandialEntryModalProps> = ({
  isOpen,
  onClose,
  meal,
  userProfile,
  onSavePostPrandial,
  onSave,
}) => {
  const { language, isRtl } = useLanguage();
  const [glucoseInput, setGlucoseInput] = useState<string>(
    meal.post_prandial_glucose !== undefined ? String(meal.post_prandial_glucose) : ''
  );
  const [isReadingCGM, setIsReadingCGM] = useState(false);
  const [cgmFeedback, setCgmFeedback] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
    hint?: string;
  } | null>(null);

  if (!isOpen) return null;

  const numVal = parseFloat(glucoseInput);
  const isValidNumber = !isNaN(numVal) && numVal > 0;
  const evaluation = isValidNumber
    ? evaluatePostPrandialResult(numVal, userProfile.targetGlucose, userProfile.glucoseUnit)
    : null;

  const handleReadFromCGM = async () => {
    setIsReadingCGM(true);
    setCgmFeedback(null);
    try {
      const activeCgm = userProfile.cgmConfig || loadCGMConfig();
      const reading = await fetchCurrentCGMReading(
        activeCgm,
        userProfile.glucoseUnit
      );
      if (reading && typeof reading.glucose === 'number' && !reading.isSimulation) {
        setGlucoseInput(String(reading.glucose));
        setCgmFeedback({
          type: 'success',
          message: language === 'ar'
            ? `تمت مزامنة قراءة السكر الحقيقية (${reading.sensorModelName || reading.device}) : ${reading.glucose} ${userProfile.glucoseUnit}.`
            : `Glycémie réelle synchronisée (${reading.sensorModelName || reading.device}) : ${reading.glucose} ${userProfile.glucoseUnit}.`,
        });
      } else {
        throw new Error(language === 'ar' ? "لا توجد قياسات حقيقية متاحة." : "Aucune mesure réelle disponible.");
      }
    } catch (err: any) {
      setCgmFeedback({
        type: 'error',
        message: language === 'ar'
          ? `تعذر قراءة المستشعر : ${err?.message || 'غير متصل'}.`
          : `Échec de lecture du capteur CGM : ${err?.message || 'Capteur non joignable'}.`,
        hint: language === 'ar'
          ? 'المحاكاة غير مسموحة. يرجى قياس السكر بالوخز في الإصبع وإدخال القيمة يدوياً أدناه.'
          : 'Aucune simulation autorisée. Veuillez mesurer votre glycémie capillaire au doigt et la saisir manuellement ci-dessous.',
      });
    } finally {
      setIsReadingCGM(false);
    }
  };

  const handleSave = () => {
    if (isValidNumber) {
      if (onSavePostPrandial) {
        onSavePostPrandial(meal.id, numVal);
      }
      if (onSave) {
        onSave(meal.id, numVal);
      }
      onClose();
    }
  };

  const getLocalizedBadgeLabel = () => {
    if (!evaluation) return '';
    if (language !== 'ar') return evaluation.badgeLabel;
    if (evaluation.status === 'hypo') return '🚨 هبوط السكر بعد الأكل';
    if (evaluation.status === 'target') return '🎯 الهدف محقق (جرعة إنسولين مثالية)';
    return '⚠️ ارتفاع السكر بعد الأكل';
  };

  const getLocalizedClinicalAdvice = () => {
    if (!evaluation) return '';
    if (language !== 'ar') return evaluation.clinicalAdvice;
    if (evaluation.status === 'hypo') {
      return 'يلزم تصحيح هبوط السكر فوراً (قاعدة 15غ سكر سريع). قد يرجع ذلك لزيادة تقدير الكربوهيدرات أو لمعامل إنسولين قوي.';
    }
    if (evaluation.status === 'target') {
      return 'تطابق ممتاز بين تقدير كربوهيدرات الوجبة والجرعة المحقونة. المعامل دقيق وملائم لهذا النوع من الأطباق.';
    }
    return 'السكر أعلى من النطاق المستهدف. قد تحتاج لجرعة تصحيح خفيفة إذا استمر بعد 3 إلى 4 ساعات من الوجبة.';
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {language === 'ar' ? 'فحص السكر بعد الأكل بساعتين (+2h)' : 'Contrôle Glycémique Post-Prandial (+2h)'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {language === 'ar' ? (meal.meal_name_ar || meal.meal_name) : meal.meal_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                {language === 'ar' ? 'الوجبة والجرعة المحقونة :' : 'Repas & Dose Initiale :'}
              </span>
              <span className="font-extrabold text-slate-900">
                ≈ {meal.total_carbs} {language === 'ar' ? 'غ كربوهيدرات' : 'g glucides'} • {language === 'ar' ? 'الجرعة :' : 'Bolus :'} {meal.bolus_calculated?.totalBolus || '—'} {language === 'ar' ? 'وحدة' : 'UI'}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              {language === 'ar' ? 'الهدف :' : 'Cible :'} <strong>{userProfile.targetGlucose} {userProfile.glucoseUnit}</strong>
            </div>
          </div>

          {/* Saisie ou synchronisation CGM */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                {language === 'ar' ? 'قياس السكر بعد ساعتين من الوجبة :' : 'Glycémie mesurée 2h après le repas :'}
              </label>

              <button
                type="button"
                onClick={handleReadFromCGM}
                disabled={isReadingCGM}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                <span>
                  {isReadingCGM
                    ? (language === 'ar' ? 'جاري القراءة...' : 'Lecture...')
                    : (language === 'ar' ? 'قراءة المستشعر' : 'Lire capteur CGM')}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step={userProfile.glucoseUnit === 'g/L' ? '0.05' : '1'}
                placeholder={`ex : ${userProfile.glucoseUnit === 'g/L' ? '1.20' : '120'}`}
                value={glucoseInput}
                onChange={(e) => setGlucoseInput(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 text-center"
              />
              <span className="text-xs font-extrabold text-slate-600 px-3 py-2.5 rounded-2xl bg-slate-100">
                {userProfile.glucoseUnit}
              </span>
            </div>
          </div>

          {cgmFeedback && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in transition-all ${
                cgmFeedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : cgmFeedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {cgmFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : cgmFeedback.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-extrabold text-[11px] leading-snug">{cgmFeedback.message}</p>
                {cgmFeedback.hint && (
                  <p className="mt-1 text-[10px] opacity-90 leading-relaxed">{cgmFeedback.hint}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCgmFeedback(null)}
                className="text-current opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                aria-label={language === 'ar' ? 'إغلاق تنبيه المستشعر' : "Fermer l'alerte CGM"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Feedback clinique instantané */}
          {evaluation && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                evaluation.status === 'target'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : evaluation.status === 'hyper'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between font-extrabold">
                <span>{getLocalizedBadgeLabel()}</span>
                <span>{evaluation.deltaLabel}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {getLocalizedClinicalAdvice()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidNumber}
              className="w-2/3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ قياس السكر (+2h)' : 'Enregistrer le contrôle (+2h)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
