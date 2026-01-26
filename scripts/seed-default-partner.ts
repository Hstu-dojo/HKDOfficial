#!/usr/bin/env tsx

// Seed Default Partner
//@ts-ignore
import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { partners } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seedDefaultPartner() {
  console.log('🌱 Seeding default partner...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  try {
    // Check if HSTU Campus partner already exists
    const existingPartner = await db.query.partners.findFirst({
      where: eq(partners.slug, 'hstu-campus')
    });

    if (existingPartner) {
      console.log('✅ Default partner "HSTU Campus" already exists');
      return;
    }

    // Create HSTU Campus as the default partner
    await db.insert(partners).values({
      name: 'HSTU Campus',
      slug: 'hstu-campus',
      description: 'Main HSTU Campus Karate Dojo - The primary training location',
      location: 'Hajee Mohammad Danesh Science and Technology University, Dinajpur',
      contactEmail: 'karate@hstu.ac.bd',
      isActive: true,
    });

    console.log('✅ Default partner "HSTU Campus" created successfully!');
  } catch (error) {
    console.error('❌ Failed to seed default partner:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedDefaultPartner();
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
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
