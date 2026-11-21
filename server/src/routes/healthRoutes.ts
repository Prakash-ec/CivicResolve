import { Router, Request, Response } from 'express';
import { isFirebaseInitialized } from '../config/firebaseAdmin.js';
import { ENV } from '../config/env.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'CivicResolve Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: ENV.NODE_ENV,
    integrations: {
      firebaseAdmin: isFirebaseInitialized ? 'initialized' : 'deferred',
      geminiConfigured: Boolean(ENV.GEMINI_API_KEY),
      geminiModel: ENV.GEMINI_MODEL,
      groqConfigured: Boolean(ENV.GROQ_API_KEY),
      groqModel: 'openai/gpt-oss-120b',
    },
  });
});

export default router;
