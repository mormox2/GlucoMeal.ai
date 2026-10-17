import { GoogleGenAI } from '@google/genai';
import type { AiInput, AiResult } from './ai';

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
export async function callGemini<T>(
  ai: GoogleGenAI,
  input: AiInput,
  responseSchema: any,
  systemInstruction?: string
): Promise<AiResult<T>> {
  const part = 'image' in input ? { inlineData: input.image } : { text: input.text };
  const models = [getGeminiModel(), getGeminiFallbackModel()].filter((m): m is string => Boolean(m));
  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [part] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          systemInstruction,
          abortSignal: AbortSignal.timeout(getGeminiTimeoutMs()),
        },
      });
      const raw = response.text?.trim();
      if (!raw) throw new Error('Réponse vide du modèle.');
      return { data: JSON.parse(raw) as T, model: `gemini/${model}` };
    } catch (err) {
      lastError = err;
      console.warn(`Gemini (${model}) en échec:`, (err as Error)?.message);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Échec de l’appel Gemini.');
}
