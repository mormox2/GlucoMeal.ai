import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Compass,
  Monitor,
  WifiOff,
  Zap,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstalledSuccess: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalledSuccess,
}) => {
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActivePlatform('ios');
      } else if (/android/.test(ua)) {
        setActivePlatform('android');
      } else {
        setActivePlatform('desktop');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstalledSuccess();
        onClose();
      }
    } catch (err) {
      console.warn('PWA prompt error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      id="modal-pwa-install"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 ${
        isRtl ? 'font-arabic' : ''
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-white/20 shrink-0">
              <img src="/icon.svg" alt="GlucoMeal" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  {isAr ? 'تثبيت تطبيق جلوكوميل' : 'Installer GlucoMeal'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-black uppercase text-emerald-200 tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {isAr
                  ? 'على شاشة هاتفك الرئيسية كتطبيق مستقل ومباشر'
                  : 'Sur votre écran d’accueil comme une application native'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Fermer'}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Decorative background glow */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>iPhone / iPad</span>
          </button>
          <button
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'desktop'
                ? 'bg-white text-emerald-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-600" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Direct 1-Click Native Install Action (if available) */}
          {deferredPrompt && activePlatform !== 'ios' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr
                    ? 'التثبيت التلقائي جاهز على هذا الجهاز'
                    : 'Installation automatique prête sur cet appareil'}
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                {isAr
                  ? 'يتيح متصفحك إضافة جلوكوميل مباشرة إلى درج التطبيقات وشاشتك الرئيسية.'
                  : 'Votre navigateur permet d’ajouter GlucoMeal directement à votre tiroir d’applications et écran d’accueil.'}
              </p>
              <button
                id="btn-confirm-pwa-install"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isInstalling
                    ? (isAr ? 'جاري التثبيت…' : 'Installation en cours…')
                    : (isAr ? 'تثبيت التطبيق الآن' : 'Installer l’application maintenant')}
                </span>
              </button>
            </div>
          )}

          {/* Guided Instructions by Platform */}
          {activePlatform === 'android' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isAr
                  ? 'طريقة التثبيت على أندرويد (Google Chrome)'
                  : 'Installation sur Android (Google Chrome)'}
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'افتح قائمة المتصفح' : 'Ouvrez le menu du navigateur'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'اضغط على النقاط الثلاث العمودية (⋮) أعلى يمين متصفح Chrome.'
                        : 'Appuyez sur les trois points verticaux (⋮) situés dans le coin supérieur droit de Google Chrome.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'اختر «تثبيت التطبيق»' : 'Sélectionnez « Installer l’application »'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» من القائمة.'
                        : 'Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil » dans la liste.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'التأكيد والاستخدام' : 'Confirmation'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'ستظهر أيقونة جلوكوميل على شاشتك الرئيسية وتعمل بملء الشاشة دون الحاجة لفتح المتصفح.'
                        : 'L’icône GlucoMeal apparaît sur votre écran d’accueil et s’ouvre en plein écran sans barre d’URL.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'ios' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isAr
                  ? 'طريقة التثبيت على آيفون وآيباد (Safari)'
                  : 'Installation sur iPhone & iPad (Safari)'}
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'اضغط على زر المشاركة' : 'Touchez le bouton Partager'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'في أسفل شاشة Safari، اضغط على أيقونة المشاركة (مربع مع سهم لأعلى).'
                        : 'En bas de l’écran dans Safari, touchez l’icône Partager (carré avec flèche vers le haut).'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'اختر «إضافة إلى الشاشة الرئيسية»' : 'Sélectionnez « Sur l’écran d’accueil »'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'مرر القائمة لأسفل واختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen ⊞).'
                        : 'Faites défiler le menu vers le bas et touchez « Sur l’écran d’accueil ».'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'تأكيد الإضافة' : 'Validez « Ajouter »'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'اضغط على «إضافة» في أعلى الشاشة. ستظهر أيقونة جلوكوميل فوراً على شاشة هاتفك.'
                        : 'Touchez Ajouter en haut à droite. L’icône GlucoMeal est installée sur votre iPhone.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'desktop' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isAr
                  ? 'طريقة التثبيت على الكمبيوتر (Chrome, Edge)'
                  : 'Installation sur Ordinateur (Chrome, Edge)'}
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'زر التثبيت في شريط العناوين' : 'Bouton d’installation dans la barre d’URL'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'في متصفح Chrome أو Edge، انقر على أيقونة التثبيت في شريط العنوان أعلى الشاشة.'
                        : 'Dans Chrome ou Edge, cliquez sur l’icône Installer située dans la barre d’adresse URL.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isAr ? 'تطبيق سطح مكتب مستقل' : 'Application de bureau autonome'}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'يعمل جلوكوميل في نافذة مستقلة وخفيفة مع اختصار مباشر على سطح المكتب.'
                        : 'GlucoMeal se lance dans sa propre fenêtre indépendante avec raccourci sur votre bureau.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 Key Benefits for the Diabetic Patient */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              {isAr ? 'مزايا النسخة المثبتة على الجهاز :' : 'Avantages de la version installée :'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? '100% دون إنترنت' : '100% Hors-ligne'}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {isAr
                    ? 'قاعدة الأطعمة التونسية وحاسبة الإنسولين متوفرة دائماً دون إنترنت.'
                    : 'Base 200+ aliments tunisiens et calcul de bolus accessibles partout sans 4G.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'سرعة فائقة' : 'Ultra-rapide'}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {isAr
                    ? 'فتح فوري دون انتظار تحميل الصفحات أو أشرطة المتصفح.'
                    : 'Démarrage immédiat sans chargement de page ni barre de navigateur.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'بيانات محلية آمنة' : 'Données locales'}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {isAr
                    ? 'سجلك ومعاملاتك العلاجية محفوظة بأمان تام على جهازك.'
                    : 'Historique et ratios de sensibilité sécurisés dans votre terminal.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            {isAr ? 'مجاني بالكامل • دون حساب إلزامي' : 'Gratuit • Sans compte obligatoire'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
