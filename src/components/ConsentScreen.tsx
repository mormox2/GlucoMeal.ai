import React, { useState } from 'react';
import { ShieldCheck, Cloud, BarChart3, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ConsentState, saveConsent } from '../utils/consent';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface ConsentScreenProps {
  onAccept: (consent: ConsentState) => void;
  onDecline: () => void;
}

/**
 * Consentement explicite au traitement des données de santé, demandé avant toute utilisation.
 * La sauvegarde cloud et la mesure d'audience sont facultatives et désactivées par défaut.
 */
export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAccept, onDecline }) => {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';
  const [healthDataAccepted, setHealthDataAccepted] = useState(false);
  const [cloudSync, setCloudSync] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  return (
    <div
      className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${isRtl ? 'font-arabic' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-200 p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-slate-900">
            {isAr ? 'بياناتك الصحية وموافقتك' : 'Vos données de santé et votre accord'}
          </h1>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            {isAr
              ? 'جلوكوميل أداة مساعدة وليست جهازاً طبياً معتمداً : تحقق دائماً من الكربوهيدرات والجرعة، واتبع تعليمات فريقك الطبي.'
              : 'GlucoMeal est une aide, pas un dispositif médical certifié : vérifiez toujours les glucides et la dose, et suivez les consignes de votre équipe soignante.'}
          </span>
        </div>

        <label className="flex gap-3 p-3 rounded-2xl border border-slate-200 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={healthDataAccepted}
            onChange={(e) => setHealthDataAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600"
          />
          <span>
            <strong className="block text-slate-900">
              {isAr ? 'معالجة بياناتي الصحية (إلزامي)' : 'Traitement de mes données de santé (obligatoire)'}
            </strong>
            {isAr
              ? 'أوافق على معالجة قياسات السكر والجرعات والوجبات على هذا الجهاز، وعلى إرسال صور وأوصاف وجباتي إلى Google Gemini لتحليلها.'
              : 'J’accepte le traitement de mes glycémies, doses et repas sur cet appareil, et l’envoi des photos et descriptions de repas à Google Gemini pour leur analyse.'}
          </span>
        </label>

        <label className="flex gap-3 p-3 rounded-2xl border border-slate-200 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={cloudSync}
            onChange={(e) => setCloudSync(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600"
          />
          <span>
            <strong className="text-slate-900 flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              {isAr ? 'الحفظ السحابي (اختياري)' : 'Sauvegarde cloud (facultatif)'}
            </strong>
            {isAr
              ? 'حفظ بياناتي على Google Firebase للمزامنة بين الأجهزة.'
              : 'Enregistrer mes données dans Google Firebase pour les retrouver sur mes autres appareils.'}
          </span>
        </label>

        <label className="flex gap-3 p-3 rounded-2xl border border-slate-200 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600"
          />
          <span>
            <strong className="text-slate-900 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              {isAr ? 'قياس الزيارات (اختياري)' : 'Mesure d’audience (facultatif)'}
            </strong>
            {isAr
              ? 'إحصاءات زيارات مجهولة الهوية (Vercel Analytics)، دون أي بيانات صحية.'
              : 'Statistiques de visites anonymes (Vercel Analytics), sans aucune donnée de santé.'}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setIsPolicyOpen(true)}
          className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
        >
          {isAr ? 'قراءة سياسة الخصوصية' : 'Lire la politique de confidentialité'}
        </button>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="sm:w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            {isAr ? 'رفض' : 'Refuser'}
          </button>
          <button
            type="button"
            disabled={!healthDataAccepted}
            onClick={() => onAccept(saveConsent({ cloudSync, analytics }))}
            className="sm:w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-extrabold cursor-pointer"
          >
            {isAr ? 'أوافق وأتابع' : 'J’accepte et je continue'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          {isAr
            ? 'بدون الموافقة الإلزامية لا يمكن استخدام التطبيق. يمكنك تغيير اختياراتك أو حذف بياناتك في أي وقت من الملف الشخصي > الخصوصية.'
            : 'Sans l’accord obligatoire, l’application ne peut pas être utilisée. Vous pouvez modifier vos choix ou supprimer vos données à tout moment dans Profil > Confidentialité.'}
        </p>
      </div>
      <PrivacyPolicyModal isOpen={isPolicyOpen} onClose={() => setIsPolicyOpen(false)} />
    </div>
  );
};
