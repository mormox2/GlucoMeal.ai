import { GoogleGenAI } from '@google/genai';

// Modèles configurables (les modèles Gemini sont régulièrement retirés : ne pas les figer dans le code)
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function getGeminiFallbackModel(): string | undefined {
  return process.env.GEMINI_FALLBACK_MODEL || undefined;
}

function getGeminiTimeoutMs(): number {
  return Number(process.env.GEMINI_TIMEOUT_MS) || 25000;
}

// Client initialisé à la demande pour ne pas planter si la clé est absente
let aiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Appelle Gemini en mode JSON structuré, avec délai d'expiration, puis un modèle de repli s'il est
 * configuré (GEMINI_FALLBACK_MODEL). Les consignes passent par systemInstruction : les données de
 * l'utilisateur (texte, image) restent séparées des instructions.
 */
export async function generateJson<T>(
  ai: GoogleGenAI,
  contents: any,
  responseSchema: any,
  systemInstruction?: string
): Promise<T> {
  const models = [getGeminiModel(), getGeminiFallbackModel()].filter((m): m is string => Boolean(m));
  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          systemInstruction,
          abortSignal: AbortSignal.timeout(getGeminiTimeoutMs()),
        },
      });
      const raw = response.text?.trim();
      if (!raw) throw new Error('Réponse vide du modèle.');
      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini (${model}) en échec:`, (err as Error)?.message);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Échec de l’appel Gemini.');
}

const ACCEPTED_IMAGE_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/;

/**
 * Extrait le type et les données base64 d'une image envoyée en data URL. Renvoie null si le
 * format n'est pas une image acceptée.
 */
export function parseImageDataUrl(image: unknown): { mimeType: string; data: string } | null {
  if (typeof image !== 'string') return null;
  const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !ACCEPTED_IMAGE_TYPES.test(match[1])) return null;
  return { mimeType: match[1], data: match[2] };
}
