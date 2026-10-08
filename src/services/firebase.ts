import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';
import { AnalyzedMeal, UserProfileDT1 } from '../types';
import { generateSyncCode, isValidSyncCode, normalizeSyncCode } from '../utils/syncCode';

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
} else {
  app = getApp();
}

// App Check : seules les instances authentiques de l'application peuvent appeler Firestore et Storage
// (limite la création massive de comptes anonymes et les écritures abusives). La clé de site reCAPTCHA v3
// vient de VITE_RECAPTCHA_SITE_KEY ou de firebase-applet-config.json ; l'application obligatoire
// (« enforcement ») s'active ensuite dans la console Firebase > App Check.
const recaptchaSiteKey = import.meta.env?.VITE_RECAPTCHA_SITE_KEY || firebaseConfig.recaptchaSiteKey;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  try {
    // En développement, un jeton de débogage enregistré dans la console remplace reCAPTCHA
    if (import.meta.env?.DEV && import.meta.env?.VITE_APPCHECK_DEBUG_TOKEN) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('App Check notice:', err);
  }
}

// Database ID Firestore (défaut ou personnalisé)
const rawDbId = firebaseConfig.firestoreDatabaseId;
const dbId = rawDbId && rawDbId !== '(default)' ? rawDbId : undefined;

let db: Firestore;
try {
  db = dbId
    ? initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
          // Les objets de l'application contiennent des champs optionnels à undefined (refusés sinon par Firestore)
          ignoreUndefinedProperties: true,
        },
        dbId
      )
    : initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
        ignoreUndefinedProperties: true,
      });
} catch (err) {
  try {
    // Fallback mémoire vive si IndexedDB est désactivé (ex: navigation privée stricte)
    db = dbId
      ? initializeFirestore(
          app,
          {
            localCache: memoryLocalCache(),
            ignoreUndefinedProperties: true,
          },
          dbId
        )
      : initializeFirestore(app, {
          localCache: memoryLocalCache(),
          ignoreUndefinedProperties: true,
        });
  } catch {
    // Fallback si déjà initialisé
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app, firebaseConfig.storageBucket);
export { db };

let anonymousAuthFailed = false;

/**
 * Assure qu'un utilisateur est authentifié (authentification anonyme transparente par défaut si non connecté)
 */
export async function ensureAuthenticatedUser(): Promise<User> {
  // Si déjà en session, retourner directement pour éviter la création répétée de listeners
  if (auth.currentUser) {
    anonymousAuthFailed = false;
    return auth.currentUser;
  }

  // Si l'authentification anonyme est bloquée côté Firebase Console, éviter de spammer l'API
  if (anonymousAuthFailed) {
    throw new Error(
      'Authentification Firebase anonyme désactivée dans la console Firebase (auth/admin-restricted-operation).'
    );
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        anonymousAuthFailed = false;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          anonymousAuthFailed = false;
          resolve(cred.user);
        } catch (error: any) {
          if (
            error?.code === 'auth/admin-restricted-operation' ||
            error?.code === 'auth/operation-not-allowed'
          ) {
            anonymousAuthFailed = true;
            console.warn(
              '⚠️ [GlucoMeal.ai / Firebase Auth] L’authentification anonyme est désactivée dans la console Firebase (auth/admin-restricted-operation).\n' +
                '➡️ Pour activer la synchronisation automatique transparente :\n' +
                '1. Rendez-vous sur Firebase Console > Authentification > Modes de connexion (Sign-in method)\n' +
                '2. Cliquez sur "Anonyme" > Activez-le > Enregistrez.\n' +
                '3. Dans l’onglet Paramètres > Actions des utilisateurs, vérifiez que "Autoriser les utilisateurs à s’inscrire" est activé.'
            );
          }
          reject(error);
        }
      }
    });
  });
}

/**
 * Synchroniser le profil patient vers Firestore
 */
export async function syncProfileToFirestore(profile: UserProfileDT1): Promise<void> {
  try {
    const user = await ensureAuthenticatedUser();
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        userId: user.uid,
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
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Erreur synchronisation profil Firestore:', err);
  }
}

/**
 * Sauvegarder ou mettre à jour un repas dans Firestore
 */
export async function syncMealToFirestore(meal: AnalyzedMeal): Promise<void> {
  try {
    const user = await ensureAuthenticatedUser();
    const mealDocRef = doc(db, 'users', user.uid, 'meals', meal.id);
    await setDoc(
      mealDocRef,
      {
        ...meal,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Erreur synchronisation repas Firestore:', err);
  }
}

/**
 * Supprimer un repas de Firestore
 */
export async function deleteMealFromFirestore(mealId: string): Promise<void> {
  try {
    const user = await ensureAuthenticatedUser();
    const mealDocRef = doc(db, 'users', user.uid, 'meals', mealId);
    await deleteDoc(mealDocRef);
  } catch (err) {
    console.warn('Erreur suppression repas Firestore:', err);
  }
}

/**
 * Écouter les repas en direct depuis Firestore (avec cache local persistant)
 */
export function subscribeToMeals(
  userId: string,
  onUpdate: (meals: AnalyzedMeal[]) => void
): () => void {
  const mealsColRef = collection(db, 'users', userId, 'meals');
  const q = query(mealsColRef, orderBy('created_at', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const meals: AnalyzedMeal[] = [];
      snapshot.forEach((docSnap) => {
        meals.push(docSnap.data() as AnalyzedMeal);
      });
      onUpdate(meals);
    },
    (err) => {
      console.warn('Écouteur Firestore repas:', err);
    }
  );
}

/**
 * Connexion par e-mail et mot de passe (pour synchroniser sur plusieurs appareils)
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export interface RemoteUserData {
  profile: UserProfileDT1 | null;
  meals: AnalyzedMeal[];
}

/**
 * Récupère le profil médical et l'historique des repas stockés sur Firestore pour l'utilisateur
 */
export async function fetchUserDataFromFirestore(userId: string): Promise<RemoteUserData> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    let profile: UserProfileDT1 | null = null;
    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfileDT1;
    }

    const mealsColRef = collection(db, 'users', userId, 'meals');
    const q = query(mealsColRef, orderBy('created_at', 'desc'));
    const mealsSnap = await getDocs(q);
    const meals: AnalyzedMeal[] = [];
    mealsSnap.forEach((docSnap) => {
      meals.push(docSnap.data() as AnalyzedMeal);
    });

    return { profile, meals };
  } catch (err) {
    console.warn('Erreur récupération données Firestore:', err);
    return { profile: null, meals: [] };
  }
}

/**
 * Synchronise une liste de repas (ex: locaux) vers Firestore pour l'utilisateur connecté
 */
export async function syncBatchMealsToFirestore(meals: AnalyzedMeal[]): Promise<void> {
  if (!meals || meals.length === 0) return;
  try {
    const user = await ensureAuthenticatedUser();
    for (const meal of meals) {
      const mealDocRef = doc(db, 'users', user.uid, 'meals', meal.id);
      await setDoc(
        mealDocRef,
        {
          ...meal,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Erreur synchronisation par lot repas Firestore:', err);
  }
}

/**
 * Téléverse une photo de repas en base64 vers Firebase Storage (évite de saturer Firestore avec des chaînes > 1 Mo)
 */
export async function uploadMealPhoto(
  userId: string,
  mealId: string,
  base64DataUrl: string
): Promise<string> {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) {
    return base64DataUrl;
  }
  try {
    const photoRef = ref(storage, `users/${userId}/meals/${mealId}_photo.webp`);
    await uploadString(photoRef, base64DataUrl, 'data_url', {
      contentType: 'image/webp',
    });
    const downloadUrl = await getDownloadURL(photoRef);
    return downloadUrl;
  } catch (err) {
    console.warn('Erreur téléversement image Storage, conservation locale:', err);
    return base64DataUrl;
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
 * Sauvegarde le dossier sous un code de synchronisation dans Firestore.
 * Seul le compte qui a créé un code peut le mettre à jour (règles Firestore) : si le code existant
 * appartient à un autre compte (ex. code importé depuis un autre appareil), un nouveau code est créé.
 */
export async function pushSyncCodeToFirestore(
  existingCode?: string,
  payload?: CloudSyncPayload
): Promise<{ success: boolean; syncCode: string; lastUpdated: string; totalMeals: number }> {
  const user = await ensureAuthenticatedUser();
  const now = new Date();

  const writeRecord = async (syncCode: string) => {
    await setDoc(doc(db, 'syncCodes', syncCode), {
      syncCode,
      creatorUid: user.uid,
      userProfile: payload?.userProfile ? stripSecretsFromProfile(payload.userProfile) : {},
      meals: payload?.meals || [],
      learnedPortions: payload?.learnedPortions || [],
      lastUpdated: now.toISOString(),
      expiresAt: Timestamp.fromMillis(now.getTime() + SYNC_CODE_VALIDITY_MS),
    });
  };

  const candidate = existingCode ? normalizeSyncCode(existingCode) : '';
  let syncCode = isValidSyncCode(candidate) ? candidate : generateSyncCode();
  try {
    await writeRecord(syncCode);
  } catch (err: any) {
    if (err?.code !== 'permission-denied' || syncCode !== candidate) {
      console.error('Erreur pushSyncCodeToFirestore:', err);
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
 * Récupère le dossier complet depuis un code de synchronisation Firestore (lecture seule, code non expiré).
 */
export async function pullSyncCodeFromFirestore(
  syncCode: string
): Promise<{ success: boolean; message: string; record?: any }> {
  const cleanCode = normalizeSyncCode(syncCode);
  if (!isValidSyncCode(cleanCode)) {
    return {
      success: false,
      message: 'Format de code invalide (attendu : GLUCO-XXXX-XXXX-XXXX-XXXX).',
    };
  }
  try {
    await ensureAuthenticatedUser();
    const snap = await getDoc(doc(db, 'syncCodes', cleanCode));

    if (!snap.exists()) {
      return {
        success: false,
        message: 'Code de synchronisation introuvable ou expiré.',
      };
    }

    const data = snap.data();
    return {
      success: true,
      message: `Synchronisation réussie (${data.meals?.length || 0} repas restaurés).`,
      record: data,
    };
  } catch (err: any) {
    // Les règles refusent la lecture d'un code inexistant ou expiré
    if (err?.code === 'permission-denied') {
      return { success: false, message: 'Code de synchronisation introuvable ou expiré.' };
    }
    console.error('Erreur pullSyncCodeFromFirestore:', err);
    return {
      success: false,
      message: err.message || 'Erreur lors de la récupération Firestore.',
    };
  }
}
