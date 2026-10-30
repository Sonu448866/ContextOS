import { Request, Response } from 'express';
import { isDbConnected } from '../config/database';
import { env } from '../config/env';

export const getHealth = (_req: Request, res: Response): void => {
  const dbStatus = isDbConnected();

  res.status(dbStatus ? 200 : 503).json({
    status: dbStatus ? 'healthy' : 'degraded',
    service: 'ContextOS API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus,
      type: 'MongoDB'
    },
    ai: {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      configured: env.AI_PROVIDER === 'mock' || !!env.AI_API_KEY
    }
  });
};
