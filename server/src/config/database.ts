import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

let isConnected = false;
let reconnectTimer: NodeJS.Timeout | null = null;

// Global connection cache across serverless function invocations
let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDatabase = async (retries = 2, delayMs = 1500): Promise<boolean> => {
  // If already connected in Mongoose
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // If serverless cached connection exists
  if (cached.conn) {
    isConnected = true;
    return true;
  }

  const isServerless = !!process.env.VERCEL;

  for (let attempt = 1; attempt <= (isServerless ? 1 : retries); attempt++) {
    try {
      mongoose.set('strictQuery', true);
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        bufferCommands: false, // Fail immediately rather than hanging indefinitely
      });

      cached.conn = conn;
      isConnected = true;
      logger.info({ uri: env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@') }, 'Connected to MongoDB Atlas/Database successfully');
      return true;
    } catch (error) {
      isConnected = false;
      cached.conn = null;
      cached.promise = null;
      logger.warn({ attempt, retries, err: (error as Error).message }, 'Failed to connect to MongoDB');
      if (attempt < retries && !isServerless) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  // Schedule background reconnect attempt ONLY in persistent server mode (NOT serverless)
  if (!isServerless && !reconnectTimer) {
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
