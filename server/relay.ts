// Fournisseur de relais compatible avec l'API OpenAI (chat completions), utilisé quand Gemini est
// indisponible (quota épuisé, panne, délai dépassé). Par défaut : NVIDIA NIM (build.nvidia.com), dont
// l'accès gratuit propose des modèles multimodaux. OpenRouter, Groq ou tout service compatible
// s'utilisent en changeant AI_RELAY_BASE_URL et AI_RELAY_MODEL, sans modifier le code.
import type { AiInput } from './ai';

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.2-90b-vision-instruct';

export interface RelayClient {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Format de réponse demandé au relais :
 * - « none » (défaut) : le schéma est décrit dans les consignes, la réponse est lue de façon tolérante.
 *   Fonctionne avec tous les modèles, y compris ceux qui ignorent response_format.
 * - « json_object » : mode JSON simple (OpenAI, Groq, NIM selon le modèle).
 * - « json_schema » : sortie structurée stricte (OpenAI, OpenRouter, Groq selon le modèle).
 */
type JsonMode = 'none' | 'json_object' | 'json_schema';

function getJsonMode(): JsonMode {
  const mode = process.env.AI_RELAY_JSON_MODE;
  return mode === 'json_object' || mode === 'json_schema' ? mode : 'none';
}

function getRelayTimeoutMs(): number {
  return Number(process.env.AI_RELAY_TIMEOUT_MS) || 25000;
}

export function getRelayClient(): RelayClient | null {
  const apiKey = process.env.AI_RELAY_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.AI_RELAY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.AI_RELAY_MODEL || DEFAULT_MODEL,
  };
}

// HEIC n'est pas lu par ces services : une telle photo n'est pas relayée
const RELAY_IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;

export function relaySupportsImage(mimeType: string): boolean {
  return RELAY_IMAGE_TYPES.test(mimeType);
}

/**
 * Extrait l'objet JSON d'une réponse de modèle : certains modèles l'entourent d'un bloc de code
 * Markdown ou d'une phrase malgré la consigne.
 */
export function extractJson(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('Réponse du modèle sans objet JSON.');
    return JSON.parse(text.slice(start, end + 1));
  }
}

/**
 * Appelle le relais et renvoie l'objet JSON produit.
 * - Texte : les consignes passent par un message système, la description de l'utilisateur par un
 *   message séparé (protection contre l'injection de consignes).
 * - Image : plusieurs modèles de vision (dont Llama 3.2 Vision) refusent un message système avec une
 *   image ; les consignes sont donc placées dans le même message, dans une partie texte distincte de
 *   l'image. Aucune saisie de l'utilisateur n'y est mêlée.
 */
export async function callRelay(
  client: RelayClient,
  input: AiInput,
  jsonSchema: Record<string, unknown>,
  systemInstruction = ''
): Promise<unknown> {
  const instructions = `${systemInstruction}\nRéponds uniquement avec un objet JSON valide, sans texte autour, conforme à ce JSON Schema :\n${JSON.stringify(jsonSchema)}`;
  const messages =
    'image' in input
      ? [
          {
            role: 'user',
            content: [
              { type: 'text', text: instructions },
              { type: 'image_url', image_url: { url: `data:${input.image.mimeType};base64,${input.image.data}` } },
            ],
          },
        ]
      : [
          { role: 'system', content: instructions },
          { role: 'user', content: input.text },
        ];

  const jsonMode = getJsonMode();
  const response = await fetch(`${client.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify({
      model: client.model,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
      ...(jsonMode === 'json_object' ? { response_format: { type: 'json_object' } } : {}),
      ...(jsonMode === 'json_schema'
        ? { response_format: { type: 'json_schema', json_schema: { name: 'glucomeal_analysis', schema: jsonSchema, strict: true } } }
        : {}),
    }),
    signal: AbortSignal.timeout(getRelayTimeoutMs()),
  });
  if (!response.ok) {
    // Le corps d'erreur n'est pas recopié : il peut contenir des détails sans intérêt pour l'utilisateur
    throw new Error(`Relais IA HTTP ${response.status}`);
  }
  const payload: any = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Réponse vide du modèle.');
  return extractJson(content);
}
