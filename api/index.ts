import { createApp } from '../server/src/app';
import { connectDatabase } from '../server/src/config/database';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err);
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}
