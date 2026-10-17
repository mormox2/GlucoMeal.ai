import { AnalyzedMeal, UserProfileDT1 } from '../types';
import {
  isCloudConfigured,
  onAuthChange,
  upsertMealsRemote,
  upsertProfileRemote,
  deleteMealRemote,
  deleteAllMealsRemote,
  stripSecretsFromProfile,
} from '../services/supabase';
import { isCloudSyncAllowed } from './consent';

/**
 * File d'attente des envois vers le cloud. L'appareil (localStorage) reste la référence : chaque écriture
 * locale ajoute ici une opération, envoyée dès que possible et conservée tant que le réseau manque.
 * Les opérations sont rejouables sans risque (upsert par identifiant, suppression idempotente).
 */
const QUEUE_KEY = 'glucomal_offline_queue_v1';
const MAX_MEALS_PER_REQUEST = 200;

type OperationBody =
  | { type: 'upsertMeal'; meal: AnalyzedMeal }
  | { type: 'deleteMeal'; mealId: string }
  | { type: 'deleteAllMeals' }
  | { type: 'upsertProfile'; profile: Omit<UserProfileDT1, 'cgmConfig'> };

export type SyncOperation = OperationBody & { opId: string };

let memoryQueue: SyncOperation[] = [];

export function getPendingOperations(): SyncOperation[] {
  if (typeof window === 'undefined') return [...memoryQueue];
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncOperation[]): void {
  memoryQueue = [...queue];
  if (typeof window === 'undefined') return;
  try {
    if (queue.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("File d'attente cloud non enregistrée:", err);
  }
}

function mealIdOf(op: SyncOperation): string | null {
  if (op.type === 'upsertMeal') return op.meal.id;
  if (op.type === 'deleteMeal') return op.mealId;
  return null;
}

let opCounter = 0;

/** Ajoute une opération ; une opération plus récente sur le même repas (ou le profil) remplace l'ancienne. */
function enqueue(op: OperationBody): void {
  const queue = getPendingOperations().filter((existing) => {
    switch (op.type) {
      case 'upsertMeal':
      case 'deleteMeal':
        return mealIdOf(existing) !== (op.type === 'upsertMeal' ? op.meal.id : op.mealId);
      case 'deleteAllMeals':
        return existing.type === 'upsertProfile';
      case 'upsertProfile':
        return existing.type !== 'upsertProfile';
    }
  });
  queue.push({ ...op, opId: `${Date.now().toString(36)}-${(opCounter++).toString(36)}` } as SyncOperation);
  saveQueue(queue);
}

// Aucune donnée de santé ne part dans le cloud sans l'accord de l'utilisateur ; les suppressions,
// elles, sont toujours transmises (elles ne créent jamais de compte).
function canUpload(): boolean {
  return isCloudConfigured && isCloudSyncAllowed();
}

export function queueMealUpsert(meal: AnalyzedMeal): void {
  queueMealsUpsert([meal]);
}

export function queueMealsUpsert(meals: AnalyzedMeal[]): void {
  if (!canUpload() || meals.length === 0) return;
  meals.forEach((meal) => enqueue({ type: 'upsertMeal', meal }));
  void flushSyncQueue();
}

export function queueMealDelete(mealId: string): void {
  if (!isCloudConfigured) return;
  enqueue({ type: 'deleteMeal', mealId });
  void flushSyncQueue();
}

export function queueAllMealsDelete(): void {
  if (!isCloudConfigured) return;
  enqueue({ type: 'deleteAllMeals' });
  void flushSyncQueue();
}

export function queueProfileUpsert(profile: UserProfileDT1): void {
  if (!canUpload()) return;
  enqueue({ type: 'upsertProfile', profile: stripSecretsFromProfile(profile) });
  void flushSyncQueue();
}

/**
 * Retire d'une liste reçue du cloud les repas qui ont encore une opération en attente : la version locale
 * est plus récente (modifiée ou supprimée hors-ligne) et ne doit pas être écrasée par l'ancienne.
 */
export function withoutPendingMeals(remoteMeals: AnalyzedMeal[]): AnalyzedMeal[] {
  const pending = getPendingOperations();
  if (pending.some((op) => op.type === 'deleteAllMeals')) return [];
  const pendingIds = new Set(pending.map(mealIdOf).filter((id): id is string => id !== null));
  return remoteMeals.filter((meal) => !pendingIds.has(meal.id));
}

/**
 * Refus définitif du serveur (contrainte de validation, RLS, requête invalide) : réessayer ne servirait
 * à rien et bloquerait la file. Les autres erreurs (réseau, session, serveur indisponible) sont réessayées.
 */
export function isPermanentSyncError(err: any): boolean {
  const code = typeof err?.code === 'string' ? err.code : '';
  return /^(22|23|42)/.test(code) || /^PGRST[12]/.test(code);
}

function removeOperations(opIds: Set<string>): void {
  saveQueue(getPendingOperations().filter((op) => !opIds.has(op.opId)));
}

async function runOperation(op: SyncOperation): Promise<void> {
  switch (op.type) {
    case 'upsertMeal':
      return upsertMealsRemote([op.meal]);
    case 'deleteMeal':
      return deleteMealRemote(op.mealId);
    case 'deleteAllMeals':
      return deleteAllMealsRemote();
    case 'upsertProfile':
      return upsertProfileRemote(op.profile as UserProfileDT1);
  }
}

/** Exécute un lot ; renvoie faux si l'envoi doit être réessayé plus tard. */
async function runBatch(batch: SyncOperation[]): Promise<boolean> {
  try {
    if (batch.length > 1) {
      await upsertMealsRemote(batch.flatMap((op) => (op.type === 'upsertMeal' ? [op.meal] : [])));
    } else {
      await runOperation(batch[0]);
    }
    removeOperations(new Set(batch.map((op) => op.opId)));
    return true;
  } catch (err) {
    if (!isPermanentSyncError(err)) return false;
    if (batch.length > 1) {
      // Isoler le repas refusé sans perdre les autres
      for (const op of batch) {
        if (!(await runBatch([op]))) return false;
      }
      return true;
    }
    console.warn('Opération cloud refusée définitivement, retirée de la file:', batch[0].type, err);
    removeOperations(new Set([batch[0].opId]));
    return true;
  }
}

async function runFlush(): Promise<void> {
  for (;;) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    let queue = getPendingOperations();
    // Accord retiré depuis la mise en file : les envois de données sont abandonnés
    if (!canUpload()) {
      const kept = queue.filter((op) => op.type === 'deleteMeal' || op.type === 'deleteAllMeals');
      if (kept.length !== queue.length) saveQueue(kept);
      queue = kept;
    }
    if (queue.length === 0) return;

    // Les ajouts de repas consécutifs partent en une seule requête
    let batch = [queue[0]];
    if (queue[0].type === 'upsertMeal') {
      const end = queue.findIndex((op) => op.type !== 'upsertMeal');
      batch = queue.slice(0, Math.min(end === -1 ? queue.length : end, MAX_MEALS_PER_REQUEST));
    }
    if (!(await runBatch(batch))) return;
  }
}

let flushing: Promise<void> | null = null;
let flushRequestedDuringRun = false;

/** Envoie les opérations en attente, dans l'ordre ; une seule exécution à la fois. */
export function flushSyncQueue(): Promise<void> {
  if (!isCloudConfigured) return Promise.resolve();
  if (flushing) {
    // Une opération ajoutée pendant l'envoi en cours sera traitée par un nouveau passage
    flushRequestedDuringRun = true;
    return flushing;
  }
  flushing = runFlush()
    .catch((err) => console.warn("File d'attente cloud:", err))
    .finally(() => {
      flushing = null;
      if (flushRequestedDuringRun) {
        flushRequestedDuringRun = false;
        void flushSyncQueue();
      }
    });
  return flushing;
}

/**
 * Relance l'envoi au démarrage, au retour du réseau et à chaque connexion. Renvoie la fonction d'arrêt.
 */
export function startSyncQueue(): () => void {
  if (!isCloudConfigured || typeof window === 'undefined') return () => {};
  const handleOnline = () => void flushSyncQueue();
  window.addEventListener('online', handleOnline);
  const unsubscribeAuth = onAuthChange((user) => {
    if (user) void flushSyncQueue();
  });
  void flushSyncQueue();
  return () => {
    window.removeEventListener('online', handleOnline);
    unsubscribeAuth();
  };
}
