import { createApp } from '../server/src/app';
import { connectDatabase } from '../server/src/config/database';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (err: any) {
    console.error('Database connection error in Vercel function:', err?.message || err);
  }

  try {
    if (!appInstance) {
      appInstance = createApp();
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error('Express dispatch error in Vercel function:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal Server Error',
        details: err?.message || 'Unexpected serverless dispatch error'
      });
    }
  }
}
