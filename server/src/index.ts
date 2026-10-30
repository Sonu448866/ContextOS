import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

const startServer = async () => {
  const app = createApp();

  // Attempt database connection
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    logger.warn('⚠️ Server started without active MongoDB connection. Database operations will fail until connected.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        aiProvider: env.AI_PROVIDER,
        aiModel: env.AI_MODEL
      },
      `🚀 ContextOS Server listening on http://localhost:${env.PORT}`
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, terminating server gracefully');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
