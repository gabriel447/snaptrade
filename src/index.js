import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger, { httpLogger } from './logger.js';
import { analyzeBodySchema, validateAndDecodeImage, openAIResultSchema } from './validators.js';
import { getOpenAIClient, analyzeCandlesWithVision } from './openaiClient.js';
import { authMiddleware } from './auth.js';

const app = express();

// Segurança e parsing
app.use(helmet());
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

// Todas as rotas exigem token
app.use(authMiddleware);
// Aplica rate limit por token após autenticação
app.use(tokenLimiter);

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