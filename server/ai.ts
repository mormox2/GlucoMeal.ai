import { GoogleGenAI } from '@google/genai';
import { getGeminiClient, callGemini } from './gemini';
import { RelayClient, getRelayClient, callRelay, relaySupportsImage } from './relay';

/**
 * Fournisseurs d'IA configurés : Gemini en premier, puis un relais compatible OpenAI (NVIDIA NIM par
 * défaut). Les analyses passent par
 * generateJson(), qui essaie chaque fournisseur dans cet ordre.
 */
export interface AiProviders {
  gemini: GoogleGenAI | null;
  relay: RelayClient | null;
}

/** Fournisseurs configurés (clés présentes), ou null si aucun : l'analyse IA est alors indisponible. */
export function getAiProviders(): AiProviders | null {
  const providers: AiProviders = { gemini: getGeminiClient(), relay: getRelayClient() };
  return providers.gemini || providers.relay ? providers : null;
}

/** Donnée à analyser : la description de l'utilisateur ou une image (jamais mêlée aux consignes). */
export type AiInput = { text: string } | { image: { mimeType: string; data: string } };

export interface AiResult<T> {
  data: T;
  /** Fournisseur et modèle qui ont produit la réponse (ex. « relay/meta/llama-3.2-90b-vision-instruct ») */
  model: string;
}

/**
 * Convertit un schéma de réponse au format Gemini (types en majuscules) en JSON Schema standard pour
 * le relais. Le mode strict impose que chaque propriété soit listée dans « required » : une propriété
 * facultative devient donc nullable, pour que le modèle puisse répondre null au lieu d'inventer une valeur.
 */
export function toJsonSchema(schema: any, nullable = false): Record<string, unknown> {
  const baseType = String(schema.type).toLowerCase();
  const type = nullable ? [baseType, 'null'] : baseType;
  if (baseType === 'object') {
    const required = new Set<string>(schema.required || []);
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries<any>(schema.properties || {})) {
      properties[key] = toJsonSchema(value, !required.has(key));
    }
    return { type, properties, required: Object.keys(properties), additionalProperties: false };
  }
  if (baseType === 'array') {
    return { type, items: toJsonSchema(schema.items) };
  }
  return { type };
}

/**
 * Analyse en JSON structuré : Gemini (modèle principal puis de repli), puis le relais si Gemini échoue
 * ou n'est pas configuré. Lève la dernière erreur si aucun fournisseur ne répond.
 */
export async function generateJson<T>(
  providers: AiProviders,
  input: AiInput,
  responseSchema: any,
  systemInstruction?: string
): Promise<AiResult<T>> {
  let lastError: unknown = new Error('Aucun fournisseur d’IA configuré.');

  if (providers.gemini) {
    try {
      return await callGemini<T>(providers.gemini, input, responseSchema, systemInstruction);
    } catch (err) {
      lastError = err;
    }
  }

  // Image dans un format que le relais ne lit pas (HEIC) : pas de relais possible
  const relayCanRead = !('image' in input) || relaySupportsImage(input.image.mimeType);
  if (providers.relay && relayCanRead) {
    try {
      const data = await callRelay(providers.relay, input, toJsonSchema(responseSchema), systemInstruction);
      return { data: data as T, model: `relay/${providers.relay.model}` };
    } catch (err) {
      lastError = err;
      console.warn('Relais IA en échec:', (err as Error)?.message);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Échec de l’appel à l’IA.');
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
