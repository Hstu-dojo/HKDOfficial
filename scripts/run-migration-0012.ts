import { readFileSync } from 'fs';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const url = (process.env.DATABASE_URL || '').trim();
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(url);

async function run() {
  try {
    const migration = readFileSync('drizzle/0012_manual_certificates.sql', 'utf8');
    // Split by semicolons and run each statement
    const statements = migration.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      console.log('Running:', stmt.substring(0, 80) + '...');
      await sql.unsafe(stmt);
    }
    console.log('Migration applied successfully!');
  } catch (e: any) {
    console.error('Migration failed:', e.message);
  } finally {
    await sql.end();
  }
}

run();
