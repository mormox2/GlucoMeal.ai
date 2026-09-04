import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { loadSavedMeals, saveMeals, loadUserProfile, saveUserProfile } from './storage';
import { loadPatientCustomPortions, savePatientCustomPortions } from './activeLearning';

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
 * Pousse les données locales (profil, repas, portions apprises) vers le serveur Cloud
 */
export async function pushDataToCloud(
  customCode?: string
): Promise<CloudSyncResult> {
  const syncCode = customCode || getStoredSyncCode() || undefined;
  const userProfile = loadUserProfile();
  const meals = loadSavedMeals();
  const learnedPortions = loadPatientCustomPortions();

  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncCode,
        userProfile,
        meals,
        learnedPortions,
      }),
    });

    if (!res.ok) {
      throw new Error(`Erreur serveur HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.syncCode) {
      setStoredSyncCode(data.syncCode);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, data.lastUpdated || new Date().toISOString());
    }

    return {
      success: true,
      syncCode: data.syncCode,
      lastUpdated: data.lastUpdated,
      message: `Synchronisé avec succès dans le cloud (${data.totalMeals} repas).`,
    };
  } catch (err: any) {
    console.error('Échec synchronisation cloud push:', err);
    return {
      success: false,
      syncCode: syncCode || '',
      message: err.message || 'Échec de connexion au serveur cloud.',
    };
  }
}

/**
 * Récupère les données depuis le Cloud à partir d'un code de synchronisation
 */
export async function pullDataFromCloud(
  syncCode: string
): Promise<{ success: boolean; message: string; record?: any }> {
  try {
    const cleanCode = syncCode.trim().toUpperCase();
    const res = await fetch(`/api/sync/pull/${encodeURIComponent(cleanCode)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, message: 'Code de synchronisation introuvable ou expiré.' };
      }
      throw new Error(`Erreur HTTP ${res.status}`);
    }

    const data = await res.json();
    const record = data.record;

    if (record) {
      if (record.userProfile) saveUserProfile(record.userProfile);
      if (record.meals) saveMeals(record.meals);
      if (record.learnedPortions) savePatientCustomPortions(record.learnedPortions);
      setStoredSyncCode(cleanCode);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, record.lastUpdated || new Date().toISOString());

      return {
        success: true,
        message: `Dossier synchronisé ! (${record.meals?.length || 0} repas restaurés).`,
        record,
      };
    }

    return { success: false, message: 'Données reçues incomplètes.' };
  } catch (err: any) {
    console.error('Échec synchronisation cloud pull:', err);
    return { success: false, message: err.message || 'Impossible de joindre le serveur cloud.' };
  }
}
