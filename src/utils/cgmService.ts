import { CGMConfig, CGMReading, AnalyzedMeal } from '../types';
import { loadSavedMeals, saveMeals, interpretGlucoseInput } from './storage';
import { readLatestGlucoseRecord } from './bleGlucose';

export type { CGMConfig };

const STORAGE_KEYS = {
  CGM_CONFIG: 'glucomal_cgm_config_v1',
};

export const DEFAULT_CGM_CONFIG: CGMConfig = {
  deviceType: 'freestyle',
  isConnected: false,
  nightscoutUrl: '',
  apiKey: '',
  lastSync: undefined,
};

/**
 * Charge la configuration CGM
 */
export function loadCGMConfig(): CGMConfig {
  if (typeof window === 'undefined') return DEFAULT_CGM_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CGM_CONFIG);
    if (!raw) {
      return DEFAULT_CGM_CONFIG;
    }
    const parsed = JSON.parse(raw);
    // Purge de l'ancienne URL de démonstration fictive
    if (parsed && parsed.nightscoutUrl === 'https://monsite-nightscout.herokuapp.com') {
      parsed.nightscoutUrl = '';
      parsed.apiKey = '';
      parsed.isConnected = false;
      saveCGMConfig(parsed);
    }
    return { ...DEFAULT_CGM_CONFIG, ...parsed };
  } catch (err) {
    console.error('Erreur lecture config CGM:', err);
    return DEFAULT_CGM_CONFIG;
  }
}

/**
 * Sauvegarde la configuration CGM
 */
export function saveCGMConfig(config: CGMConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CGM_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Erreur sauvegarde config CGM:', err);
  }
}

// Au-delà de cet âge, une mesure ne doit plus servir à calculer une correction d'insuline
export const MAX_READING_AGE_MINUTES = 15;

/**
 * Âge d'une mesure en minutes (null si l'horodatage est absent ou invalide).
 */
export function getReadingAgeMinutes(timestampMs: number | undefined, now: number = Date.now()): number | null {
  if (typeof timestampMs !== 'number' || !Number.isFinite(timestampMs)) return null;
  return Math.round((now - timestampMs) / 60000);
}

/**
 * Refuse une mesure trop ancienne (capteur déconnecté, lecteur avec une mesure du matin…)
 * ou sans horodatage fiable.
 */
export function assertFreshReading(timestampMs: number | undefined, sourceLabel: string, now: number = Date.now()): number {
  const age = getReadingAgeMinutes(timestampMs, now);
  if (age === null) {
    throw new Error(`${sourceLabel} : mesure sans horodatage fiable. Mesurez au glucomètre et saisissez la valeur.`);
  }
  if (age > MAX_READING_AGE_MINUTES) {
    throw new Error(
      `${sourceLabel} : dernière mesure datant de ${age} min (maximum ${MAX_READING_AGE_MINUTES} min). Elle est trop ancienne pour calculer un bolus : mesurez au glucomètre et saisissez la valeur.`
    );
  }
  if (age < -5) {
    throw new Error(`${sourceLabel} : horodatage de la mesure dans le futur (horloge de l'appareil ?). Saisissez la valeur manuellement.`);
  }
  return Math.max(0, age);
}

/**
 * Lit la dernière mesure d'un appareil Bluetooth (profil Glucose standard) et vérifie qu'elle est récente.
 */
async function readFreshBleGlucose(
  server: any,
  label: string
): Promise<{ mgdl: number; time: Date } | { error: string }> {
  try {
    const record = await readLatestGlucoseRecord(server);
    assertFreshReading(record.time?.getTime(), label);
    if (record.mgdl < 20 || record.mgdl > 600) {
      return { error: `${label} : valeur hors plage mesurable (${record.mgdl} mg/dL).` };
    }
    return { mgdl: record.mgdl, time: record.time! };
  } catch (err: any) {
    return { error: err?.message || `${label} : lecture impossible.` };
  }
}

// Jeton d'accès Nightscout (ex. « lecture-1a2b3c4d5e6f7a8b ») : nom du sujet + 16 caractères hexadécimaux
const NIGHTSCOUT_TOKEN_PATTERN = /^[a-z0-9_.-]+-[0-9a-f]{16}$/i;

export function isNightscoutAccessToken(value: string): boolean {
  return NIGHTSCOUT_TOKEN_PATTERN.test(value.trim());
}

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Authentification Nightscout :
 * - jeton d'accès en lecture seule (recommandé) : passé en paramètre « token » ;
 * - API_SECRET (accès administrateur, déconseillé) : envoyé sous forme d'empreinte SHA-1,
 *   comme l'exige Nightscout, jamais en clair.
 */
export async function buildNightscoutAuth(
  credential: string | undefined
): Promise<{ query: string; headers: Record<string, string> }> {
  const value = credential?.trim();
  if (!value || value === '********') return { query: '', headers: {} };
  if (isNightscoutAccessToken(value)) {
    return { query: `&token=${encodeURIComponent(value)}`, headers: {} };
  }
  return { query: '', headers: { 'api-secret': await sha1Hex(value) } };
}

/**
 * Interroge l'API REST standard de Nightscout (/api/v1/entries/sgv.json)
 */
export async function fetchNightscoutReading(
  config: CGMConfig,
  unit: 'g/L' | 'mg/dL' = 'g/L',
  now: number = Date.now()
): Promise<CGMReading> {
  const rawUrl = config.nightscoutUrl?.trim();
  if (!rawUrl) {
    throw new Error("URL Nightscout non renseignée.");
  }
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  const auth = await buildNightscoutAuth(config.apiKey);
  const apiUrl = `${cleanUrl}/api/v1/entries/sgv.json?count=12${auth.query}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: { Accept: 'application/json', ...auth.headers },
  });

  if (!response.ok) {
    throw new Error(`Serveur Nightscout HTTP ${response.status}: ${response.statusText}`);
  }

  const entries: any[] = await response.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("Aucune mesure de glycémie disponible sur le serveur Nightscout.");
  }

  const latest = entries[0];
  if (!latest || typeof latest.sgv !== 'number') {
    throw new Error("La dernière mesure Nightscout est invalide ou ne contient pas de valeur glycémique SGV réelle.");
  }
  const readingTime =
    typeof latest.date === 'number' ? latest.date : latest.dateString ? Date.parse(latest.dateString) : undefined;
  const ageMinutes = assertFreshReading(readingTime, 'Nightscout', now);

  const rawSgv = latest.sgv;
  const glucose = unit === 'g/L' ? Number((rawSgv / 100).toFixed(2)) : Math.round(rawSgv);

  // Direction vers trend standardisée
  const dir = String(latest.direction || '').toLowerCase();
  let trend: CGMReading['trend'] = 'flat';
  if (dir.includes('doubleup') || dir.includes('singleup')) {
    trend = 'up_fast';
  } else if (dir.includes('fortyfiveup') || dir.includes('up')) {
    trend = 'up_slow';
  } else if (dir.includes('doubledown') || dir.includes('singledown')) {
    trend = 'down_fast';
  } else if (dir.includes('fortyfivedown') || dir.includes('down')) {
    trend = 'down_slow';
  }

  // Sparkline chronologique (du plus ancien au plus récent)
  const sortedEntries = [...entries].reverse();
  const recentSparkline = sortedEntries
    .filter((e) => typeof e.sgv === 'number')
    .map((e) => {
      const d = new Date(e.date || e.dateString || now);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return {
        time: `${hours}:${minutes}`,
        value: unit === 'g/L' ? Number((e.sgv / 100).toFixed(2)) : Math.round(e.sgv),
      };
    });

  // Seules les informations réellement fournies par Nightscout sont renvoyées (aucune valeur inventée)
  return {
    glucose,
    unit,
    trend,
    timestamp: new Date(readingTime!).toISOString(),
    ageMinutes,
    device: 'nightscout',
    sensorExpiryDays: config.sensorExpiryDays,
    sensorSerialNumber: config.sensorSerialNumber || latest.device,
    sensorModelName: latest.device ? `Nightscout (${latest.device})` : 'Nightscout',
    recentSparkline,
    isSimulation: false,
    source: 'nightscout_live',
  };
}

/**
 * Lit la glycémie actuelle depuis le capteur CGM (ou passerelle Nightscout / BLE / Cloud)
 * Règle stricte : AUCUNE simulation ni valeur inventée. Soit la lecture réelle exacte, soit une erreur.
 */
export async function fetchCurrentCGMReading(
  config: CGMConfig,
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<CGMReading> {
  // 1. Si Nightscout est sélectionné (ou si LinX/Syai utilise la passerelle Nightscout)
  const isNightscoutSelected =
    config.deviceType === 'nightscout' ||
    (config.deviceType === 'linx' && config.linxBridgeMode === 'nightscout_bridge') ||
    (config.deviceType === 'syai' && config.syaiBridgeMode === 'nightscout_bridge');

  if (isNightscoutSelected) {
    if (config.nightscoutUrl && config.nightscoutUrl.trim().startsWith('http')) {
      return await fetchNightscoutReading(config, unit);
    }
    throw new Error("URL Nightscout non configurée. Aucune simulation autorisée : veuillez renseigner l'adresse de votre serveur Nightscout ou saisir votre glycémie manuellement.");
  }

  // 2. Capteurs chinois (LinX, Syai, Sibionics)
  if (config.deviceType === 'linx') {
    throw new Error("Capteur LinX CGM non synchronisé : aucune mesure réelle reçue. Connectez le transmetteur ou utilisez la passerelle Nightscout/xDrip+. Aucune simulation autorisée.");
  }

  if (config.deviceType === 'syai') {
    throw new Error("Capteur Syai Tag non synchronisé : aucune mesure réelle reçue. Appairez le capteur via Bluetooth Smart ou utilisez la passerelle Nightscout. Aucune simulation autorisée.");
  }

  if (config.deviceType === 'sibionics') {
    throw new Error("Capteur Sibionics GS1 non synchronisé. Aucune donnée simulée autorisée : saisissez votre glycémie manuellement.");
  }

  // 3. FreeStyle Libre & Dexcom
  if (config.deviceType === 'freestyle') {
    throw new Error("Capteur FreeStyle Libre : scannez le capteur via NFC ou connectez votre compte LibreLinkUp. Aucune simulation autorisée.");
  }

  if (config.deviceType === 'dexcom') {
    throw new Error("Capteur Dexcom : connectez votre passerelle Dexcom Share ou Nightscout. Aucune simulation autorisée.");
  }

  throw new Error("Aucun capteur CGM connecté. Aucune donnée simulée n'est autorisée : saisissez votre glycémie manuellement pour calculer votre bolus.");
}

/**
 * Évalue la glycémie post-prandiale (+2h) par rapport à la cible thérapeutique
 */
export function evaluatePostPrandialResult(
  postPrandialGlucose: number,
  targetGlucose: number | any,
  unit: 'g/L' | 'mg/dL' = 'g/L'
): {
  status: 'target' | 'hyper' | 'hypo';
  badgeLabel: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  deltaLabel: string;
  clinicalAdvice: string;
} {
  const isGL = unit === 'g/L';
  const hypoThreshold = isGL ? 0.70 : 70;
  const targetTolerance = isGL ? 0.40 : 40; // post-prandiale normale jusqu'à cible + 0.40 g/L (ex: 1.40 g/L)

  // Normalisation défensive : immunité absolue contre les objets (ex: userProfile) ou NaN
  const cleanTarget =
    typeof targetGlucose === 'number' && !isNaN(targetGlucose) && targetGlucose > 0
      ? targetGlucose
      : (typeof targetGlucose === 'object' && targetGlucose !== null && typeof targetGlucose.targetGlucose === 'number'
          ? targetGlucose.targetGlucose
          : (isGL ? 1.0 : 100));

  // Aucune valeur par défaut : une mesure invalide ne doit jamais être classée « dans la cible »
  if (typeof postPrandialGlucose !== 'number' || !Number.isFinite(postPrandialGlucose) || postPrandialGlucose <= 0) {
    throw new Error('Glycémie post-prandiale invalide.');
  }
  const cleanGlucose = postPrandialGlucose;

  const delta = Number((cleanGlucose - cleanTarget).toFixed(2));

  if (cleanGlucose < hypoThreshold) {
    return {
      status: 'hypo',
      badgeLabel: '🚨 Hypoglycémie post-prandiale',
      badgeColor: 'rose',
      deltaLabel: `${delta > 0 ? '+' : ''}${delta} ${unit}`,
      clinicalAdvice:
        'Resucrage rapide (15g de sucre) nécessaire. Risque de sur-estimation glucidique ou ratio Insuline:Glucides trop fort.',
    };
  }

  if (cleanGlucose <= cleanTarget + targetTolerance) {
    return {
      status: 'target',
      badgeLabel: '🎯 Cible atteinte (Bolus optimal)',
      badgeColor: 'emerald',
      deltaLabel: `${delta > 0 ? '+' : ''}${delta} ${unit}`,
      clinicalAdvice:
        'Excellente adéquation du calcul glucidique et du bolus administré. Ratio validé pour ce type de repas.',
    };
  }

  return {
    status: 'hyper',
    badgeLabel: '⚠️ Hyperglycémie post-prandiale',
    badgeColor: 'amber',
    deltaLabel: `+${delta} ${unit}`,
    clinicalAdvice:
      'Élévation glycémique excessive. Vérifier si un ingrédient a été sous-pesé ou si ce repas nécessite un pré-bolus de 15 min ou un ratio plus adapté.',
  };
}

/**
 * Met à jour la glycémie post-prandiale (+2h) d'un repas dans l'historique
 */
export function savePostPrandialMeasurement(
  mealId: string,
  glucoseValue: number,
  targetGlucose: number | any = 1.0,
  unit: 'g/L' | 'mg/dL' = 'g/L'
): AnalyzedMeal[] {
  // Sécurisation si le 3e paramètre transmis est un objet UserProfileDT1
  let safeTarget = targetGlucose;
  let safeUnit = unit;
  if (typeof targetGlucose === 'object' && targetGlucose !== null) {
    safeTarget = targetGlucose.targetGlucose || (targetGlucose.glucoseUnit === 'mg/dL' ? 100 : 1.0);
    safeUnit = targetGlucose.glucoseUnit || unit;
  }

  const meals = loadSavedMeals();
  // Même normalisation que la glycémie pré-prandiale (« 65 » dans un profil g/L = 0.65 g/L)
  const interpreted = interpretGlucoseInput(glucoseValue, safeUnit);
  if (interpreted.status !== 'ok') {
    throw new Error(`Glycémie post-prandiale (${glucoseValue}) ininterprétable en ${safeUnit}.`);
  }
  const normalizedGlucose = interpreted.value;
  const evaluation = evaluatePostPrandialResult(normalizedGlucose, safeTarget, safeUnit);

  const updatedMeals = meals.map((m) => {
    if (m.id === mealId) {
      return {
        ...m,
        post_prandial_glucose: normalizedGlucose,
        post_prandial_unit: safeUnit,
        post_prandial_timestamp: new Date().toISOString(),
        post_prandial_evaluation: evaluation.status,
      };
    }
    return m;
  });

  saveMeals(updatedMeals);
  return updatedMeals;
}

export interface HardwareSupportStatus {
  bluetoothSupported: boolean;
  nfcSupported: boolean;
  notes: string[];
}

export function checkHardwareSupport(): HardwareSupportStatus {
  const isClient = typeof window !== 'undefined';
  const bluetoothSupported =
    isClient &&
    'bluetooth' in navigator &&
    typeof (navigator as any).bluetooth?.requestDevice === 'function';
  const nfcSupported = isClient && 'NDEFReader' in window;

  const notes: string[] = [];
  if (!bluetoothSupported) {
    notes.push('Web Bluetooth non supporté (Chrome/Edge sur Android ou PC/Mac requis).');
  }
  if (!nfcSupported) {
    notes.push('Web NFC non supporté (Chrome Android avec capteur NFC actif requis).');
  }
  return { bluetoothSupported, nfcSupported, notes };
}

export interface BluetoothConnectionResult {
  success: boolean;
  deviceName?: string;
  glucoseValue?: number;
  unit: 'g/L' | 'mg/dL';
  timestamp: string;
  source: 'bluetooth_real' | 'bluetooth_simulated';
  isSimulation?: boolean;
  message: string;
}

export interface ChineseCGMConnectionResult {
  success: boolean;
  brand: 'linx' | 'syai' | 'sibionics';
  modelName: string;
  deviceName: string;
  // Métadonnées réellement lues sur le capteur uniquement (jamais de valeur inventée)
  serialNumber?: string;
  glucoseValue?: number;
  unit: 'g/L' | 'mg/dL';
  trend?: 'flat' | 'up_slow' | 'up_fast' | 'down_slow' | 'down_fast';
  timestamp: string;
  // Caractéristiques du fabricant (durée de vie nominale), pas une mesure
  sensorExpiryDays: number;
  mardScore?: string;
  batteryLevel?: number;
  samplingInterval: string;
  specsHighlight: string;
  source: 'bluetooth_real' | 'bluetooth_simulated';
  isSimulation?: boolean;
  message: string;
}

export async function connectBluetoothGlucoseMeter(
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<BluetoothConnectionResult> {
  const isClient = typeof window !== 'undefined';
  const hasBluetooth = isClient && 'bluetooth' in navigator;

  if (hasBluetooth) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['glucose'] },
          { namePrefix: 'Contour' },
          { namePrefix: 'Accu-Chek' },
          { namePrefix: 'OneTouch' },
          { namePrefix: 'FreeStyle' },
          { namePrefix: 'Gluco' },
          { namePrefix: 'LinX' },
          { namePrefix: 'AiDEX' },
          { namePrefix: 'MicroTech' },
          { namePrefix: 'Syai' },
          { namePrefix: 'ST-' },
          { namePrefix: 'SiBio' },
        ],
        optionalServices: ['glucose', 0x1808, 'battery_service', 0x180f],
      });

      if (!device) {
        return {
          success: false,
          unit,
          timestamp: new Date().toISOString(),
          source: 'bluetooth_real',
          isSimulation: false,
          message: 'Aucun appareil Bluetooth sélectionné. Aucune simulation autorisée.',
        };
      }

      const server = await device.gatt?.connect();
      let valMgDl: number | null = null;
      let measuredAt: Date | null = null;
      let readError = '';
      if (server) {
        const result = await readFreshBleGlucose(server, device.name || 'Lecteur Bluetooth');
        if ('error' in result) {
          readError = result.error;
        } else {
          valMgDl = result.mgdl;
          measuredAt = result.time;
        }
      }

      if (valMgDl === null) {
        return {
          success: false,
          deviceName: device.name || 'Lecteur BLE',
          unit,
          timestamp: new Date().toISOString(),
          source: 'bluetooth_real',
          isSimulation: false,
          message: `Appareil ${device.name || 'BLE'} connecté, mais aucune mesure exacte n'a pu être extraite du service Bluetooth (GATT 0x1808). Aucune simulation autorisée.${readError ? ` (${readError})` : ''}`,
        };
      }

      const valGL = Number((valMgDl / 100).toFixed(2));
      const finalVal = unit === 'g/L' ? valGL : valMgDl;

      return {
        success: true,
        deviceName: device.name || 'Lecteur BLE Connecté',
        glucoseValue: finalVal,
        unit,
        timestamp: (measuredAt || new Date()).toISOString(),
        source: 'bluetooth_real',
        isSimulation: false,
        message: `Connecté à ${device.name || 'Lecteur BLE'} ! Glycémie réelle reçue : ${finalVal} ${unit}`,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
        return {
          success: false,
          unit,
          timestamp: new Date().toISOString(),
          source: 'bluetooth_real',
          isSimulation: false,
          message: 'Appairage annulé ou aucun lecteur détecté. Aucune simulation autorisée.',
        };
      }
      return {
        success: false,
        unit,
        timestamp: new Date().toISOString(),
        source: 'bluetooth_real',
        isSimulation: false,
        message: `Erreur d'accès Bluetooth : ${err?.message || 'Connexion non établie'}. Aucune simulation autorisée.`,
      };
    }
  }

  return {
    success: false,
    unit,
    timestamp: new Date().toISOString(),
    source: 'bluetooth_real',
    isSimulation: false,
    message: 'Web Bluetooth non supporté par ce navigateur (Chrome ou Edge requis). Aucune simulation autorisée.',
  };
}

/**
 * Appairage et lecture directe pour le capteur chinois LinX CGM (MicroTech / AiDEX)
 * - Transmission continue BLE minute par minute
 * - 15 jours de durée de vie capteur
 * - Résistance à l'eau IP68
 */
export async function connectLinxCGM(
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<ChineseCGMConnectionResult> {
  const isClient = typeof window !== 'undefined';
  const hasBluetooth = isClient && 'bluetooth' in navigator;

  if (hasBluetooth) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'LinX' },
          { namePrefix: 'AiDEX' },
          { namePrefix: 'MicroTech' },
          { namePrefix: 'MD-' },
          { namePrefix: 'LX-' },
        ],
        optionalServices: ['glucose', 0x1808, 0xfee0, 0xfff0, 'battery_service', 0x180f],
      });

      if (device) {
        let finalVal: number | null = null;
        let measuredAt: Date | null = null;
        let readError = '';
        try {
          const server = await device.gatt?.connect();
          if (server) {
            const result = await readFreshBleGlucose(server, 'LinX');
            if ('error' in result) {
              readError = result.error;
            } else {
              finalVal = unit === 'g/L' ? Number((result.mgdl / 100).toFixed(2)) : result.mgdl;
              measuredAt = result.time;
            }
          }
        } catch (e: any) {
          readError = e?.message || '';
          console.warn('LinX GATT direct connect info:', e);
        }

        if (finalVal !== null) {
          return {
            success: true,
            brand: 'linx',
            modelName: 'LinX CGMS (MicroTech Medical)',
            deviceName: device.name || 'LinX Sensor',
            glucoseValue: finalVal,
            unit,
            timestamp: (measuredAt || new Date()).toISOString(),
            sensorExpiryDays: 15,
            samplingInterval: '1 minute (1440 pts/jour)',
            specsHighlight: 'Étanche IP68 • 15 Jours • Transmission continue BLE',
            source: 'bluetooth_real',
            isSimulation: false,
            message: `LinX CGM connecté via BLE physique (${device.name || 'LinX'}). Glycémie réelle : ${finalVal} ${unit}`,
          };
        }

        return {
          success: false,
          brand: 'linx',
          modelName: 'LinX CGMS (MicroTech Medical)',
          deviceName: device.name || 'LinX Sensor',
          unit,
          timestamp: new Date().toISOString(),
          sensorExpiryDays: 15,
          samplingInterval: '1 minute',
          specsHighlight: 'Étanche IP68 • 15 Jours',
          source: 'bluetooth_real',
          isSimulation: false,
          message: `Capteur LinX appairé (${device.name || 'LinX'}), mais le flux propriétaire chiffré requiert la passerelle officielle LinX ou Nightscout. Aucune simulation autorisée.${readError ? ` (${readError})` : ''}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        brand: 'linx',
        modelName: 'LinX CGMS (MicroTech)',
        deviceName: 'LinX CGM Sensor',
        unit,
        timestamp: new Date().toISOString(),
        sensorExpiryDays: 15,
        samplingInterval: '1 minute',
        specsHighlight: 'Étanche IP68 • 15 Jours',
        source: 'bluetooth_real',
        isSimulation: false,
        message: 'Capteur LinX non détecté ou sélection annulée (le capteur est généralement verrouillé en liaison exclusive par son application mobile officielle). Aucune simulation autorisée.',
      };
    }
  }

  return {
    success: false,
    brand: 'linx',
    modelName: 'LinX CGMS (MicroTech)',
    deviceName: 'LinX CGM Sensor',
    unit,
    timestamp: new Date().toISOString(),
    sensorExpiryDays: 15,
    samplingInterval: '1 minute',
    specsHighlight: 'Étanche IP68 • 15 Jours',
    source: 'bluetooth_real',
    isSimulation: false,
    message: 'Web Bluetooth non supporté par ce navigateur (Chrome ou Edge requis). Aucune simulation autorisée.',
  };
}

/**
 * Appairage et lecture directe pour le capteur chinois Syai Tag (Syai Health)
 * - Format ultra-léger 1.2g pièce de monnaie
 * - Bluetooth Smart Low Energy (14 jours)
 */
export async function connectSyaiTagCGM(
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<ChineseCGMConnectionResult> {
  const isClient = typeof window !== 'undefined';
  const hasBluetooth = isClient && 'bluetooth' in navigator;

  if (hasBluetooth) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Syai' },
          { namePrefix: 'SyaiTag' },
          { namePrefix: 'ST-' },
          { namePrefix: 'SyaiHealth' },
        ],
        optionalServices: ['glucose', 0x1808, 0xffe0, 'battery_service', 0x180f],
      });

      if (device) {
        let finalVal: number | null = null;
        let measuredAt: Date | null = null;
        let readError = '';
        try {
          const server = await device.gatt?.connect();
          if (server) {
            const result = await readFreshBleGlucose(server, 'Syai Tag');
            if ('error' in result) {
              readError = result.error;
            } else {
              finalVal = unit === 'g/L' ? Number((result.mgdl / 100).toFixed(2)) : result.mgdl;
              measuredAt = result.time;
            }
          }
        } catch (e: any) {
          readError = e?.message || '';
          console.warn('Syai Tag direct connect notice:', e);
        }

        if (finalVal !== null) {
          return {
            success: true,
            brand: 'syai',
            modelName: 'Syai Tag CGMS (Syai Health)',
            deviceName: device.name || 'Syai Tag',
            glucoseValue: finalVal,
            unit,
            timestamp: (measuredAt || new Date()).toISOString(),
            sensorExpiryDays: 14,
            samplingInterval: '1 à 3 minutes',
            specsHighlight: 'Bluetooth Smart • 14 jours',
            source: 'bluetooth_real',
            isSimulation: false,
            message: `Syai Tag connecté via BLE physique (${device.name || 'Syai Tag'}). Glycémie réelle : ${finalVal} ${unit}`,
          };
        }

        return {
          success: false,
          brand: 'syai',
          modelName: 'Syai Tag CGMS (Syai Health)',
          deviceName: device.name || 'Syai Tag Sensor',
          unit,
          timestamp: new Date().toISOString(),
          sensorExpiryDays: 14,
          samplingInterval: '1-3 min',
          specsHighlight: 'Bluetooth Smart • 14 jours',
          source: 'bluetooth_real',
          isSimulation: false,
          message: `Capteur Syai Tag appairé (${device.name || 'Syai Tag'}), mais la trame propriétaire requiert la passerelle officielle Syai ou Nightscout. Aucune simulation autorisée.${readError ? ` (${readError})` : ''}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        brand: 'syai',
        modelName: 'Syai Tag CGMS (Syai Health)',
        deviceName: 'Syai Tag Sensor',
        unit,
        timestamp: new Date().toISOString(),
        sensorExpiryDays: 14,
        samplingInterval: '1-3 min',
        specsHighlight: 'Bluetooth Smart • 14 jours',
        source: 'bluetooth_real',
        isSimulation: false,
        message: 'Recherche Syai Tag annulée ou aucun capteur détecté. Aucune simulation autorisée.',
      };
    }
  }

  return {
    success: false,
    brand: 'syai',
    modelName: 'Syai Tag CGMS (Syai Health)',
    deviceName: 'Syai Tag Sensor',
    unit,
    timestamp: new Date().toISOString(),
    sensorExpiryDays: 14,
    samplingInterval: '1-3 min',
    specsHighlight: 'Bluetooth Smart • 14 jours',
    source: 'bluetooth_real',
    isSimulation: false,
    message: 'Web Bluetooth non supporté par ce navigateur (Chrome ou Edge requis). Aucune simulation autorisée.',
  };
}

export interface NFCScanResult {
  success: boolean;
  sensorType?: string;
  serialNumber?: string;
  glucoseValue?: number;
  unit: 'g/L' | 'mg/dL';
  timestamp: string;
  source: 'nfc_real' | 'nfc_simulated';
  isSimulation?: boolean;
  message: string;
}

export async function scanNFCGlucoseSensor(
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<NFCScanResult> {
  const isClient = typeof window !== 'undefined';
  const hasNFC = isClient && 'NDEFReader' in window;

  if (hasNFC) {
    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      return new Promise<NFCScanResult>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            unit,
            timestamp: new Date().toISOString(),
            source: 'nfc_real',
            isSimulation: false,
            message: 'Délai NFC écoulé sans contact capteur. Aucune simulation autorisée.',
          });
        }, 12000);

        ndef.onreading = (event: any) => {
          clearTimeout(timeout);
          const serial = event.serialNumber || 'FSL-NFC';
          resolve({
            success: false,
            sensorType: 'FreeStyle Libre (Puce NFC détectée)',
            serialNumber: serial,
            unit,
            timestamp: new Date().toISOString(),
            source: 'nfc_real',
            isSimulation: false,
            message: `Capteur NFC détecté (S/N: ${serial}), mais le protocole Abbott propriétaire nécessite l'application LibreLink ou LibreLinkUp. Aucune simulation autorisée.`,
          });
        };

        ndef.onreadingerror = () => {
          clearTimeout(timeout);
          resolve({
            success: false,
            unit,
            timestamp: new Date().toISOString(),
            source: 'nfc_real',
            isSimulation: false,
            message: 'Erreur de lecture de l’étiquette NFC. Aucune simulation autorisée.',
          });
        };
      });
    } catch (err: any) {
      return {
        success: false,
        unit,
        timestamp: new Date().toISOString(),
        source: 'nfc_real',
        isSimulation: false,
        message: `Erreur d'accès Web NFC : ${err?.message || 'Accès refusé'}. Aucune simulation autorisée.`,
      };
    }
  }

  return {
    success: false,
    unit,
    timestamp: new Date().toISOString(),
    source: 'nfc_real',
    isSimulation: false,
    message: 'Web NFC non supporté sur cet appareil (Chrome sur Android avec puce NFC active requis). Aucune simulation autorisée.',
  };
}
