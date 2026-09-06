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
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  BatteryCharging,
  Calendar,
  Key,
  Globe,
  Radio,
  Bluetooth,
  Cpu,
  Scan,
  Tag,
  Waves,
} from 'lucide-react';
import { CGMConfig, CGMReading, UserProfileDT1 } from '../types';
import {
  fetchCurrentCGMReading,
  saveCGMConfig,
  checkHardwareSupport,
  connectBluetoothGlucoseMeter,
  connectLinxCGM,
  connectSyaiTagCGM,
  scanNFCGlucoseSensor,
  BluetoothConnectionResult,
  ChineseCGMConnectionResult,
  NFCScanResult,
} from '../utils/cgmService';

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
  const [activeTab, setActiveTab] = useState<'status' | 'hardware' | 'settings'>('status');
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

  // Chinese CGMs state (LinX, Syai Tag, Sibionics)
  const [linxSerialNumber, setLinxSerialNumber] = useState(config.linxSerialNumber || 'LX-883920');
  const [linxBridgeMode, setLinxBridgeMode] = useState<CGMConfig['linxBridgeMode']>(config.linxBridgeMode || 'ble_direct');
  const [linxCloudEmail, setLinxCloudEmail] = useState(config.linxCloudEmail || '');
  const [linxCloudPassword, setLinxCloudPassword] = useState(config.linxCloudPassword || '');

  const [syaiSerialNumber, setSyaiSerialNumber] = useState(config.syaiSerialNumber || 'ST-409182');
  const [syaiBridgeMode, setSyaiBridgeMode] = useState<CGMConfig['syaiBridgeMode']>(config.syaiBridgeMode || 'ble_smart');
  const [syaiEmail, setSyaiEmail] = useState(config.syaiEmail || '');
  const [syaiPassword, setSyaiPassword] = useState(config.syaiPassword || '');

  const [sibionicsSerialNumber, setSibionicsSerialNumber] = useState(config.sibionicsSerialNumber || 'SB-118274');

interface SyncStatusFeedback {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  hint?: string;
}

  const [isReading, setIsReading] = useState(false);
  const [currentReading, setCurrentReading] = useState<CGMReading | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusFeedback | null>(null);

  // Hardware BLE & NFC & Chinese CGM Testing states
  const [isBleScanning, setIsBleScanning] = useState(false);
  const [bleResult, setBleResult] = useState<BluetoothConnectionResult | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcResult, setNfcResult] = useState<NFCScanResult | null>(null);
  
  // Specific Chinese CGMs live testing
  const [isLinxScanning, setIsLinxScanning] = useState(false);
  const [linxResult, setLinxResult] = useState<ChineseCGMConnectionResult | null>(null);
  const [isSyaiScanning, setIsSyaiScanning] = useState(false);
  const [syaiResult, setSyaiResult] = useState<ChineseCGMConnectionResult | null>(null);

  const hardwareSupport = checkHardwareSupport();

  if (!isOpen) return null;

  const currentUnit = userProfile?.glucoseUnit || 'g/L';

  const handleConnectBle = async () => {
    setIsBleScanning(true);
    setSyncStatus(null);
    try {
      const res = await connectBluetoothGlucoseMeter(currentUnit);
      setBleResult(res);
      if (res.success && res.glucoseValue) {
        if (res.isSimulation) {
          setSyncStatus({
            type: 'info',
            title: 'Mode Émulation Bluetooth',
            description: res.message,
            hint: 'Lecteur virtuel de démonstration synchronisé. Pour un lecteur physique, activez le Bluetooth sur votre appareil.',
          });
        } else {
          setSyncStatus({
            type: 'success',
            title: 'Lecteur Bluetooth connecté',
            description: res.message,
          });
        }
      } else {
        setSyncStatus({
          type: 'error',
          title: 'Échec de connexion Bluetooth',
          description: res.message || 'Impossible d’établir la liaison avec le lecteur de glycémie.',
          hint: 'Vérifiez que le lecteur est allumé, à portée (< 2 mètres) et que le Bluetooth de votre appareil est actif.',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la tentative de connexion BLE.';
      setBleResult({
        success: false,
        unit: currentUnit,
        timestamp: new Date().toISOString(),
        source: 'bluetooth_real',
        message: msg,
      });
      setSyncStatus({
        type: 'error',
        title: 'Erreur d’accès Bluetooth',
        description: msg,
        hint: 'Le navigateur ou le système a refusé la connexion Bluetooth. Vous pouvez saisir votre glycémie manuellement.',
      });
    } finally {
      setIsBleScanning(false);
    }
  };

  const handleConnectLinx = async () => {
    setIsLinxScanning(true);
    setSyncStatus(null);
    try {
      const res = await connectLinxCGM(currentUnit);
      setLinxResult(res);
      if (res.success && res.glucoseValue) {
        setSelectedDevice('linx');
        if (res.isSimulation) {
          setSyncStatus({
            type: 'info',
            title: 'Capteur LinX CGM (Émulé)',
            description: res.message,
            hint: 'Flux démo actif. Pour appairer votre capteur LinX physique, activez le Bluetooth sur votre ordinateur/smartphone.',
          });
        } else {
          setSyncStatus({
            type: 'success',
            title: 'Capteur LinX CGM connecté en direct',
            description: res.message,
          });
        }
      } else {
        setSyncStatus({
          type: 'error',
          title: 'Échec de connexion LinX CGM',
          description: res.message || 'Le capteur LinX CGM n’a pas répondu.',
          hint: 'Vérifiez que le capteur LinX est actif, non périmé (15j max) et à portée Bluetooth.',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la connexion Bluetooth LinX CGM.';
      setLinxResult({
        success: false,
        brand: 'linx',
        modelName: 'LinX CGMS (MicroTech)',
        deviceName: 'LinX CGM Sensor',
        serialNumber: 'LX-883920',
        unit: currentUnit,
        trend: 'flat',
        timestamp: new Date().toISOString(),
        sensorExpiryDays: 15,
        mardScore: '8.9%',
        batteryLevel: 94,
        samplingInterval: '1 minute',
        specsHighlight: 'Étanche IP68 • 15 Jours',
        source: 'bluetooth_real',
        message: msg,
      });
      setSyncStatus({
        type: 'error',
        title: 'Erreur Bluetooth LinX CGM',
        description: msg,
        hint: 'Assurez-vous que le Bluetooth est activé et autorisez l’accès dans votre navigateur.',
      });
    } finally {
      setIsLinxScanning(false);
    }
  };

  const handleConnectSyai = async () => {
    setIsSyaiScanning(true);
    setSyncStatus(null);
    try {
      const res = await connectSyaiTagCGM(currentUnit);
      setSyaiResult(res);
      if (res.success && res.glucoseValue) {
        setSelectedDevice('syai');
        if (res.isSimulation) {
          setSyncStatus({
            type: 'info',
            title: 'Capteur Syai Tag (Émulé)',
            description: res.message,
            hint: 'Flux démo actif. Approchez votre Syai Tag physique à moins de 50 cm pour la synchronisation réelle.',
          });
        } else {
          setSyncStatus({
            type: 'success',
            title: 'Capteur Syai Tag connecté en direct',
            description: res.message,
          });
        }
      } else {
        setSyncStatus({
          type: 'error',
          title: 'Échec de connexion Syai Tag',
          description: res.message || 'Le capteur Syai Tag n’a pas pu être joint.',
          hint: 'Vérifiez que le capteur Syai Tag est bien en place et que le Bluetooth de votre appareil est actif.',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de la connexion Bluetooth Syai Tag.';
      setSyaiResult({
        success: false,
        brand: 'syai',
        modelName: 'Syai Tag CGMS (Syai Health)',
        deviceName: 'Syai Tag Sensor',
        serialNumber: 'ST-409182',
        unit: currentUnit,
        trend: 'flat',
        timestamp: new Date().toISOString(),
        sensorExpiryDays: 14,
        mardScore: '8.1%',
        batteryLevel: 95,
        samplingInterval: '1-3 min',
        specsHighlight: 'Ultra-léger 1.2g • MARD 8.1%',
        source: 'bluetooth_real',
        message: msg,
      });
      setSyncStatus({
        type: 'error',
        title: 'Erreur Bluetooth Syai Tag',
        description: msg,
        hint: 'Connexion refusée ou interrompue. La saisie manuelle de glycémie reste opérationnelle.',
      });
    } finally {
      setIsSyaiScanning(false);
    }
  };

  const handleScanNfc = async () => {
    setIsNfcScanning(true);
    setSyncStatus(null);
    try {
      const res = await scanNFCGlucoseSensor(currentUnit);
      setNfcResult(res);
      if (res.success && res.glucoseValue) {
        setSyncStatus({
          type: 'success',
          title: 'Scan NFC réussi',
          description: res.message,
        });
      } else {
        setSyncStatus({
          type: 'error',
          title: 'Scan NFC non abouti',
          description: res.message || 'Délai d’attente dépassé ou capteur non détecté.',
          hint: 'Plaquez fermement le haut de votre smartphone contre le capteur FreeStyle Libre pendant 2 à 3 secondes.',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors du scan NFC.';
      setNfcResult({
        success: false,
        unit: currentUnit,
        timestamp: new Date().toISOString(),
        source: 'nfc_real',
        message: msg,
      });
      setSyncStatus({
        type: 'error',
        title: 'Erreur Scan NFC',
        description: msg,
        hint: 'Vérifiez que la fonction NFC est bien activée dans les paramètres de votre smartphone.',
      });
    } finally {
      setIsNfcScanning(false);
    }
  };

  const handleReadSensor = async () => {
    setIsReading(true);
    setSyncStatus(null);
    try {
      const reading = await fetchCurrentCGMReading(
        {
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
          linxSerialNumber,
          linxBridgeMode,
          linxCloudEmail,
          linxCloudPassword,
          syaiSerialNumber,
          syaiBridgeMode,
          syaiEmail,
          syaiPassword,
          sibionicsSerialNumber,
        },
        currentUnit
      );
      setCurrentReading(reading);
      if (reading.errorMessage) {
        setSyncStatus({
          type: 'warning',
          title: 'Avertissement Passerelle CGM',
          description: reading.errorMessage,
          hint: 'Une glycémie indicative a été générée. Pour le calcul réel de dose, contrôlez votre glycémie par piqûre au doigt.',
        });
      } else if (reading.isSimulation) {
        setSyncStatus({
          type: 'info',
          title: 'Mode Banc d’Essai Virtuel',
          description: `Lecture simulée générée : ${reading.glucose} ${currentUnit}.`,
          hint: 'Renseignez vos accès dans l’onglet Connecteurs Cloud pour basculer sur vos données en direct.',
        });
      } else {
        setSyncStatus({
          type: 'success',
          title: 'Lecture capteur synchronisée',
          description: `Donnée reçue en direct (${reading.sensorModelName || reading.device}) : ${reading.glucose} ${currentUnit}.`,
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        title: 'Échec de lecture du capteur',
        description: err?.message || 'Impossible de contacter la passerelle du capteur.',
        hint: 'Vérifiez la connexion Internet, l’URL Nightscout ou réalisez un contrôle capillaire manuel.',
      });
    } finally {
      setIsReading(false);
    }
  };

  const handleSaveSettings = () => {
    const daysMap: Record<string, number> = {
      linx: 15,
      syai: 14,
      sibionics: 14,
      freestyle: 14,
      dexcom: 10,
      nightscout: 14,
      simulator: 14,
    };
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
      linxSerialNumber,
      linxBridgeMode,
      linxCloudEmail,
      linxCloudPassword,
      syaiSerialNumber,
      syaiBridgeMode,
      syaiEmail,
      syaiPassword,
      sibionicsSerialNumber,
      isConnected: true,
      lastSync: new Date().toISOString(),
      sensorExpiryDays: daysMap[selectedDevice] || 14,
    };
    if (onUpdateConfig) onUpdateConfig(newConfig);
    if (onSaveConfig) onSaveConfig(newConfig);
    saveCGMConfig(newConfig);
    setSyncStatus({
      type: 'success',
      title: 'Configuration enregistrée',
      description: 'Paramètres du capteur CGM et connecteurs mis à jour avec succès.',
    });
    setTimeout(() => setSyncStatus(null), 4000);
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
        <div className="flex border-b border-slate-100 px-4 pt-3 bg-slate-50 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Glycémie Directe & Courbe
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
            <span>Test BLE & NFC Physique</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Connecteurs Cloud
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {syncStatus && (
            <div
              className={`p-3.5 rounded-2xl border text-xs animate-in fade-in transition-all relative ${
                syncStatus.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : syncStatus.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : syncStatus.type === 'info'
                  ? 'bg-sky-50 border-sky-200 text-sky-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">
                  {syncStatus.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : syncStatus.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : syncStatus.type === 'info' ? (
                    <Info className="w-5 h-5 text-sky-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-5">
                  <h5 className="font-black text-xs leading-snug">{syncStatus.title}</h5>
                  <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">{syncStatus.description}</p>
                  {syncStatus.hint && (
                    <div className="mt-2 pt-1.5 border-t border-current/15 flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{syncStatus.hint}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSyncStatus(null)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-colors cursor-pointer"
                  aria-label="Fermer l'alerte"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'status' ? (
            <div className="space-y-4">
              {/* Carte lecteur instantané */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    {selectedDevice === 'syai'
                      ? 'Syai Tag CGMS (Syai Health - BLE Smart)'
                      : selectedDevice === 'linx'
                      ? 'LinX CGMS (MicroTech - BLE 1-min)'
                      : selectedDevice === 'sibionics'
                      ? 'Sibionics GS1 (SiBio Bluetooth)'
                      : selectedDevice === 'freestyle'
                      ? 'FreeStyle LibreLinkUp Direct'
                      : selectedDevice === 'dexcom'
                      ? 'Dexcom Share Cloud'
                      : selectedDevice === 'nightscout'
                      ? 'Nightscout Rest API'
                      : 'Simulateur Haute-Fidélité'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentReading ? 'Lecture continue active' : 'En veille'}
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

                    <div className="text-center mt-2 flex flex-wrap items-center justify-center gap-1.5">
                      {currentReading.isSimulation ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Mode Démo / Simulation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Mesure Réelle Directe
                        </span>
                      )}
                      <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-medium">
                        Tendance : {getTrendText(currentReading.trend)}
                      </span>
                      {currentReading.errorMessage && (
                        <div className="w-full mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 flex items-center justify-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{currentReading.errorMessage}</span>
                        </div>
                      )}
                      {currentReading.mardScore && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          MARD : {currentReading.mardScore}
                        </span>
                      )}
                      {selectedDevice === 'linx' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-semibold border border-blue-400/30">
                          Étanche IP68 • Flux 1-min
                        </span>
                      )}
                      {selectedDevice === 'syai' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-semibold border border-amber-400/30">
                          Poids 1.2g • Calibré d'usine
                        </span>
                      )}
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
                        Capteur : {currentReading.sensorExpiryDays || (selectedDevice === 'linx' ? 15 : 14)} jours restants
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        N° Série : {currentReading.sensorSerialNumber || (selectedDevice === 'linx' ? linxSerialNumber : selectedDevice === 'syai' ? syaiSerialNumber : 'SN-7842')}
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
          ) : activeTab === 'hardware' ? (
            <div className="space-y-4">
              {/* Hardware Diagnostic Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-slate-600" />
                    Diagnostic Matériel du Navigateur
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">APIs Physiques W3C</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Web Bluetooth</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hardwareSupport.bluetoothSupported
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {hardwareSupport.bluetoothSupported ? 'Actif' : 'Émulé'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Web NFC</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hardwareSupport.nfcSupported
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {hardwareSupport.nfcSupported ? 'Actif' : 'Émulé'}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Prise en charge native des capteurs chinois LinX CGM et Syai Tag via Web Bluetooth Low Energy direct ou émulation certifiée.
                </p>
              </div>

              {/* Syai Tag (Syai Health) CGMS Section */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Syai Tag CGMS (Syai Health)</h4>
                      <p className="text-[10px] text-amber-200/80">
                        Bluetooth Smart • Ultra-léger 1.2g • MARD 8.1%
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    14 Jours • Usine
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Connexion sans fil directe au capteur Syai Tag en Bluetooth Smart. Mesure continue sans calibrage capillaire.
                </p>

                <button
                  type="button"
                  onClick={handleConnectSyai}
                  disabled={isSyaiScanning}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Bluetooth className={`w-4 h-4 ${isSyaiScanning ? 'animate-pulse text-amber-200' : ''}`} />
                  <span>{isSyaiScanning ? 'Connexion au Syai Tag en cours...' : 'Appairer & Lire Syai Tag (Bluetooth Smart)'}</span>
                </button>

                {syaiResult && syaiResult.success && syaiResult.glucoseValue && (
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {syaiResult.deviceName} ({syaiResult.serialNumber})
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(syaiResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{syaiResult.glucoseValue}</span>
                        <span className="text-xs text-amber-200 font-semibold">{syaiResult.unit}</span>
                        <span className="text-[10px] text-emerald-300 ml-1 font-bold">MARD {syaiResult.mardScore}</span>
                      </div>

                      {onApplyReading && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyReading(syaiResult.glucoseValue!);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Injecter au repas</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                      <span>Batterie : {syaiResult.batteryLevel}% • 14j restants</span>
                      <span className="text-amber-300 font-medium">{syaiResult.specsHighlight}</span>
                    </div>
                  </div>
                )}

                {syaiResult && !syaiResult.success && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-white space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold block text-rose-200">Échec d'appairage Syai Tag</span>
                        <span className="text-[11px] text-rose-100/90 leading-tight">{syaiResult.message}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] text-slate-300 space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Que faire en cas d'échec ?
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        <li>Vérifiez que le Bluetooth est activé sur votre ordinateur ou smartphone.</li>
                        <li>Rapprochez le capteur Syai Tag à moins de 50 cm.</li>
                        <li>S'il s'agit d'un nouveau capteur, assurez-vous qu'il a été activé.</li>
                        <li>En cas de doute, mesurez votre glycémie au doigt et saisissez-la manuellement.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* LinX CGMS (MicroTech / AiDEX) Section */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 text-white shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">LinX CGMS (MicroTech Medical / AiDEX)</h4>
                      <p className="text-[10px] text-cyan-200/80">
                        Flux continu 1 minute • Étanche IP68 • 15 Jours
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                    IP68 • 15j
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Capture minute par minute en Bluetooth LE direct sans passerelle supplémentaire. 1440 lectures glycémiques par 24h.
                </p>

                <button
                  type="button"
                  onClick={handleConnectLinx}
                  disabled={isLinxScanning}
                  className="w-full py-2.5 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Bluetooth className={`w-4 h-4 ${isLinxScanning ? 'animate-pulse text-cyan-200' : ''}`} />
                  <span>{isLinxScanning ? 'Recherche du capteur LinX CGM...' : 'Appairer & Lire LinX CGM (Flux continu 1-min)'}</span>
                </button>

                {linxResult && linxResult.success && linxResult.glucoseValue && (
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {linxResult.deviceName} ({linxResult.serialNumber})
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(linxResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{linxResult.glucoseValue}</span>
                        <span className="text-xs text-cyan-200 font-semibold">{linxResult.unit}</span>
                        <span className="text-[10px] text-emerald-300 ml-1 font-bold">MARD {linxResult.mardScore}</span>
                      </div>

                      {onApplyReading && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyReading(linxResult.glucoseValue!);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Injecter au repas</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                      <span>Batterie : {linxResult.batteryLevel}% • 15j d'autonomie</span>
                      <span className="text-cyan-300 font-medium">{linxResult.specsHighlight}</span>
                    </div>
                  </div>
                )}

                {linxResult && !linxResult.success && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-white space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold block text-rose-200">Échec d'appairage LinX CGM</span>
                        <span className="text-[11px] text-rose-100/90 leading-tight">{linxResult.message}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] text-slate-300 space-y-1.5">
                      <div className="font-bold text-cyan-300 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Diagnostic & Guide LinX CGM :
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        <li>
                          <strong className="text-white">Liaison exclusive mobile :</strong> Si votre capteur LinX est connecté à son application officielle sur smartphone (AiDEX / LinX), il n'est plus découvrable en Bluetooth (connexion 1-à-1 exclusive).
                        </li>
                        <li>
                          <strong className="text-cyan-300">Solution recommandée :</strong> Utilisez l'onglet <span className="font-semibold text-white">Nightscout</span> dans GlucoMeal.ai si vous poussez vos données via xDrip+ ou le cloud.
                        </li>
                        <li>
                          <strong className="text-white">Test direct :</strong> Désactivez temporairement le Bluetooth de votre smartphone pour vérifier si le capteur diffuse en mode découvrable.
                        </li>
                        <li>
                          <strong className="text-amber-200">Alternative sécurisée :</strong> Vous pouvez saisir directement votre glycémie dans l'écran principal pour le calcul du bolus.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Bluetooth LE Section */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
                      <Bluetooth className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Lecteur Glycémique Bluetooth LE</h4>
                      <p className="text-[10px] text-slate-300">
                        Profil Bluetooth SIG Glucose (GATT 0x1808 / 0x2A18)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-200">
                    Contour / Accu-Chek / OneTouch
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Connectez directement votre lecteur capillaire connecté. La mesure de glycémie sera lue sans aucune saisie manuelle.
                </p>

                <button
                  type="button"
                  onClick={handleConnectBle}
                  disabled={isBleScanning}
                  className="w-full py-2.5 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Bluetooth className={`w-4 h-4 ${isBleScanning ? 'animate-pulse text-cyan-200' : ''}`} />
                  <span>{isBleScanning ? 'Recherche d’appareils Bluetooth LE en cours...' : 'Appairer & Lire lecteur Bluetooth LE'}</span>
                </button>

                {bleResult && bleResult.success && bleResult.glucoseValue && (
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/15 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {bleResult.deviceName}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(bleResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{bleResult.glucoseValue}</span>
                        <span className="text-xs text-slate-300 font-semibold">{bleResult.unit}</span>
                      </div>

                      {onApplyReading && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyReading(bleResult.glucoseValue!);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Injecter au repas</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {bleResult && !bleResult.success && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-white space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold block text-rose-200">Échec de connexion Bluetooth</span>
                        <span className="text-[11px] text-rose-100/90 leading-tight">{bleResult.message}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] text-slate-300 space-y-1">
                      <div className="font-bold text-cyan-300 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Vérifications recommandées :
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        <li>Allumez votre lecteur capillaire (Contour Next, Accu-Chek...) en mode Bluetooth.</li>
                        <li>Assurez-vous que le Bluetooth est activé sur votre appareil.</li>
                        <li>Si le lecteur est déjà connecté à une autre application, déconnectez-la temporairement.</li>
                        <li>La saisie manuelle de glycémie reste accessible à tout instant.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* NFC Sensor Scan Section */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Capteur FreeStyle Libre NFC</h4>
                      <p className="text-[10px] text-slate-500">
                        Puce NFC intégrée (NDEF Tag ISO 15693)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Scan direct
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Approchez le haut de votre smartphone du capteur FreeStyle Libre appliqué sur le bras pour déclencher le scan NFC instantané.
                </p>

                <button
                  type="button"
                  onClick={handleScanNfc}
                  disabled={isNfcScanning}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Scan className={`w-4 h-4 ${isNfcScanning ? 'animate-spin' : ''}`} />
                  <span>{isNfcScanning ? 'Approchez le téléphone du capteur (Scan NFC actif)...' : 'Scanner le capteur par NFC'}</span>
                </button>

                {nfcResult && nfcResult.success && nfcResult.glucoseValue && (
                  <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-900 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {nfcResult.sensorType}
                      </span>
                      <span className="text-emerald-700 text-[10px]">
                        S/N: {nfcResult.serialNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-emerald-950">{nfcResult.glucoseValue}</span>
                        <span className="text-xs text-emerald-800 font-semibold">{nfcResult.unit}</span>
                      </div>

                      {onApplyReading && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyReading(nfcResult.glucoseValue!);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Injecter au repas</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {nfcResult && !nfcResult.success && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-rose-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="flex-1 text-xs">
                        <span className="font-extrabold block text-rose-900">Échec du scan NFC</span>
                        <span className="text-[11px] text-rose-800 leading-tight">{nfcResult.message}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-rose-200/70 text-[10px] text-slate-700 space-y-1">
                      <div className="font-bold text-rose-900 flex items-center gap-1">
                        <Info className="w-3 h-3 text-rose-600" /> Conseils pour réussir le scan :
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        <li>Plaquez le haut du smartphone directement contre le capteur FreeStyle Libre.</li>
                        <li>Maintenez le contact pendant 2 à 3 secondes jusqu'à la détection.</li>
                        <li>Vérifiez que le capteur NFC est activé dans les réglages de votre smartphone.</li>
                        <li>Si le scan échoue de façon répétée, utilisez votre lecteur physique dédié.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical note */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Fiabilité clinique :</strong> Les mesures obtenues via Bluetooth ou NFC alimentent directement le calcul du bolus de correction ITF sans risque d'erreur humaine de recopie.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Choix du type de capteur */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Sélectionnez votre système de mesure continue (CGM) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'syai', label: 'Syai Tag CGMS', sub: 'Syai Health • BLE Smart • 1.2g', icon: Tag, badge: 'Recommandé' },
                    { id: 'linx', label: 'LinX CGMS', sub: 'MicroTech / AiDEX • IP68 • 15j', icon: Radio, badge: 'Haute Précision' },
                    { id: 'sibionics', label: 'Sibionics GS1', sub: 'SiBio • 14j sans calibration', icon: Activity, badge: 'Supporté' },
                    { id: 'freestyle', label: 'FreeStyle Libre 2 / 3', sub: 'LibreLinkUp Cloud & Scan NFC', icon: Smartphone },
                    { id: 'dexcom', label: 'Dexcom G6 / G7 / ONE', sub: 'Dexcom Share API Cloud', icon: Smartphone },
                    { id: 'nightscout', label: 'Nightscout Open API', sub: 'Serveur personnel / xDrip+', icon: Server },
                    { id: 'simulator', label: 'Simulateur Clinique', sub: 'Banc d’essai virtuel', icon: Cpu },
                  ].map((dev) => {
                    const Icon = dev.icon;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => setSelectedDevice(dev.id as any)}
                        className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                          selectedDevice === dev.id
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                          <div>
                            <span className="block text-xs">{dev.label}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{dev.sub}</span>
                          </div>
                        </div>
                        {dev.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                            {dev.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Syai Tag CGMS Configuration Panel */}
              {selectedDevice === 'syai' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      Configuration Syai Tag CGMS (Syai Health)
                    </span>
                    <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      MARD 8.1%
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mode de communication Syai Tag :
                    </label>
                    <select
                      value={syaiBridgeMode}
                      onChange={(e) => setSyaiBridgeMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white cursor-pointer"
                    >
                      <option value="ble_smart">Bluetooth Smart Direct (Sans intermédiaire Cloud, Web BLE)</option>
                      <option value="syai_cloud">Syai Link Cloud (Synchronisation cloud Syai Health)</option>
                      <option value="nightscout_bridge">Passerelle locale xDrip+ / Nightscout Bridge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Numéro de série du capteur Syai Tag :
                    </label>
                    <input
                      type="text"
                      placeholder="ST-409182"
                      value={syaiSerialNumber}
                      onChange={(e) => setSyaiSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Inscrit sur l'applicateur ou détecté lors du premier appairage Bluetooth Smart.
                    </span>
                  </div>

                  {syaiBridgeMode === 'syai_cloud' && (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Email du compte Syai Health :
                        </label>
                        <input
                          type="email"
                          placeholder="patient@syaihealth.com"
                          value={syaiEmail}
                          onChange={(e) => setSyaiEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Mot de passe :
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={syaiPassword}
                          onChange={(e) => setSyaiPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white"
                        />
                      </div>
                    </>
                  )}

                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-[10px] text-amber-950 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      Avantages du Syai Tag :
                    </p>
                    <p className="text-slate-700 leading-tight">
                      Poids plume 1.2 g (format pièce de monnaie), précision clinique MARD 8.1%, étanche IP28, 14 jours d'autonomie sans aucune piqûre de calibrage.
                    </p>
                  </div>
                </div>
              )}

              {/* LinX CGMS Configuration Panel */}
              {selectedDevice === 'linx' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-950">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-700" />
                      Configuration LinX CGMS (MicroTech / AiDEX)
                    </span>
                    <span className="text-[10px] bg-cyan-200/60 text-cyan-900 px-2 py-0.5 rounded-full font-bold">
                      IP68 • 15 Jours
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mode de communication LinX :
                    </label>
                    <select
                      value={linxBridgeMode}
                      onChange={(e) => setLinxBridgeMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-cyan-500 bg-white cursor-pointer"
                    >
                      <option value="ble_direct">Flux BLE Direct 1-Minute (1440 mesures/jour, sans cloud)</option>
                      <option value="linx_cloud">LinX / AiDEX Cloud Service (Passerelle MicroTech)</option>
                      <option value="nightscout_bridge">Passerelle locale xDrip+ / Nightscout Bridge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Numéro de série du transmetteur LinX :
                    </label>
                    <input
                      type="text"
                      placeholder="LX-883920"
                      value={linxSerialNumber}
                      onChange={(e) => setLinxSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-cyan-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Identifiant gravé sur le transmetteur réutilisable ou le capteur LinX.
                    </span>
                  </div>

                  {linxBridgeMode === 'linx_cloud' && (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Email MicroTech / LinX :
                        </label>
                        <input
                          type="email"
                          placeholder="patient@microtechmd.com"
                          value={linxCloudEmail}
                          onChange={(e) => setLinxCloudEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-cyan-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Mot de passe :
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={linxCloudPassword}
                          onChange={(e) => setLinxCloudPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-cyan-500 bg-white"
                        />
                      </div>
                    </>
                  )}

                  <div className="p-2.5 rounded-xl bg-white/80 border border-cyan-200/80 text-[10px] text-cyan-950 space-y-1">
                    <p className="font-bold flex items-center gap-1 text-cyan-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                      Avantages du LinX CGMS :
                    </p>
                    <p className="text-slate-700 leading-tight">
                      Résistance à l'eau IP68 (bain, natation prolongée), 15 jours de suivi ininterrompu, transmission Bluetooth haute fréquence chaque minute, MARD 8.9%.
                    </p>
                  </div>
                </div>
              )}

              {/* Sibionics GS1 Configuration Panel */}
              {selectedDevice === 'sibionics' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-700" />
                      Configuration Sibionics GS1 (SiBio)
                    </span>
                    <span className="text-[10px] bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      14 Jours • MARD 8.8%
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Numéro de série du capteur SiBio :
                    </label>
                    <input
                      type="text"
                      placeholder="SB-118274"
                      value={sibionicsSerialNumber}
                      onChange={(e) => setSibionicsSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 bg-white"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-purple-200/80 text-[10px] text-slate-700">
                    Capteur continu 14 jours sans calibration par piqûre, compatible transmission Bluetooth Low Energy directe et diffusion locale.
                  </div>
                </div>
              )}

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

                  <button
                    type="button"
                    onClick={async () => {
                      handleSaveSettings();
                      setActiveTab('status');
                      await handleReadSensor();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Tester & Lire la glycémie Nightscout en direct</span>
                  </button>
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
