import { Request, Response } from 'express';
import { isDbConnected } from '../config/database';
import { env } from '../config/env';
import { QdrantService } from '../services/qdrant.service';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const dbStatus = isDbConnected();
  const qdrantStatus = await QdrantService.checkHealth();

  const isAiConfigured =
    env.AI_PROVIDER === 'mock' ||
    (env.AI_PROVIDER === 'groq' && !!(env.GROQ_API_KEY || env.AI_API_KEY)) ||
    (env.AI_PROVIDER === 'gemini' && !!(env.GEMINI_API_KEY || env.AI_API_KEY)) ||
    !!env.AI_API_KEY;

  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'degraded',
    service: 'ContextOS API',
    version: '1.2.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus,
      type: 'MongoDB'
    },
    vectorDb: {
      provider: 'Qdrant',
      connected: qdrantStatus.connected,
      collection: qdrantStatus.collectionName,
      pointsCount: qdrantStatus.pointsCount,
      dimension: qdrantStatus.vectorDimension
    },
    ai: {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      configured: isAiConfigured
    }
  });
};
