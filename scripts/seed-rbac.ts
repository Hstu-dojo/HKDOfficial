#!/usr/bin/env tsx

// RBAC Seed Script - TypeScript version
//@ts-ignore
import 'dotenv/config';

async function main() {
  console.log('🌱 Starting RBAC seeding...');
  console.log('Environment check:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.error('Please make sure your .env.local or .env file contains DATABASE_URL');
    process.exit(1);
  }

  try {
    // Dynamic import to avoid module resolution issues
    const { seedRBACData } = await import('../src/lib/rbac/seed.js');
    await seedRBACData();
    console.log('✅ RBAC seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ RBAC seeding failed:', error);
    console.error('\nPossible causes:');
    console.error('1. Database connection failed');
    console.error('2. Database schema not migrated');
    console.error('3. Missing required tables');
    console.error('4. Module import error');
    console.error('\nTry running: npm run db:push or npm run db:migrate first');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
