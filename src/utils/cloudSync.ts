import { ProfileValidationIssue, UserProfileDT1 } from '../types';
import {
  loadSavedMeals,
  saveMeals,
  loadUserProfile,
  saveUserProfile,
  sanitizeUserProfile,
  validateTherapeuticProfile,
} from './storage';
import { loadPatientCustomPortions, savePatientCustomPortions } from './activeLearning';
import { pushSyncCodeToFirestore, pullSyncCodeFromFirestore } from '../services/firebase';
import { normalizeSyncCode } from './syncCode';

const STORAGE_KEYS = {
  SYNC_CODE: 'glucomal_cloud_sync_code_v1',
  LAST_SYNC_TIME: 'glucomal_cloud_last_sync_time_v1',
};

export interface CloudSyncResult {
  success: boolean;
  syncCode: string;
  lastUpdated?: string;
  message?: string;
}

export function getStoredSyncCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.SYNC_CODE);
}

export function setStoredSyncCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SYNC_CODE, code.toUpperCase());
}

export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
}

/**
 * Pousse les données locales (profil sans secrets, repas, portions apprises) vers Cloud Firestore.
 * Il n'existe plus de repli vers un serveur tiers : les données de santé ne transitent que par
 * Firestore, protégé par des règles d'accès par compte.
 */
export async function pushDataToCloud(existingCode?: string): Promise<CloudSyncResult> {
  const syncCode = existingCode || getStoredSyncCode() || undefined;
  try {
    const res = await pushSyncCodeToFirestore(syncCode, {
      userProfile: loadUserProfile(),
      meals: loadSavedMeals(),
      learnedPortions: loadPatientCustomPortions(),
    });
    setStoredSyncCode(res.syncCode);
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, res.lastUpdated);
    return {
      success: true,
      syncCode: res.syncCode,
      lastUpdated: res.lastUpdated,
      message: `Synchronisé avec succès dans le cloud (${res.totalMeals} repas). Code valable 7 jours.`,
    };
  } catch (err: any) {
    console.error('Échec synchronisation cloud push:', err);
    return {
      success: false,
      syncCode: syncCode || '',
      message: err?.message || 'Échec de connexion au cloud Firestore.',
    };
  }
}

export interface CloudPullResult {
  success: boolean;
  message: string;
  record?: any;
  /** Profil thérapeutique reçu : jamais appliqué automatiquement, l'utilisateur doit le confirmer */
  incomingProfile?: UserProfileDT1;
  /** Problèmes de bornes cliniques du profil reçu (s'il y en a, il ne peut pas être appliqué) */
  incomingProfileIssues?: ProfileValidationIssue[];
}

/**
 * Récupère un dossier depuis un code de synchronisation Firestore.
 * Les repas et portions apprises sont restaurés ; le profil d'insuline reçu est seulement
 * renvoyé pour confirmation explicite (voir applyIncomingProfile).
 */
export async function pullDataFromCloud(syncCode: string): Promise<CloudPullResult> {
  const res = await pullSyncCodeFromFirestore(syncCode);
  if (!res.success || !res.record) {
    return { success: false, message: res.message };
  }

  const record = res.record;
  if (Array.isArray(record.meals)) saveMeals(record.meals);
  if (Array.isArray(record.learnedPortions)) savePatientCustomPortions(record.learnedPortions);
  setStoredSyncCode(normalizeSyncCode(syncCode));
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, record.lastUpdated || new Date().toISOString());

  const hasProfile = record.userProfile && typeof record.userProfile === 'object' && Object.keys(record.userProfile).length > 0;
  const incomingProfile = hasProfile ? sanitizeUserProfile(record.userProfile) : undefined;

  return {
    success: true,
    message: `Dossier synchronisé ! (${record.meals?.length || 0} repas restaurés).`,
    record,
    incomingProfile,
    incomingProfileIssues: incomingProfile ? validateTherapeuticProfile(incomingProfile) : undefined,
  };
}

/**
 * Applique un profil thérapeutique reçu par synchronisation, après confirmation de l'utilisateur.
 * La configuration CGM locale (et ses secrets) est conservée.
 */
export function applyIncomingProfile(
  incoming: UserProfileDT1,
  current: UserProfileDT1
): { applied: boolean; profile: UserProfileDT1; issues: ProfileValidationIssue[] } {
  const profile = sanitizeUserProfile({ ...incoming, cgmConfig: current.cgmConfig });
  const issues = saveUserProfile(profile);
  return { applied: issues.length === 0, profile, issues };
}
