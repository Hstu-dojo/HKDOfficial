#!/usr/bin/env node

// RBAC Seed Script - Standalone version
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { seedRBACData } from '../src/lib/rbac/seed.js';

async function main() {
  console.log('🌱 Starting RBAC seeding...');
  console.log('Environment check:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  try {
    await seedRBACData();
    console.log('✅ RBAC seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ RBAC seeding failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
