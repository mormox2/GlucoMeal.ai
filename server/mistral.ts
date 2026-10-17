// Mistral AI (API La Plateforme, société et hébergement dans l'Union européenne) : fournisseur de relais
// utilisé quand Gemini est indisponible (quota épuisé, panne, délai dépassé).
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Modèle multimodal (texte et images) configurable : les modèles sont régulièrement renouvelés
export function getMistralModel(): string {
  return process.env.MISTRAL_MODEL || 'mistral-small-latest';
}

function getMistralTimeoutMs(): number {
  return Number(process.env.MISTRAL_TIMEOUT_MS) || 25000;
}

export interface MistralClient {
  apiKey: string;
}

export function getMistralClient(): MistralClient | null {
  return process.env.MISTRAL_API_KEY ? { apiKey: process.env.MISTRAL_API_KEY } : null;
}

// Formats d'image acceptés par l'API Mistral (HEIC n'en fait pas partie)
const MISTRAL_IMAGE_TYPES = /^image\/(jpeg|png|webp|gif)$/;

export function mistralSupportsImage(mimeType: string): boolean {
  return MISTRAL_IMAGE_TYPES.test(mimeType);
}

/**
 * Appelle Mistral en mode JSON structuré. Comme pour Gemini, les consignes passent par un message
 * système : les données de l'utilisateur (texte, image) restent séparées des instructions.
 */
export async function callMistral(
  client: MistralClient,
  userContent: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: string }>,
  jsonSchema: Record<string, unknown>,
  systemInstruction?: string
): Promise<string> {
  const messages = [
    ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
    { role: 'user', content: userContent },
  ];
  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify({
      model: getMistralModel(),
      messages,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'glucomeal_analysis', schema: jsonSchema, strict: true },
      },
    }),
    signal: AbortSignal.timeout(getMistralTimeoutMs()),
  });
  if (!response.ok) {
    // Le corps d'erreur n'est pas recopié : il peut contenir des détails sans intérêt pour l'utilisateur
    throw new Error(`Mistral HTTP ${response.status}`);
  }
  const payload: any = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const raw = typeof content === 'string' ? content.trim() : '';
  if (!raw) throw new Error('Réponse vide du modèle.');
  return raw;
}
