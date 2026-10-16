import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { generateSyncCode, isValidSyncCode, normalizeSyncCode } from '../utils/syncCode';
import { isCloudSyncAllowed } from '../utils/consent';

// Configuration publique du projet Supabase (Project Settings > API). La clé publiable ne donne accès
// qu'à ce que les politiques RLS autorisent (voir supabase/migrations).
const supabaseUrl: string | undefined = import.meta.env?.VITE_SUPABASE_URL;
const supabaseKey: string | undefined = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Faux si les variables Supabase sont absentes : l'application reste alors 100 % locale. */
export const isCloudConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Sauvegarde cloud non configurée (VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY manquants).'
    );
  }
  return supabase;
}

// Utilisateur courant, tenu à jour pour les lectures synchrones (ex. identifiant d'un nouveau repas)
let currentUser: User | null = null;
supabase?.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
});

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getCurrentUserId(): string | null {
  return currentUser?.id ?? null;
}

/**
 * Écoute les connexions et déconnexions (appelé une première fois avec l'état initial).
 * Le rappel est différé : Supabase interdit d'appeler son client depuis l'intérieur de l'écouteur.
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!supabase) {
    const timer = setTimeout(() => callback(null), 0);
    return () => clearTimeout(timer);
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    const user = session?.user ?? null;
    setTimeout(() => callback(user), 0);
  });
  return () => data.subscription.unsubscribe();
}

/** Code d'erreur Supabase Auth (ex. invalid_credentials), ou over_request_rate_limit pour un statut 429. */
export function getAuthErrorCode(err: any): string | undefined {
  if (err?.code) return err.code;
  if (err?.status === 429) return 'over_request_rate_limit';
  return undefined;
}

let anonymousAuthDisabled = false;
let pendingAnonymousSignIn: Promise<User> | null = null;

/**
 * Assure qu'un utilisateur est authentifié (session anonyme transparente par défaut si non connecté)
 */
export async function ensureAuthenticatedUser(): Promise<User> {
  const client = requireClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user) {
    anonymousAuthDisabled = false;
    return session.user;
  }

  // Si la connexion anonyme est désactivée dans le projet Supabase, éviter de spammer l'API
  if (anonymousAuthDisabled) {
    throw new Error('Connexion anonyme désactivée dans le projet Supabase (anonymous_provider_disabled).');
  }

  // Un seul compte anonyme même si plusieurs synchronisations démarrent en même temps
  pendingAnonymousSignIn ??= (async () => {
    try {
      const { data, error } = await client.auth.signInAnonymously();
      if (error) throw error;
      if (!data.user) throw new Error('Connexion anonyme Supabase sans utilisateur.');
      return data.user;
    } catch (error: any) {
      if (getAuthErrorCode(error) === 'anonymous_provider_disabled') {
        anonymousAuthDisabled = true;
        console.warn(
          '⚠️ [GlucoMeal.ai / Supabase Auth] La connexion anonyme est désactivée.\n' +
            '➡️ Pour activer la synchronisation automatique transparente :\n' +
            'Tableau de bord Supabase > Authentication > Sign In / Providers > activez « Allow anonymous sign-ins ».'
        );
      }
      throw error;
    } finally {
      pendingAnonymousSignIn = null;
    }
  })();
  return pendingAnonymousSignIn;
}

/** Session existante uniquement : une suppression ne doit jamais créer de compte. */
async function getSessionUser(): Promise<User | null> {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

function toCloudProfile(profile: UserProfileDT1, user: User) {
  return {
    userId: user.id,
    name: profile.name || (profile.childProfile ? profile.childProfile.childName : 'Patient DT1'),
    glucoseUnit: profile.glucoseUnit,
    targetGlucose: profile.targetGlucose,
    isf: profile.isf,
    icRatios: profile.icRatios,
    roundingStep: profile.roundingStep,
    ramadanMode: !!profile.ramadanMode,
    maxBolusUnits: profile.maxBolusUnits,
    insulinActionHours: profile.insulinActionHours,
    accountType: profile.accountType || 'patient',
    childProfile: profile.childProfile || null,
    parentEmail: profile.parentEmail || user.email || null,
    updatedAt: new Date().toISOString(),
  };
}

function toMealRow(meal: AnalyzedMeal, userId: string) {
  return {
    user_id: userId,
    id: meal.id,
    data: { ...meal, userId, updatedAt: new Date().toISOString() },
  };
}

// Les fonctions « …Remote » lèvent une exception en cas d'échec : la file d'attente hors-ligne
// (utils/syncQueue.ts) s'en sert pour réessayer plus tard.

export async function upsertProfileRemote(profile: UserProfileDT1): Promise<void> {
  const client = requireClient();
  const user = await ensureAuthenticatedUser();
  const { error } = await client
    .from('profiles')
    .upsert({ user_id: user.id, data: toCloudProfile(profile, user) });
  if (error) throw error;
}

export async function upsertMealsRemote(meals: AnalyzedMeal[]): Promise<void> {
  if (meals.length === 0) return;
  const client = requireClient();
  const user = await ensureAuthenticatedUser();
  const { error } = await client.from('meals').upsert(meals.map((meal) => toMealRow(meal, user.id)));
  if (error) throw error;
}

export async function deleteMealRemote(mealId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const { error } = await requireClient().from('meals').delete().eq('user_id', user.id).eq('id', mealId);
  if (error) throw error;
}

export async function deleteAllMealsRemote(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const { error } = await requireClient().from('meals').delete().eq('user_id', user.id);
  if (error) throw error;
}

function sortMealsByDateDesc(meals: AnalyzedMeal[]): AnalyzedMeal[] {
  const time = (m: AnalyzedMeal) => Date.parse(m.created_at || m.timestamp || '') || 0;
  return [...meals].sort((a, b) => time(b) - time(a));
}

const PAGE_SIZE = 1000; // Nombre maximal de lignes renvoyées par requête sur Supabase

async function fetchMealsRemote(userId: string): Promise<AnalyzedMeal[]> {
  const client = requireClient();
  const meals: AnalyzedMeal[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('meals')
      .select('data')
      .eq('user_id', userId)
      .order('id')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    meals.push(...(data || []).map((row) => row.data as AnalyzedMeal));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return sortMealsByDateDesc(meals);
}

/**
 * Écouter les repas en direct (ajouts et modifications, y compris depuis un autre appareil)
 */
export function subscribeToMeals(
  userId: string,
  onUpdate: (meals: AnalyzedMeal[]) => void
): () => void {
  const client = supabase;
  if (!client) return () => {};

  let active = true;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  const refresh = async () => {
    try {
      const meals = await fetchMealsRemote(userId);
      if (active) onUpdate(meals);
    } catch (err) {
      console.warn('Lecture des repas Supabase:', err);
    }
  };
  // Un envoi groupé de repas déclenche un événement par ligne : une seule relecture suffit
  const scheduleRefresh = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void refresh(), 300);
  };

  // Les suppressions ne sont pas écoutées : Supabase ne peut pas les filtrer par compte (RLS)
  const filter = `user_id=eq.${userId}`;
  const channel = client
    .channel(`meals:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meals', filter }, scheduleRefresh)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meals', filter }, scheduleRefresh)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') scheduleRefresh();
    });

  return () => {
    active = false;
    if (debounce) clearTimeout(debounce);
    void client.removeChannel(channel);
  };
}

/**
 * Droit à l'effacement : supprime le compte Supabase et, par cascade, profil, repas, délégations
 * et codes de partage créés par ce compte.
 */
export async function deleteAllCloudData(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const client = requireClient();
  const { error } = await client.rpc('delete_own_account');
  if (error) throw error;
  await client.auth.signOut({ scope: 'local' });
}

/**
 * Efface la session Supabase enregistrée sur cet appareil. À appeler juste avant de recharger la page.
 */
export async function clearLocalCloudSession(): Promise<void> {
  try {
    await supabase?.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.warn('Effacement de la session Supabase:', err);
  }
}

/**
 * Connexion par e-mail et mot de passe (pour synchroniser sur plusieurs appareils)
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const { data, error } = await requireClient().auth.signUp({ email, password: pass });
  if (error) throw error;
  // Sans session, le projet exige une confirmation d'e-mail (option « Confirm email » activée)
  if (!data.user || !data.session) {
    throw new Error('Compte créé : confirmez votre adresse e-mail via le lien reçu, puis connectez-vous.');
  }
  return data.user;
}

/** Déconnexion de cet appareil uniquement (les autres appareils restent connectés). */
export async function logoutUser(): Promise<void> {
  await requireClient().auth.signOut({ scope: 'local' });
}

export interface RemoteUserData {
  profile: UserProfileDT1 | null;
  meals: AnalyzedMeal[];
}

/**
 * Récupère le profil médical et l'historique des repas stockés dans le cloud pour l'utilisateur
 */
export async function fetchUserDataFromCloud(userId: string): Promise<RemoteUserData> {
  try {
    const { data, error } = await requireClient()
      .from('profiles')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    const meals = await fetchMealsRemote(userId);
    return { profile: (data?.data as UserProfileDT1) ?? null, meals };
  } catch (err) {
    console.warn('Erreur récupération données cloud:', err);
    return { profile: null, meals: [] };
  }
}

export interface CloudSyncPayload {
  userProfile: UserProfileDT1;
  meals: AnalyzedMeal[];
  learnedPortions?: any[];
}

const SYNC_CODE_VALIDITY_MS = 7 * 24 * 3600 * 1000; // 7 jours

/**
 * Le partage par code ne transporte jamais de secrets d'appareil (ex. clé API Nightscout).
 */
export function stripSecretsFromProfile(profile: UserProfileDT1): Omit<UserProfileDT1, 'cgmConfig'> {
  const { cgmConfig: _secret, ...shareable } = profile;
  return shareable;
}

/**
 * Sauvegarde le dossier sous un code de synchronisation.
 * Seul le compte qui a créé un code peut le mettre à jour (RLS) : si le code existant
 * appartient à un autre compte (ex. code importé depuis un autre appareil), un nouveau code est créé.
 */
export async function pushSyncCode(
  existingCode?: string,
  payload?: CloudSyncPayload
): Promise<{ success: boolean; syncCode: string; lastUpdated: string; totalMeals: number }> {
  if (!isCloudSyncAllowed()) {
    throw new Error('Sauvegarde cloud désactivée : activez-la dans Profil > Confidentialité pour partager vos données.');
  }
  const client = requireClient();
  const user = await ensureAuthenticatedUser();
  const now = new Date();

  const writeRecord = async (syncCode: string) => {
    const { error } = await client.from('sync_codes').upsert({
      code: syncCode,
      creator_id: user.id,
      user_profile: payload?.userProfile ? stripSecretsFromProfile(payload.userProfile) : {},
      meals: payload?.meals || [],
      learned_portions: payload?.learnedPortions || [],
      last_updated: now.toISOString(),
      expires_at: new Date(now.getTime() + SYNC_CODE_VALIDITY_MS).toISOString(),
    });
    if (error) throw error;
  };

  const candidate = existingCode ? normalizeSyncCode(existingCode) : '';
  let syncCode = isValidSyncCode(candidate) ? candidate : generateSyncCode();
  try {
    await writeRecord(syncCode);
  } catch (err: any) {
    // 42501 : refus RLS, le code appartient à un autre compte
    if (err?.code !== '42501' || syncCode !== candidate) {
      console.error('Erreur pushSyncCode:', err);
      throw err;
    }
    syncCode = generateSyncCode();
    await writeRecord(syncCode);
  }

  return {
    success: true,
    syncCode,
    lastUpdated: now.toISOString(),
    totalMeals: payload?.meals?.length || 0,
  };
}

/**
 * Récupère le dossier complet depuis un code de synchronisation (lecture seule, code non expiré).
 */
export async function pullSyncCode(
  syncCode: string
): Promise<{ success: boolean; message: string; record?: any }> {
  if (!isCloudSyncAllowed()) {
    return {
      success: false,
      message: 'Sauvegarde cloud désactivée : activez-la dans Profil > Confidentialité pour importer un dossier.',
    };
  }
  const cleanCode = normalizeSyncCode(syncCode);
  if (!isValidSyncCode(cleanCode)) {
    return {
      success: false,
      message: 'Format de code invalide (attendu : GLUCO-XXXX-XXXX-XXXX-XXXX).',
    };
  }
  try {
    await ensureAuthenticatedUser();
    const { data, error } = await requireClient().rpc('get_sync_code', { p_code: cleanCode });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) {
      return {
        success: false,
        message: 'Code de synchronisation introuvable ou expiré.',
      };
    }

    const record = {
      syncCode: row.code,
      userProfile: row.user_profile,
      meals: row.meals,
      learnedPortions: row.learned_portions,
      lastUpdated: row.last_updated,
      expiresAt: row.expires_at,
    };
    return {
      success: true,
      message: `Synchronisation réussie (${record.meals?.length || 0} repas restaurés).`,
      record,
    };
  } catch (err: any) {
    console.error('Erreur pullSyncCode:', err);
    return {
      success: false,
      message: err?.message || 'Erreur lors de la récupération du dossier.',
    };
  }
}
