import { describe, it, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';

let env: RulesTestEnvironment;
const code = 'GLUCO-7K2X-9B4F-QM3T-H8WZ';
const otherCode = 'GLUCO-AAAA-BBBB-CCCC-DDDD';

const record = (uid: string, extra: Record<string, unknown> = {}) => ({
  syncCode: code,
  creatorUid: uid,
  userProfile: { name: 'A', icRatios: { lunch: 10 } },
  meals: [],
  learnedPortions: [],
  lastUpdated: new Date().toISOString(),
  expiresAt: Timestamp.fromMillis(Date.now() + 7 * 864e5),
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-glucomeal',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe('Règles Firestore : codes de synchronisation', () => {
  it('seul le créateur écrit, met à jour et supprime son code', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(setDoc(doc(alice, 'syncCodes', code), record('alice')));
    await assertSucceeds(setDoc(doc(alice, 'syncCodes', code), record('alice')));
    await assertSucceeds(getDoc(doc(bob, 'syncCodes', code)));
    await assertFails(setDoc(doc(bob, 'syncCodes', code), record('bob')));
    await assertFails(setDoc(doc(bob, 'syncCodes', code), record('alice')));
    await assertFails(deleteDoc(doc(bob, 'syncCodes', code)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'syncCodes', code)));
    await assertSucceeds(deleteDoc(doc(alice, 'syncCodes', code)));
  });

  it('refuse les créations invalides', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    const create = (data: Record<string, unknown>, id = otherCode) => setDoc(doc(bob, 'syncCodes', id), { ...data, syncCode: id });
    await assertFails(create(record('alice')));
    await assertFails(create(record('bob', { userProfile: { cgmConfig: { apiKey: 'x' } } })));
    await assertFails(create(record('bob', { expiresAt: Timestamp.fromMillis(Date.now() + 30 * 864e5) })));
    await assertFails(create(record('bob'), 'GLUCO-AAAA-BBBB'));
  });

  it('refuse la lecture d’un code inexistant ou expiré', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(getDoc(doc(bob, 'syncCodes', otherCode)));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'syncCodes', otherCode), {
        ...record('carol'),
        syncCode: otherCode,
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
      });
    });
    await assertFails(getDoc(doc(bob, 'syncCodes', otherCode)));
  });
});

describe('Règles Firestore : profil et repas', () => {
  it('réserve le profil à son propriétaire', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(
      setDoc(doc(alice, 'users', 'alice'), { userId: 'alice', name: 'A', glucoseUnit: 'g/L', targetGlucose: 1, isf: 0.4 })
    );
    await assertFails(getDoc(doc(bob, 'users', 'alice')));
    await assertSucceeds(deleteDoc(doc(alice, 'users', 'alice')));
  });
});
