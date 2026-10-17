import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

// Gemini simulé (aucun appel réseau) : il ne reconnaît aucun aliment dans la description.
const fakeAi = {
  models: {
    generateContent: async () => ({ text: JSON.stringify({ meal_name: 'Repas', components: [] }) }),
  },
};

vi.mock('../../server/gemini', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../server/gemini')>()),
  getGeminiClient: () => fakeAi,
}));

let server: Server;
let baseUrl = '';

beforeAll(async () => {
  process.env.VERCEL = '1'; // empêche le démarrage automatique du serveur Vite
  const { app } = await import('../../server');
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
});

async function analyzeText(text: string) {
  const res = await fetch(`${baseUrl}/api/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'text', text }),
  });
  return { status: res.status, data: await res.json() };
}

describe('POST /api/analyze-meal (texte) quand l’IA ne reconnaît rien', () => {
  it('utilise l’analyse locale comme second avis', async () => {
    const { status, data } = await analyzeText('2 tranches de pain + omelette + une pomme');
    expect(status).toBe(200);
    expect(data.items.map((i: any) => i.food_id ?? i.name_fr)).toEqual(['fec-01', 'Pomme']);
    expect(data.overall_confidence).toBe('medium');
  });

  it('répond 422 si l’analyse locale ne reconnaît rien non plus', async () => {
    const { status, data } = await analyzeText('salade verte et poisson grillé');
    expect(status).toBe(422);
    expect(data.code).toBe('NO_FOOD_RECOGNIZED');
  });
});
