import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

// API d'analyse sans clé Gemini : elle ne doit jamais inventer de glucides.
let server: Server;
let baseUrl = '';

beforeAll(async () => {
  process.env.VERCEL = '1'; // empêche le démarrage automatique du serveur Vite
  delete process.env.GEMINI_API_KEY;
  const { app } = await import('../../server');
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
});

async function analyze(body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/api/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

describe('POST /api/analyze-meal sans IA disponible', () => {
  it('photo : erreur 503 au lieu d’un couscous fictif', async () => {
    const { status, data } = await analyze({ mode: 'photo', image: 'data:image/jpeg;base64,AAAA' });
    expect(status).toBe(503);
    expect(data.code).toBe('AI_UNAVAILABLE');
    expect(data.items).toBeUndefined();
    expect(data.total_carbs).toBeUndefined();
  });

  it('étiquette : erreur 503', async () => {
    const { status } = await analyze({ mode: 'label_photo', image: 'data:image/jpeg;base64,AAAA' });
    expect(status).toBe(503);
  });

  it('texte non reconnu : erreur 422 au lieu d’un repas par défaut', async () => {
    const { status, data } = await analyze({ mode: 'text', text: 'salade verte et poisson grillé' });
    expect(status).toBe(422);
    expect(data.code).toBe('NO_FOOD_RECOGNIZED');
  });

  it('texte reconnu localement : aliments détectés, confiance moyenne', async () => {
    const { status, data } = await analyze({ mode: 'text', text: 'couscous au poulet' });
    expect(status).toBe(200);
    expect(data.items.map((i: any) => [i.name_fr.split(' ')[0], i.calculated_carbs])).toEqual([
      ['Couscous', 62],
      ['Poulet', 0],
    ]);
    expect(data.overall_confidence).toBe('medium');
  });

  it('code-barres vide : erreur 400 au lieu d’un produit de démonstration', async () => {
    const { status, data } = await analyze({ mode: 'barcode', barcode: '' });
    expect(status).toBe(400);
    expect(data.code).toBe('BARCODE_MISSING');
  });

  it('code-barres inconnu : erreur 404 au lieu de 25 g par défaut', async () => {
    const { status, data } = await analyze({ mode: 'barcode', barcode: '1234567' });
    expect(status).toBe(404);
    expect(data.code).toBe('BARCODE_NOT_FOUND');
  });

  it('mode inconnu : erreur 400', async () => {
    const { status } = await analyze({ mode: 'photo' });
    expect(status).toBe(400);
  });
});

describe('API de synchronisation retirée', () => {
  it.each(['/api/sync/pull/GLUCO-AAAA-BBBB', '/api/sync/push'])('%s répond 410', async (path) => {
    const res = await fetch(`${baseUrl}${path}`, { method: path.endsWith('push') ? 'POST' : 'GET' });
    expect(res.status).toBe(410);
  });
});
