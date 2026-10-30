import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

let isConnected = false;
let reconnectTimer: NodeJS.Timeout | null = null;

export const connectDatabase = async (retries = 3, delayMs = 3000): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 15000,
      });

      isConnected = true;
      logger.info({ uri: env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@') }, 'Connected to MongoDB Atlas/Database successfully');
      return true;
    } catch (error) {
      isConnected = false;
      logger.warn({ attempt, retries, err: (error as Error).message }, 'Failed to connect to MongoDB');
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  // Schedule background reconnect attempt if initial connection fails
  if (!reconnectTimer) {
    reconnectTimer = setInterval(async () => {
      if (mongoose.connection.readyState !== 1) {
        try {
          await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
          isConnected = true;
          logger.info('Background reconnection to MongoDB succeeded');
          if (reconnectTimer) {
            clearInterval(reconnectTimer);
            reconnectTimer = null;
          }
        } catch {
          // Keep retrying quietly in background
        }
      }
    }, 10000);
  }

  return false;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting from MongoDB');
  }
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});
