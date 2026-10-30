import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { env } from './env';

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch {
    // Ignore if already created or sandbox restriction
  }
}

const logFilePath = path.resolve(process.cwd(), env.LOG_FILE_PATH);

const streams: pino.StreamEntry[] = [
  {
    level: env.LOG_LEVEL as pino.Level,
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    })
  }
];

// File stream for persistent logging when writable
try {
  const fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  streams.push({
    level: env.LOG_LEVEL as pino.Level,
    stream: fileStream
  });
} catch (err) {
  console.warn('⚠️ Could not initialize file logging stream:', err);
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
