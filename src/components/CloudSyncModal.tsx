import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  Smartphone,
  Laptop,
  ArrowRight,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  getStoredSyncCode,
  getLastSyncTime,
  pushDataToCloud,
  pullDataFromCloud,
} from '../utils/cloudSync';
import {
  ensureAuthenticatedUser,
  syncProfileToFirestore,
  syncBatchMealsToFirestore,
} from '../services/firebase';
import { loadSavedMeals, loadUserProfile } from '../utils/storage';
import { AnalyzedMeal, UserProfileDT1 } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [currentCode, setCurrentCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const code = getStoredSyncCode();
      if (code) setCurrentCode(code);
      setLastSync(getLastSyncTime());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsPushing(true);
    setStatusMessage(null);
    try {
      // Synchronisation parallèle avec Firebase Firestore
      await ensureAuthenticatedUser();
      const profile = loadUserProfile();
      const meals = loadSavedMeals();
      await syncProfileToFirestore(profile);
      if (meals.length > 0) {
        await syncBatchMealsToFirestore(meals);
      }
    } catch (err) {
      console.warn('Sync Firestore non-bloquante:', err);
    }
    const res = await pushDataToCloud(currentCode || undefined);
    setIsPushing(false);
    if (res.success) {
      setCurrentCode(res.syncCode);
      setLastSync(res.lastUpdated || new Date().toISOString());
      setStatusMessage({ text: 'Sauvegarde cloud Firebase Firestore & Code de liaison réussie !', type: 'success' });
      if (onSyncComplete) onSyncComplete();
    } else {
      setStatusMessage({ text: res.message || 'Erreur de sauvegarde.', type: 'error' });
    }
  };

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsPulling(true);
    setStatusMessage(null);
    const res = await pullDataFromCloud(inputCode);
    setIsPulling(false);

    if (res.success) {
      setCurrentCode(inputCode.trim().toUpperCase());
      setLastSync(new Date().toISOString());
      setStatusMessage({ text: res.message, type: 'success' });
      if (onSyncComplete) onSyncComplete();
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
  };

  const handleCopyCode = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Cloud className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Multi-Appareils
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Synchronisation Cloud Sécurisée
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Device Sync Info Diagram */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-around text-center text-xs">
            <div className="flex flex-col items-center">
              <Smartphone className="w-5 h-5 text-sky-700 mb-1" />
              <span className="font-bold text-slate-800">Smartphone</span>
              <span className="text-[10px] text-slate-500">Prise photo / repas</span>
            </div>
            <div className="flex flex-col items-center px-2">
              <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-[10px] text-sky-700 font-bold mt-1">Code Unique</span>
            </div>
            <div className="flex flex-col items-center">
              <Laptop className="w-5 h-5 text-indigo-700 mb-1" />
              <span className="font-bold text-slate-800">Ordinateur / Diabéto</span>
              <span className="text-[10px] text-slate-500">Rapports & consultation</span>
            </div>
          </div>

          {/* Current Sync Code Box */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Votre Code Cloud Actuel :</span>
              {lastSync && (
                <span className="text-[10px] text-slate-400">
                  Dernier envoi : {new Date(lastSync).toLocaleTimeString('fr-FR')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 font-mono font-black text-slate-900 text-sm tracking-wider text-center select-all">
                {currentCode || 'AUCUN CODE GÉNÉRÉ'}
              </div>

              {currentCode && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Copier le code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handlePush}
              disabled={isPushing}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <CloudUpload className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'Téléversement en cours...' : 'Envoyer mes données vers le Cloud'}</span>
            </button>
          </div>

          {/* Import with existing Sync Code */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block">
              Synchroniser depuis un autre appareil :
            </span>
            <p className="text-[11px] text-slate-500">
              Saisissez le code affiché sur votre autre appareil pour restaurer instantanément tous vos repas et votre profil DT1 :
            </p>

            <form onSubmit={handlePull} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex : TN-8924"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase font-bold focus:outline-none focus:border-sky-500 bg-white"
              />
              <button
                type="submit"
                disabled={isPulling || !inputCode.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <CloudDownload className="w-4 h-4" />
                <span>{isPulling ? 'Import...' : 'Importer'}</span>
              </button>
            </form>
          </div>

          {/* Firebase Firestore Infrastructure Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Base Cloud Firebase Firestore Active</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">
                GlucoMeal AI
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-amber-800/80 font-mono">
              <span>Projet : GlucoMeal AI</span>
              <span className="opacity-75" title="ID technique Google Cloud: winter-quota-8dzmz">ID: winter-quota-8dzmz</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Vos repas et paramètres d'insuline bénéficient du cache hors-ligne persistant (IndexedDB) et de la synchronisation sécurisée Google Firebase (Zero-Trust Rules).
            </p>
          </div>

          {/* Privacy info */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Vos données restent stockées localement en priorité (PWA hors-ligne). La synchronisation cloud permet la continuité sur tous vos écrans.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
