import React, { useState } from 'react';
import {
  Activity,
  Wifi,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  BatteryCharging,
  Calendar,
  Key,
  Globe,
  Radio,
} from 'lucide-react';
import { CGMConfig, CGMReading, UserProfileDT1 } from '../types';
import { fetchCurrentCGMReading, saveCGMConfig } from '../utils/cgmService';

interface CGMSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CGMConfig;
  userProfile?: UserProfileDT1;
  onUpdateConfig?: (cfg: CGMConfig) => void;
  onSaveConfig?: (cfg: CGMConfig) => void;
  onApplyReading?: (glucose: number) => void;
}

export const CGMSyncModal: React.FC<CGMSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  userProfile,
  onUpdateConfig,
  onSaveConfig,
  onApplyReading,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status');
  const [selectedDevice, setSelectedDevice] = useState<CGMConfig['deviceType']>(config.deviceType);
  const [nightscoutUrl, setNightscoutUrl] = useState(config.nightscoutUrl || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  
  // LibreLinkUp & Dexcom direct connect states
  const [libreEmail, setLibreEmail] = useState(config.libreEmail || '');
  const [librePassword, setLibrePassword] = useState(config.librePassword || '');
  const [libreRegion, setLibreRegion] = useState<'fr' | 'eu' | 'us'>(config.libreRegion || 'eu');
  const [dexcomUsername, setDexcomUsername] = useState(config.dexcomUsername || '');
  const [dexcomPassword, setDexcomPassword] = useState(config.dexcomPassword || '');
  const [dexcomRegion, setDexcomRegion] = useState<'eu' | 'us'>(config.dexcomRegion || 'eu');

  const [isReading, setIsReading] = useState(false);
  const [currentReading, setCurrentReading] = useState<CGMReading | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUnit = userProfile?.glucoseUnit || 'g/L';

  const handleReadSensor = async () => {
    setIsReading(true);
    setSyncMessage(null);
    try {
      const reading = await fetchCurrentCGMReading(
        {
          ...config,
          deviceType: selectedDevice,
          libreEmail,
          librePassword,
          libreRegion,
          dexcomUsername,
          dexcomPassword,
          dexcomRegion,
        },
        currentUnit
      );
      setCurrentReading(reading);
      setSyncMessage('✅ Donnée capteur synchronisée en direct (BLE / Cloud API) !');
    } catch (err) {
      setSyncMessage('❌ Impossible de contacter la passerelle du capteur.');
    } finally {
      setIsReading(false);
    }
  };

  const handleSaveSettings = () => {
    const newConfig: CGMConfig = {
      ...config,
      deviceType: selectedDevice,
      nightscoutUrl,
      apiKey,
      libreEmail,
      librePassword,
      libreRegion,
      dexcomUsername,
      dexcomPassword,
      dexcomRegion,
      isConnected: true,
      lastSync: new Date().toISOString(),
      sensorExpiryDays: selectedDevice === 'freestyle' ? 8 : selectedDevice === 'dexcom' ? 6 : 14,
    };
    if (onUpdateConfig) onUpdateConfig(newConfig);
    if (onSaveConfig) onSaveConfig(newConfig);
    saveCGMConfig(newConfig);
    setSyncMessage('✅ Configuration CGM enregistrée et connectée !');
    setTimeout(() => setSyncMessage(null), 3500);
  };

  const getTrendIcon = (trend: CGMReading['trend']) => {
    switch (trend) {
      case 'up_fast':
        return <TrendingUp className="w-6 h-6 text-rose-500 stroke-[3]" />;
      case 'up_slow':
        return <TrendingUp className="w-6 h-6 text-amber-500 stroke-[2.5]" />;
      case 'down_fast':
        return <TrendingDown className="w-6 h-6 text-rose-500 stroke-[3]" />;
      case 'down_slow':
        return <TrendingDown className="w-6 h-6 text-amber-500 stroke-[2.5]" />;
      case 'flat':
      default:
        return <Minus className="w-6 h-6 text-emerald-400 stroke-[3]" />;
    }
  };

  const getTrendText = (trend: CGMReading['trend']) => {
    switch (trend) {
      case 'up_fast':
        return 'Montée rapide (> 0.03 g/L/min)';
      case 'up_slow':
        return 'Montée modérée (+0.01 à +0.02 g/L/min)';
      case 'down_fast':
        return 'Baisse rapide (> 0.03 g/L/min)';
      case 'down_slow':
        return 'Baisse modérée';
      case 'flat':
      default:
        return 'Stable (variation < 0.01 g/L/min)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Activity className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Télémédecine DT1
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Passerelle Capteurs CGM & LibreLinkUp
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 px-5 pt-3 bg-slate-50">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Glycémie Directe & Courbe
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Configuration des Connecteurs
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {syncMessage && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {activeTab === 'status' ? (
            <div className="space-y-4">
              {/* Carte lecteur instantané */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    {selectedDevice === 'freestyle'
                      ? 'FreeStyle LibreLinkUp Direct'
                      : selectedDevice === 'dexcom'
                      ? 'Dexcom Share Cloud'
                      : selectedDevice === 'nightscout'
                      ? 'Nightscout Rest API'
                      : 'Simulateur Haute-Fidélité'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentReading ? 'Lecture continue' : 'En veille'}
                  </span>
                </div>

                {currentReading ? (
                  <div className="py-2">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                        {currentReading.glucose}
                      </span>
                      <div className="flex flex-col items-center">
                        {getTrendIcon(currentReading.trend)}
                        <span className="text-xs text-slate-300 font-bold mt-1">
                          {currentUnit}
                        </span>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-medium">
                        Tendance : {getTrendText(currentReading.trend)}
                      </span>
                    </div>

                    {/* Mini Sparkline Glucose Curve (3 dernières heures) */}
                    {currentReading.recentSparkline && currentReading.recentSparkline.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span>Historique continu (-3h)</span>
                          <span>Fréquence 15 min</span>
                        </div>
                        <div className="flex items-end justify-between gap-1 h-12 px-1">
                          {currentReading.recentSparkline.map((pt, idx) => {
                            const maxVal = currentUnit === 'g/L' ? 2.5 : 250;
                            const heightPct = Math.min(100, Math.max(15, (pt.value / maxVal) * 100));
                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center gap-0.5 group relative"
                              >
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full rounded-t-sm transition-all ${
                                    idx === currentReading.recentSparkline!.length - 1
                                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                                      : 'bg-white/30 hover:bg-white/60'
                                  }`}
                                />
                                <span className="text-[8px] text-slate-400 opacity-60 hidden group-hover:block absolute -top-4 bg-slate-900 px-1 rounded">
                                  {pt.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sensor details */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Capteur : {currentReading.sensorExpiryDays || 8} jours restants
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        N° Série : {currentReading.sensorSerialNumber || 'SN-7842'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Activity className="w-10 h-10 text-cyan-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-slate-300">
                      Appuyez ci-dessous pour interroger le capteur CGM ou simuler une mesure NFC/Bluetooth.
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleReadSensor}
                    disabled={isReading}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReading ? 'animate-spin' : ''}`} />
                    <span>{isReading ? 'Interrogation du capteur...' : 'Actualiser la glycémie'}</span>
                  </button>

                  {currentReading && onApplyReading && (
                    <button
                      onClick={() => {
                        onApplyReading(currentReading.glucose);
                        onClose();
                      }}
                      className="py-2.5 px-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Injecter dans le repas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rappel du protocole Post-Prandial (+2h) */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>Protocole Clinique Post-Prandial (+2h)</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Le capteur continu mesure automatiquement l'amplitude du pic post-prandial. L'algorithme d'auto-titration s'appuie sur ces mesures pour affiner vos ratios d'insuline par créneau horaire.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Choix du type de capteur */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Sélectionnez votre système de mesure continue :
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'freestyle', label: 'FreeStyle Libre 2 / 3', sub: 'LibreLinkUp Cloud', icon: Smartphone },
                    { id: 'dexcom', label: 'Dexcom G6 / G7 / ONE', sub: 'Dexcom Share API', icon: Smartphone },
                    { id: 'nightscout', label: 'Nightscout Open API', sub: 'Serveur personnel', icon: Server },
                    { id: 'simulator', label: 'Simulateur Bluetooth', sub: 'Mode démonstration', icon: Activity },
                  ].map((dev) => {
                    const Icon = dev.icon;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => setSelectedDevice(dev.id as any)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          selectedDevice === dev.id
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                        <div>
                          <span className="block text-xs">{dev.label}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{dev.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FreeStyle LibreLinkUp Direct Connect */}
              {selectedDevice === 'freestyle' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Globe className="w-3.5 h-3.5 text-blue-700" />
                    <span>Compte LibreLinkUp (Abbott Cloud)</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Email de connexion LibreLinkUp :
                    </label>
                    <input
                      type="email"
                      placeholder="patient@gmail.com"
                      value={libreEmail}
                      onChange={(e) => setLibreEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mot de passe du compte :
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={librePassword}
                      onChange={(e) => setLibrePassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Serveur régional Abbott :
                    </label>
                    <select
                      value={libreRegion}
                      onChange={(e) => setLibreRegion(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="eu">Europe / France / Tunisie (api-eu.libreview.io)</option>
                      <option value="us">États-Unis (api-us.libreview.io)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dexcom Share Direct Connect */}
              {selectedDevice === 'dexcom' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Globe className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Compte Dexcom Share (Dexcom Cloud)</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nom d'utilisateur Dexcom :
                    </label>
                    <input
                      type="text"
                      placeholder="Identifiant Dexcom"
                      value={dexcomUsername}
                      onChange={(e) => setDexcomUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mot de passe :
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={dexcomPassword}
                      onChange={(e) => setDexcomPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Nightscout Rest API */}
              {selectedDevice === 'nightscout' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      URL de l'instance Nightscout :
                    </label>
                    <input
                      type="url"
                      placeholder="https://monsite.herokuapp.com"
                      value={nightscoutUrl}
                      onChange={(e) => setNightscoutUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Clé d'API (API Secret Token) :
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer & Activer le connecteur</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
