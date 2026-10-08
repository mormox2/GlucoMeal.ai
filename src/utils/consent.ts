/**
 * Consentement au traitement des données de santé (RGPD art. 9, loi tunisienne n° 2004-63).
 * Version incrémentée à chaque changement substantiel de la politique : le consentement est alors redemandé.
 */
export const CONSENT_VERSION = 1;
const CONSENT_KEY = 'glucomal_consent_v1';

export interface ConsentState {
  version: number;
  acceptedAt: string;
  // Indispensable : traitement des données de santé sur l'appareil et analyse des repas par l'IA (Google Gemini)
  healthData: true;
  // Facultatif : sauvegarde et synchronisation dans le cloud (Google Firebase)
  cloudSync: boolean;
  // Facultatif : mesure d'audience anonyme (Vercel Analytics)
  analytics: boolean;
}

export function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONSENT_VERSION || parsed.healthData !== true) return null;
    return {
      version: CONSENT_VERSION,
      acceptedAt: String(parsed.acceptedAt),
      healthData: true,
      cloudSync: Boolean(parsed.cloudSync),
      analytics: Boolean(parsed.analytics),
    };
  } catch {
    return null;
  }
}

export function saveConsent(choices: { cloudSync: boolean; analytics: boolean }): ConsentState {
  const consent: ConsentState = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    healthData: true,
    cloudSync: choices.cloudSync,
    analytics: choices.analytics,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch (err) {
      console.error('Enregistrement du consentement impossible:', err);
    }
  }
  return consent;
}

export function updateConsent(changes: Partial<Pick<ConsentState, 'cloudSync' | 'analytics'>>): ConsentState | null {
  const current = loadConsent();
  if (!current) return null;
  return saveConsent({ cloudSync: current.cloudSync, analytics: current.analytics, ...changes });
}

/**
 * La synchronisation cloud n'a lieu qu'avec l'accord explicite de l'utilisateur.
 */
export function isCloudSyncAllowed(): boolean {
  return loadConsent()?.cloudSync === true;
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
}
