// Alphabet sans caractères ambigus (I, O, 0, 1) : 32 symboles = 5 bits par caractère
const SYNC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Doit rester identique à isValidSyncCode() dans firestore.rules
const SYNC_CODE_PATTERN = /^GLUCO(-[A-HJ-NP-Z2-9]{4}){4}$/;

/**
 * Génère un code de synchronisation aléatoire cryptographique de 80 bits (ex. GLUCO-7K2X-9B4F-QM3T-H8WZ).
 */
export function generateSyncCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // 256 est un multiple de 32 : le modulo ne biaise pas la distribution
  const chars = Array.from(bytes, (b) => SYNC_CODE_ALPHABET[b % 32]).join('');
  return `GLUCO-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

export function normalizeSyncCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidSyncCode(code: string): boolean {
  return SYNC_CODE_PATTERN.test(code);
}
