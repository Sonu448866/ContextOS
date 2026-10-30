import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load root or local .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/contextos'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  AI_PROVIDER: z.enum(['gemini', 'openai', 'anthropic', 'mock']).default('gemini'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gemini-1.5-flash'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  STALE_TASK_DAYS: z.coerce.number().default(14)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
