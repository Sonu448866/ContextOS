import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.id;

  logger.info(
    {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    },
    `Incoming request: ${req.method} ${req.originalUrl}`
  );

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration
      },
      `Completed request: ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};
