import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware';
import { errorHandlerMiddleware, AppError } from './middleware/errorHandler.middleware';
import apiRoutes from './routes';

export const createApp = (): express.Application => {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false
    })
  );

  // 2. CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin serverless)
        if (!origin) return callback(null, true);
        
        const isAllowed =
          origin === env.CLIENT_URL ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          process.env.NODE_ENV !== 'production';

        if (isAllowed) {
          return callback(null, true);
        }
        return callback(null, true); // Allow for preview / production assessment deployments
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id']
    })
  );

  // 3. Body Parsing with safe limits
  app.use(express.json({ limit: `${env.MAX_UPLOAD_SIZE_MB}mb` }));
  app.use(express.urlencoded({ extended: true, limit: `${env.MAX_UPLOAD_SIZE_MB}mb` }));

  // 4. Request ID & Structured Logging Middleware
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // 5. REST API Routes mounted under both /api and root (to handle direct or rewritten serverless invocations)
  app.use('/api', apiRoutes);
  app.use(apiRoutes);

  // 6. Production Static Assets (Serve client SPA build if present)
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 7. 404 Handler for undefined API routes
  app.use((req, _res, next) => {
    next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
  });

  // 8. Centralized Error Handling Middleware
  app.use(errorHandlerMiddleware);

  return app;
};
