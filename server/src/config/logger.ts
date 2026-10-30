import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { env } from './env';

const isProduction = env.NODE_ENV === 'production' || !!process.env.VERCEL;

const streams: pino.StreamEntry[] = [];

if (!isProduction) {
  try {
    streams.push({
      level: env.LOG_LEVEL as pino.Level,
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      })
    });
  } catch {
    streams.push({
      level: env.LOG_LEVEL as pino.Level,
      stream: process.stdout
    });
  }

  // File stream for local debugging
  try {
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.resolve(process.cwd(), env.LOG_FILE_PATH);
    const fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    streams.push({
      level: env.LOG_LEVEL as pino.Level,
      stream: fileStream
    });
  } catch (err) {
    // Ignore in read-only environments
  }
} else {
  // Production / Serverless: Output raw JSON directly to stdout (no worker threads)
  streams.push({
    level: env.LOG_LEVEL as pino.Level,
    stream: process.stdout
  });
}

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'apiKey',
        'password',
        'token',
        'secret',
        '*.apiKey',
        '*.password'
      ],
      remove: true
    },
    base: {
      env: env.NODE_ENV
    }
  },
  pino.multistream(streams)
);
