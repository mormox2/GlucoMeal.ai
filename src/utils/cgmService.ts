import { CGMConfig, CGMReading, AnalyzedMeal } from '../types';
import { loadSavedMeals, saveMeals } from './storage';

export type { CGMConfig };

const STORAGE_KEYS = {
  CGM_CONFIG: 'glucomal_cgm_config_v1',
};

export const DEFAULT_CGM_CONFIG: CGMConfig = {
  deviceType: 'freestyle',
  isConnected: true,
  nightscoutUrl: 'https://monsite-nightscout.herokuapp.com',
  apiKey: '********',
  lastSync: new Date().toISOString(),
};

/**
 * Charge la configuration CGM
 */
export function loadCGMConfig(): CGMConfig {
  if (typeof window === 'undefined') return DEFAULT_CGM_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CGM_CONFIG);
    if (!raw) {
      saveCGMConfig(DEFAULT_CGM_CONFIG);
      return DEFAULT_CGM_CONFIG;
    }
    return { ...DEFAULT_CGM_CONFIG, ...JSON.parse(raw) };
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

/**
 * Lit la glycémie actuelle depuis le capteur CGM (ou passerelle LibreLinkUp / Dexcom Share / Nightscout)
 */
export async function fetchCurrentCGMReading(
  config: CGMConfig,
  unit: 'g/L' | 'mg/dL' = 'g/L'
): Promise<CGMReading> {
  // Petite pause pour simuler la requête Bluetooth LE / Cloud API Abbott-Dexcom
  await new Promise((resolve) => setTimeout(resolve, 650));

  // Valeurs de tendance réalistes
  const trends: CGMReading['trend'][] = ['flat', 'up_slow', 'up_fast', 'down_slow'];
  const randomTrend = trends[Math.floor(Math.random() * trends.length)];

  // Génération d'une glycémie réaliste (ex: 1.10 à 1.45 g/L)
  const baseValueG = Number((1.12 + (Math.random() * 0.35 - 0.1)).toFixed(2));
  const glucose = unit === 'g/L' ? baseValueG : Math.round(baseValueG * 100);

  // Génération des 12 derniers points CGM (échantillonnage 15 min sur 3h)
  const recentSparkline: { time: string; value: number }[] = [];
  const now = Date.now();
  let walkingValue = baseValueG;

  for (let i = 11; i >= 0; i--) {
    const timePoint = new Date(now - i * 15 * 60 * 1000);
    const hours = timePoint.getHours().toString().padStart(2, '0');
    const minutes = timePoint.getMinutes().toString().padStart(2, '0');
    // Petite fluctuation continue cohérente
    if (i > 0) {
      walkingValue += (Math.random() - 0.48) * 0.08;
      walkingValue = Math.max(0.8, Math.min(2.1, walkingValue));
    } else {
      walkingValue = baseValueG;
    }
    recentSparkline.push({
      time: `${hours}:${minutes}`,
      value: unit === 'g/L' ? Number(walkingValue.toFixed(2)) : Math.round(walkingValue * 100),
    });
  }

  const serialMap: Record<string, string> = {
    freestyle: 'FSL3-TN-981240',
    dexcom: 'DXG7-TN-772183',
    nightscout: 'NS-GATE-502',
    simulator: 'SIM-BLE-001',
    manual: 'MAN-001',
  };

  return {
    glucose,
    unit,
    trend: randomTrend,
    timestamp: new Date().toISOString(),
    device: config.deviceType,
    sensorExpiryDays: config.sensorExpiryDays || 8,
    sensorSerialNumber: config.sensorSerialNumber || serialMap[config.deviceType] || 'CGM-TN-001',
    recentSparkline,
  };
}

/**
 * Évalue la glycémie post-prandiale (+2h) par rapport à la cible thérapeutique
 */
export function evaluatePostPrandialResult(
  postPrandialGlucose: number,
  targetGlucose: number,
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

  const delta = Number((postPrandialGlucose - targetGlucose).toFixed(2));

  if (postPrandialGlucose < hypoThreshold) {
    return {
      status: 'hypo',
      badgeLabel: '🚨 Hypoglycémie post-prandiale',
      badgeColor: 'rose',
      deltaLabel: `${delta > 0 ? '+' : ''}${delta} ${unit}`,
      clinicalAdvice:
        'Resucrage rapide (15g de sucre) nécessaire. Risque de sur-estimation glucidique ou ratio Insuline:Glucides trop fort.',
    };
  }

  if (postPrandialGlucose <= targetGlucose + targetTolerance) {
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
  targetGlucose: number = 1.0,
  unit: 'g/L' | 'mg/dL' = 'g/L'
): AnalyzedMeal[] {
  const meals = loadSavedMeals();
  const evaluation = evaluatePostPrandialResult(glucoseValue, targetGlucose, unit);

  const updatedMeals = meals.map((m) => {
    if (m.id === mealId) {
      return {
        ...m,
        post_prandial_glucose: glucoseValue,
        post_prandial_timestamp: new Date().toISOString(),
        post_prandial_evaluation: evaluation.status,
      };
    }
    return m;
  });

  saveMeals(updatedMeals);
  return updatedMeals;
}
