import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import logger, { httpLogger } from './logger.js';
import { analyzeBodySchema, validateAndDecodeImage, openAIResultSchema } from './validators.js';
import { getOpenAIClient, analyzeCandlesWithVision } from './openaiClient.js';
import { authMiddleware } from './auth.js';

const app = express();

// Segurança e parsing
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Token'],
  optionsSuccessStatus: 204,
  preflightContinue: false
}));
app.use(express.json({ limit: process.env.REQUEST_LIMIT || '6mb' }));
app.use(httpLogger);

// Rate limit por token (RPS)
const tokenLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 1000), // 1 segundo
  max: Number(process.env.RATE_LIMIT_RPS || 5), // requisições por segundo por token
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      return auth.substring('Bearer '.length).trim();
    }
    const xtoken = req.headers['x-api-token'];
    return xtoken ? String(xtoken).trim() : 'NO_TOKEN';
  },
  message: { error: 'Limite de requisições excedido' }
});

// Todas as rotas (exceto OPTIONS) exigem token
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  return authMiddleware(req, res, next);
});
// Aplica rate limit por token após autenticação (exceto OPTIONS)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  return tokenLimiter(req, res, next);
});

// Endpoint principal
app.post('/analyze', async (req, res, next) => {
  try {
    const parsed = analyzeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({ error: 'Validação falhou', details: messages });
    }
    const { imageBase64, context } = parsed.data;

    // Decodifica e valida imagem
    const { dataUrl } = await validateAndDecodeImage(imageBase64);

    // Cliente OpenAI
    const client = getOpenAIClient();

    // Análise via Vision
    const rawResult = await analyzeCandlesWithVision({
      client,
      imageDataUrl: dataUrl,
      symbol: context?.symbol,
      timeframe: context?.timeframe || '1m'
    });

    // Valida contrato da resposta
    const resultValidation = openAIResultSchema.safeParse(rawResult);
    if (!resultValidation.success) {
      logger.warn({ rawResult }, 'Resposta da OpenAI fora do esquema esperado');
      return res.status(502).json({ error: 'Resposta fora do formato esperado' });
    }

    const result = resultValidation.data;
    return res.json({
      sinal: result.sinal,
      confianca: result.confianca,
      explicacao: result.explicacao
    });
  } catch (err) {
    next(err);
  }
});

// Middleware de erro
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'Erro interno ao processar /analyze');
  if (err.name === 'TimeoutError') {
    return res.status(504).json({ error: 'Timeout ao consultar OpenAI' });
  }
  return res.status(500).json({ error: 'Erro interno', message: err.message });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  logger.info(`Servidor iniciado em http://localhost:${port}`);
});