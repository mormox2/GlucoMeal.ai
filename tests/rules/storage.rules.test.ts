import { describe, it, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadString, getBytes, deleteObject } from 'firebase/storage';

let env: RulesTestEnvironment;
const img = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
const path = 'users/alice/meals/m1_photo.webp';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-glucomeal',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe('Règles Storage : photos de repas', () => {
  it('réserve les photos à leur propriétaire', async () => {
    const alice = env.authenticatedContext('alice').storage();
    const bob = env.authenticatedContext('bob').storage();
    await assertSucceeds(uploadString(ref(alice, path), img, 'data_url', { contentType: 'image/webp' }));
    await assertSucceeds(getBytes(ref(alice, path)));
    await assertFails(getBytes(ref(bob, path)));
    await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), path)));
    await assertFails(uploadString(ref(bob, path), img, 'data_url', { contentType: 'image/webp' }));
    await assertFails(deleteObject(ref(bob, path)));
    await assertSucceeds(deleteObject(ref(alice, path)));
  });

  it('n’accepte que des images de moins de 5 Mo dans users/{uid}/meals', async () => {
    const alice = env.authenticatedContext('alice').storage();
    await assertFails(uploadString(ref(alice, 'users/alice/meals/x.txt'), 'hello', 'raw', { contentType: 'text/plain' }));
    await assertFails(
      uploadString(ref(alice, 'users/alice/meals/big.jpg'), 'a'.repeat(5 * 1024 * 1024 + 10), 'raw', { contentType: 'image/jpeg' })
    );
    await assertFails(uploadString(ref(alice, 'public/x.webp'), img, 'data_url', { contentType: 'image/webp' }));
  });
});
