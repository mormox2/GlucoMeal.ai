import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConsent, saveConsent, updateConsent, isCloudSyncAllowed, CONSENT_VERSION } from '../consent';
import { deleteAllLocalData } from '../storage';

function stubLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  // Object.keys(localStorage) doit lister les clés, comme dans un navigateur
  const proxy = new Proxy(localStorage, {
    ownKeys: () => [...store.keys()],
    getOwnPropertyDescriptor: (target, key) =>
      store.has(String(key)) ? { enumerable: true, configurable: true, value: store.get(String(key)) } : Reflect.getOwnPropertyDescriptor(target, key),
  });
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', proxy);
  return store;
}

describe('Consentement', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = stubLocalStorage();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('n’autorise rien tant que l’utilisateur n’a pas accepté', () => {
    expect(loadConsent()).toBeNull();
    expect(isCloudSyncAllowed()).toBe(false);
  });

  it('active les options facultatives seulement si elles sont choisies', () => {
    saveConsent({ cloudSync: false, analytics: false });
    expect(loadConsent()).toMatchObject({ version: CONSENT_VERSION, healthData: true, cloudSync: false, analytics: false });
    expect(isCloudSyncAllowed()).toBe(false);
    updateConsent({ cloudSync: true });
    expect(isCloudSyncAllowed()).toBe(true);
  });

  it('redemande le consentement après un changement de version de la politique', () => {
    store.set('glucomal_consent_v1', JSON.stringify({ version: 0, healthData: true, cloudSync: true }));
    expect(loadConsent()).toBeNull();
  });

  it('efface toutes les données de l’application sur l’appareil', () => {
    saveConsent({ cloudSync: true, analytics: false });
    store.set('glucomal_meals_history_v1', '[]');
    store.set('autre_application', 'x');
    deleteAllLocalData();
    expect([...store.keys()]).toEqual(['autre_application']);
  });
});
