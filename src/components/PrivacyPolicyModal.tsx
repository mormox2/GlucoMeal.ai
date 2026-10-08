import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Section {
  title: string;
  body: string[];
}

const SECTIONS_FR: Section[] = [
  {
    title: '1. Nature de l’application',
    body: [
      'GlucoMeal AI est une aide au comptage des glucides et au calcul de bolus pour les personnes vivant avec un diabète de type 1. Ce n’est pas un dispositif médical certifié : les estimations doivent être vérifiées et ne remplacent pas l’avis de votre équipe soignante.',
    ],
  },
  {
    title: '2. Données traitées',
    body: [
      'Données de santé : glycémies, doses d’insuline calculées, repas et glucides, ratios et paramètres thérapeutiques, profil (y compris celui d’un enfant), et éventuellement l’adresse e-mail du compte.',
      'Photos et descriptions de repas que vous soumettez à l’analyse.',
      'Identifiants de capteurs (Nightscout, comptes CGM) : conservés uniquement sur votre appareil, jamais synchronisés ni exportés.',
    ],
  },
  {
    title: '3. Où vont vos données',
    body: [
      'Sur votre appareil (stockage du navigateur) : par défaut, toutes vos données y restent.',
      'Analyse des repas : la photo ou la description est envoyée au service Google Gemini pour identifier les aliments et les portions. Elle n’est pas conservée par GlucoMeal après l’analyse.',
      'Sauvegarde cloud (facultative) : si vous l’activez ou créez un compte, vos données sont enregistrées dans Google Firebase (Firestore et Storage), accessibles uniquement par votre compte. Un code de partage expire au bout de 7 jours.',
      'Mesure d’audience (facultative) : Vercel Analytics, statistiques de visites anonymes, sans données de santé.',
    ],
  },
  {
    title: '4. Base légale et durée',
    body: [
      'Le traitement des données de santé repose sur votre consentement explicite (RGPD art. 9 ; loi tunisienne n° 2004-63). Vous pouvez le retirer à tout moment. Les données sont conservées tant que vous ne les supprimez pas.',
    ],
  },
  {
    title: '5. Vos droits',
    body: [
      'Accès et portabilité : Historique > Sauvegarde JSON ou Export Excel.',
      'Effacement : Profil > Confidentialité > « Supprimer toutes mes données » efface les données de l’appareil, du cloud et le compte.',
      'Retrait du consentement : désactivez la sauvegarde cloud ou la mesure d’audience dans Profil > Confidentialité.',
    ],
  },
];

const SECTIONS_AR: Section[] = [
  {
    title: '1. طبيعة التطبيق',
    body: [
      'جلوكوميل أداة مساعدة لحساب الكربوهيدرات وجرعة الإنسولين لمرضى السكري من النوع الأول، وليست جهازاً طبياً معتمداً. يجب التحقق من التقديرات، وهي لا تعوض رأي فريقك الطبي.',
    ],
  },
  {
    title: '2. البيانات المعالجة',
    body: [
      'بيانات صحية : قياسات السكر، الجرعات، الوجبات، المعاملات العلاجية، الملف (بما في ذلك ملف الطفل) والبريد الإلكتروني للحساب.',
      'صور وأوصاف الوجبات المرسلة للتحليل. معرفات المستشعرات تبقى على جهازك فقط.',
    ],
  },
  {
    title: '3. أين تذهب بياناتك',
    body: [
      'على جهازك افتراضياً. تُرسل صورة الوجبة أو وصفها إلى خدمة Google Gemini للتحليل فقط.',
      'الحفظ السحابي (اختياري) على Google Firebase، متاح لحسابك فقط. قياس الزيارات (اختياري) عبر Vercel Analytics دون بيانات صحية.',
    ],
  },
  {
    title: '4. حقوقك',
    body: [
      'يمكنك تصدير بياناتك من السجل، وحذف كل بياناتك والحساب من الملف الشخصي > الخصوصية، وسحب موافقتك في أي وقت.',
    ],
  },
];

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const { language, isRtl } = useLanguage();
  if (!isOpen) return null;
  const sections = language === 'ar' ? SECTIONS_AR : SECTIONS_FR;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto ${isRtl ? 'font-arabic' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[92vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 id="privacy-policy-title" className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            {language === 'ar' ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title} className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
