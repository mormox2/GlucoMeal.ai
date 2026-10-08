import 'dotenv/config';
import express from 'express';
import path from 'path';
import { TUNISIAN_FOOD_DATABASE } from './src/data/tunisianFoodDatabase';
import { TUNISIAN_DATASET, TUNISIAN_DATASET_100 } from './src/types/benchmark';
import { runAutomatedBenchmark } from './src/utils/benchmarkEvaluator';
import { getGeminiClient, getGeminiModel } from './server/gemini';
import {
  AnalysisFailure,
  MAX_MEAL_TEXT_LENGTH,
  analyzeMealPhoto,
  analyzeMealText,
  analyzeNutritionLabel,
} from './server/analysis';
import { parseTextLocally } from './server/localParser';
import { lookupBarcodeProduct } from './server/barcode';

const app = express();

// Derrière le proxy Vercel, l'IP du client est lue dans X-Forwarded-For (nécessaire au limiteur de débit)
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : process.env.VERCEL ? 1 : false);

// Origines autorisées à appeler l'API depuis un autre site (en plus de l'origine de l'application elle-même)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://glucomeal-ai.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(req: express.Request, origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Même origine que l'application (ex. http://localhost:3000 en développement, prévisualisations)
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// En-têtes de sécurité et CORS restreint (les en-têtes des pages statiques sont dans vercel.json)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/api')) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Cache-Control', 'no-store');
  }

  const origin = req.headers.origin;
  const originAllowed = Boolean(origin && isAllowedOrigin(req, origin));
  if (origin && originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(originAllowed ? 204 : 403);
  }
  next();
});

// Limiteur de débit en mémoire. Chaque limiteur a son propre compteur par IP (la clé ne dépend pas du
// chemin). Sur Vercel, chaque instance a sa mémoire : la limite est donc par instance ; un stockage
// partagé (Redis / Vercel KV) serait nécessaire pour une limite globale.
function rateLimiter(maxRequests: number, windowMs: number, customMessage?: string) {
  const hits = new Map<string, { count: number; resetTime: number }>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetTime) {
      // Purge des compteurs expirés pour éviter une croissance illimitée de la mémoire
      if (hits.size > 10_000) {
        for (const [key, value] of hits) {
          if (now > value.resetTime) hits.delete(key);
        }
      }
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        error: customMessage || 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        retryAfterSec: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    entry.count++;
    next();
  };
}

// Les photos sont réduites côté client ; la limite des fonctions Vercel est de 4,5 Mo
app.use(express.json({ limit: '5mb' }));

// Compatibility rewrite if /api prefix is omitted by hosting environment
app.use((req, res, next) => {
  if (
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/assets') &&
    !req.url.startsWith('/src') &&
    !req.url.startsWith('/public') &&
    !req.url.startsWith('/@') &&
    !req.url.startsWith('/node_modules') &&
    req.url !== '/' &&
    !path.extname(req.url.split('?')[0])
  ) {
    req.url = '/api' + req.url;
  }
  next();
});

// API Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GlucoMeal AI Engine', version: '1.0.0' });
});

// L'ancienne API de synchronisation par code (/api/sync/push et /api/sync/pull) n'avait aucune
// authentification : n'importe qui pouvait lire ou écraser un dossier médical. Elle est retirée ;
// la synchronisation passe uniquement par Firestore (règles d'accès par propriétaire).
app.all('/api/sync/*', (req, res) => {
  res.status(410).json({
    error: 'Cette API de synchronisation a été retirée. Utilisez la synchronisation Firestore de l’application.',
    code: 'SYNC_API_REMOVED',
  });
});

// Food search API
app.get('/api/foods', (req, res) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  const category = (req.query.category as string) || '';

  let results = TUNISIAN_FOOD_DATABASE;
  if (category) {
    results = results.filter((f) => f.category === category);
  }
  if (q) {
    results = results.filter(
      (f) =>
        f.name_fr.toLowerCase().includes(q) ||
        f.name_tn.toLowerCase().includes(q) ||
        (f.name_ar && f.name_ar.includes(q))
    );
  }
  res.json({ total: results.length, foods: results });
});

// Benchmark : jeu de référence (5 repas) ou jeu étendu SYNTHÉTIQUE (100 variantes générées)
app.get('/api/benchmark/dataset', (req, res) => {
  const count = parseInt(req.query.count as string, 10);
  const meals = count === 100 ? TUNISIAN_DATASET_100 : TUNISIAN_DATASET;
  res.json({
    name: count === 100 ? 'TUNISIAN_DATASET_100' : 'TUNISIAN_DATASET',
    synthetic: count === 100,
    total: meals.length,
    meals,
  });
});

// Benchmark : évaluation des prédictions RÉELLES fournies (aucune prédiction n'est simulée)
app.post('/api/benchmark/evaluate', (req, res) => {
  try {
    const { predictions, count } = req.body || {};
    const cleanPredictions: Record<string, number> = {};
    if (predictions && typeof predictions === 'object') {
      for (const [id, value] of Object.entries(predictions)) {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) cleanPredictions[id] = value;
      }
    }
    const targetDataset = count === 100 ? TUNISIAN_DATASET_100 : TUNISIAN_DATASET;
    res.json({ success: true, report: runAutomatedBenchmark(targetDataset, cleanPredictions) });
  } catch (err: any) {
    console.error('Benchmark evaluation error:', err);
    res.status(500).json({ error: 'Erreur lors de l’évaluation du benchmark', code: 'SERVER_ERROR' });
  }
});

// Benchmark : inférence réelle sur une PHOTO du repas de référence, avec le même pipeline que
// l'application (le modèle ne reçoit ni le nom, ni le poids, ni les ingrédients du plat).
app.post('/api/benchmark/live-vision', rateLimiter(30, 60 * 1000, 'Trop de tests de vision.'), async (req, res) => {
  const startTime = Date.now();
  const { mealId, imageBase64 } = req.body || {};
  const targetMeal = [...TUNISIAN_DATASET, ...TUNISIAN_DATASET_100].find((m) => String(m.id) === String(mealId));
  if (!targetMeal) {
    return res.status(404).json({ error: 'Repas de référence introuvable.', code: 'MEAL_NOT_FOUND' });
  }
  if (!imageBase64) {
    return res.status(400).json({ error: 'Une photo du repas est nécessaire pour un test de vision.', code: 'IMAGE_REQUIRED' });
  }
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Service d’IA non configuré : test impossible.', code: 'AI_UNAVAILABLE' });
  }

  try {
    const analysis = await analyzeMealPhoto(ai, imageBase64);
    const predictedCarbs = analysis.total_carbs;
    const deltaCarbs = Math.abs(predictedCarbs - targetMeal.carbs_g);
    const relativeErrorPct = Number(((deltaCarbs / targetMeal.carbs_g) * 100).toFixed(1));

    res.json({
      success: true,
      meal_id: targetMeal.id,
      meal_name: targetMeal.name_fr,
      reference_carbs_g: targetMeal.carbs_g,
      predicted_carbs_g: predictedCarbs,
      delta_carbs_g: deltaCarbs,
      relative_error_pct: relativeErrorPct,
      passed_clinical_threshold: relativeErrorPct <= 15.0,
      insulin_impact_units: Number((deltaCarbs / 10).toFixed(1)),
      latency_ms: Date.now() - startTime,
      model: getGeminiModel(),
      detected_meal_name: analysis.meal_name,
      detected_components: analysis.items.map((item) => ({
        name: item.name_fr,
        weight_g: item.estimated_weight_g,
        carbs_per_100g: item.carbs_per_100g,
        calculated_carbs_g: item.calculated_carbs,
        confidence: item.confidence,
      })),
      visual_notes: analysis.notes,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof AnalysisFailure) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error('Live vision benchmark test error:', err);
    res.status(500).json({ error: 'Erreur lors du test de vision en direct', code: 'SERVER_ERROR' });
  }
});

// Réponse d'erreur d'analyse : on ne renvoie JAMAIS de glucides inventés (risque de surdosage d'insuline).
// Le client affiche le message et propose une nouvelle tentative ou une saisie manuelle.
function sendAnalysisError(res: express.Response, status: number, code: string, error: string) {
  return res.status(status).json({ error, code });
}

// Analyse d'un repas (photo, texte, voix, code-barres, étiquette)
app.post('/api/analyze-meal', rateLimiter(30, 60 * 1000, 'Trop de requêtes d’analyse. Veuillez patienter une minute.'), async (req, res) => {
  try {
    const { mode, image, text, audioTranscript, barcode } = req.body || {};
    const ai = getGeminiClient();

    // Photo du repas
    if (mode === 'photo' && image) {
      if (!ai) {
        return sendAnalysisError(
          res,
          503,
          'AI_UNAVAILABLE',
          'Analyse photo indisponible (service d’IA non configuré). Décrivez votre repas par texte ou saisissez-le manuellement.'
        );
      }
      return res.json(await analyzeMealPhoto(ai, image));
    }

    // Texte ou transcription vocale
    if (mode === 'text' || mode === 'voice') {
      const inputText = String(text || audioTranscript || '').trim();
      if (!inputText) {
        return sendAnalysisError(res, 400, 'TEXT_MISSING', 'Aucun texte ou transcript audio fourni.');
      }
      if (inputText.length > MAX_MEAL_TEXT_LENGTH) {
        return sendAnalysisError(res, 400, 'TEXT_TOO_LONG', `Description trop longue (${MAX_MEAL_TEXT_LENGTH} caractères maximum).`);
      }
      const voiceLang = String(req.body.voiceLang || 'fr-FR');
      const isArabicInput = voiceLang === 'ar-TN' || /[؀-ۿ]/.test(inputText);

      if (ai) {
        try {
          return res.json(await analyzeMealText(ai, inputText, isArabicInput));
        } catch (err) {
          // Description sans aliment : inutile d'essayer l'analyse locale
          if (err instanceof AnalysisFailure && err.code === 'NO_FOOD_RECOGNIZED') throw err;
          console.error('Analyse texte IA en échec, analyse locale :', (err as Error).message);
        }
      }

      const localAnalysis = parseTextLocally(inputText);
      if (!localAnalysis) {
        return sendAnalysisError(
          res,
          422,
          'NO_FOOD_RECOGNIZED',
          'Aucun aliment reconnu dans votre description. Précisez les aliments ou ajoutez-les manuellement depuis la base.'
        );
      }
      return res.json(localAnalysis);
    }

    // Code-barres
    if (mode === 'barcode') {
      const code = String(barcode || '').replace(/[^0-9]/g, '');
      if (!code) {
        return sendAnalysisError(res, 400, 'BARCODE_MISSING', 'Aucun code-barres fourni.');
      }
      const lookup = await lookupBarcodeProduct(code);
      if ('error' in lookup) {
        return sendAnalysisError(res, lookup.status, lookup.code, lookup.error);
      }
      return res.json(lookup);
    }

    // Photo d'étiquette nutritionnelle
    if ((mode === 'label_photo' || mode === 'label') && image) {
      if (!ai) {
        return sendAnalysisError(
          res,
          503,
          'AI_UNAVAILABLE',
          'Lecture d’étiquette indisponible (service d’IA non configuré). Saisissez les glucides indiqués sur l’emballage.'
        );
      }
      return res.json(await analyzeNutritionLabel(ai, image));
    }

    return sendAnalysisError(res, 400, 'INVALID_REQUEST', 'Mode d’analyse inconnu ou données manquantes.');
  } catch (err) {
    if (err instanceof AnalysisFailure) {
      return sendAnalysisError(res, err.status, err.code, err.message);
    }
    console.error('Server meal analysis error:', err);
    res.status(500).json({ error: 'Erreur lors de l’analyse du repas', code: 'SERVER_ERROR' });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GlucoMeal AI Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
