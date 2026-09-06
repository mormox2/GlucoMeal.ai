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

// Initialisation sécurisée App Check si recaptchaSiteKey est configuré
if (typeof window !== 'undefined' && firebaseConfig.recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey),
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
        },
        dbId
      )
    : initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
} catch (err) {
  try {
    // Fallback mémoire vive si IndexedDB est désactivé (ex: navigation privée stricte)
    db = dbId
      ? initializeFirestore(
          app,
          {
            localCache: memoryLocalCache(),
          },
          dbId
        )
      : initializeFirestore(app, {
          localCache: memoryLocalCache(),
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

/**
 * Sauvegarde le dossier complet sous un code de synchronisation haute entropie directement dans Firestore
 */
export async function pushSyncCodeToFirestore(
  customCode?: string,
  payload?: CloudSyncPayload
): Promise<{ success: boolean; syncCode: string; lastUpdated: string; totalMeals: number }> {
  try {
    let creatorUid = 'anonymous';
    try {
      const user = await ensureAuthenticatedUser();
      creatorUid = user.uid;
    } catch {
      // Authentification non initialisée ou anonyme désactivée
    }

    let syncCode = customCode?.trim().toUpperCase();
    if (!syncCode) {
      const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      syncCode = `GLUCO-${p1}-${p2}`;
    }

    const docRef = doc(db, 'syncCodes', syncCode);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 jours de validité

    await setDoc(docRef, {
      syncCode,
      creatorUid,
      userProfile: payload?.userProfile || {},
      meals: payload?.meals || [],
      learnedPortions: payload?.learnedPortions || [],
      lastUpdated: now,
      expiresAt,
    });

    return {
      success: true,
      syncCode,
      lastUpdated: now,
      totalMeals: payload?.meals?.length || 0,
    };
  } catch (err) {
    console.error('Erreur pushSyncCodeToFirestore:', err);
    throw err;
  }
}

/**
 * Récupère le dossier complet depuis un code de synchronisation Firestore
 */
export async function pullSyncCodeFromFirestore(
  syncCode: string
): Promise<{ success: boolean; message: string; record?: any }> {
  try {
    try {
      await ensureAuthenticatedUser();
    } catch {
      // Continue en lecture directe si autorisé
    }
    const cleanCode = syncCode.trim().toUpperCase();
    const docRef = doc(db, 'syncCodes', cleanCode);
    const snap = await getDoc(docRef);

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
    console.error('Erreur pullSyncCodeFromFirestore:', err);
    return {
      success: false,
      message: err.message || 'Erreur lors de la récupération Firestore.',
    };
  }
}

