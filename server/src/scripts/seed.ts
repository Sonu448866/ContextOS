import { connectDatabase, disconnectDatabase } from '../config/database';
import { SeedService } from '../services/seed.service';
import { logger } from '../config/logger';

async function main() {
  try {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('❌ Could not connect to MongoDB for seeding');
      process.exit(1);
    }

    const force = process.argv.includes('--force');
    const result = await SeedService.seedDemoProject(force);
    console.log('✅ Seed result:', result.message);
    console.log('📦 Project ID:', result.projectId);

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Seed script error');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
