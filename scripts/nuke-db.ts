//@ts-nocheck
// Script to completely reset the database
// ⚠️ WARNING: This will delete ALL tables and data!

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️  WARNING: This will DELETE ALL TABLES AND DATA in your database!');
console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown');

rl.question('\nAre you absolutely sure? Type "DELETE EVERYTHING" to confirm: ', async (answer) => {
  if (answer !== 'DELETE EVERYTHING') {
    console.log('❌ Aborted. Database was not modified.');
    rl.close();
    process.exit(0);
  }

  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('\n🗑️  Dropping all tables...');
    
    await sql`
      DO $$ 
      DECLARE
          r RECORD;
      BEGIN
          -- Drop all tables
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
          
          -- Drop all sequences  
          FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
              EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
          END LOOP;
          
          -- Drop all custom types
          FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
              EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
      END $$;
    `;
    
    console.log('✅ All tables dropped successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:generate');
    console.log('   2. Run: npm run db:migrate');
    
    await sql.end();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
});
