import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
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

// Database ID spécifique provisionné par AI Studio
const dbId = firebaseConfig.firestoreDatabaseId || '(default)';

let db: Firestore;
try {
  db = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    dbId
  );
} catch (err) {
  // Fallback si déjà initialisé
  db = getFirestore(app, dbId);
}

export const auth: Auth = getAuth(app);
export { db };

/**
 * Assure qu'un utilisateur est authentifié (authentification anonyme transparente par défaut si non connecté)
 */
export async function ensureAuthenticatedUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (error) {
          unsubscribe();
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
