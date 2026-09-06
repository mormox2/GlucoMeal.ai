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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
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
                  Installer GlucoMeal
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-black uppercase text-emerald-200 tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Sur votre écran d’accueil comme une application native
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
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
                <span>Installation automatique prête sur cet appareil</span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                Votre navigateur permet d’ajouter GlucoMeal directement à votre tiroir d’applications et écran d’accueil.
              </p>
              <button
                id="btn-confirm-pwa-install"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Installation en cours…' : 'Installer l’application maintenant'}</span>
              </button>
            </div>
          )}

          {/* Guided Instructions by Platform */}
          {activePlatform === 'android' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Installation sur Android (Google Chrome)
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Ouvrez le menu du navigateur</p>
                    <p className="text-slate-500 mt-0.5">
                      Appuyez sur les <strong>trois points verticaux (⋮)</strong> situés dans le coin supérieur droit de Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sélectionnez « Installer l’application »</p>
                    <p className="text-slate-500 mt-0.5">
                      Choisissez <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong> dans la liste.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Confirmation</p>
                    <p className="text-slate-500 mt-0.5">
                      L’icône GlucoMeal apparaît sur votre écran d’accueil et s’ouvre en plein écran sans barre d’URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'ios' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Installation sur iPhone & iPad (Safari)
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Touchez le bouton Partager</p>
                    <p className="text-slate-500 mt-0.5">
                      En bas de l’écran dans <strong>Safari</strong>, touchez l’icône <strong>Partager</strong> (carré avec flèche vers le haut <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sélectionnez « Sur l’écran d’accueil »</p>
                    <p className="text-slate-500 mt-0.5">
                      Faites défiler le menu vers le bas et touchez <strong>« Sur l’écran d’accueil »</strong> (icône <PlusSquare className="inline w-3.5 h-3.5 text-slate-700 mx-0.5" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Validez « Ajouter »</p>
                    <p className="text-slate-500 mt-0.5">
                      Touchez <strong>Ajouter</strong> en haut à droite. L’icône GlucoMeal est installée sur votre iPhone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'desktop' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Installation sur Ordinateur (Chrome, Edge)
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Bouton d’installation dans la barre d’URL</p>
                    <p className="text-slate-500 mt-0.5">
                      Dans Chrome ou Edge, cliquez sur l’icône <strong>Installer (ordinateur avec flèche)</strong> située tout à droite dans la barre d’adresse URL.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Application de bureau autonome</p>
                    <p className="text-slate-500 mt-0.5">
                      GlucoMeal se lance dans sa propre fenêtre indépendante avec raccourci sur votre bureau / menu Démarrer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 Key Benefits for the Diabetic Patient */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Avantages de la version installée :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Hors-ligne</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Base 200+ aliments tunisiens et calcul de bolus accessibles partout sans 4G.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ultra-rapide</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Démarrage immédiat sans chargement de page ni barre de navigateur.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Données locales</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Historique et ratios de sensibilité sécurisés dans votre terminal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Gratuit • Sans compte obligatoire
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
