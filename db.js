#!/usr/bin/env node

const { execSync } = require('child_process');

const command = process.argv[2];

switch (command) {
  case 'generate':
    console.log('🔄 Generating migration...');
    execSync('drizzle-kit generate', { stdio: 'inherit' });
    break;
  
  case 'migrate':
    console.log('🚀 Running migrations...');
    execSync('drizzle-kit migrate', { stdio: 'inherit' });
    break;
  
  case 'push':
    console.log('📤 Pushing schema to database...');
    execSync('drizzle-kit push', { stdio: 'inherit' });
    break;
  
  case 'studio':
    console.log('🎨 Opening Drizzle Studio...');
    execSync('drizzle-kit studio', { stdio: 'inherit' });
    break;
  
  case 'drop':
    console.log('⚠️  Dropping database...');
    execSync('drizzle-kit drop', { stdio: 'inherit' });
    break;
  
  case 'introspect':
    console.log('🔍 Introspecting database...');
    execSync('drizzle-kit introspect', { stdio: 'inherit' });
    break;
  
  default:
    console.log(`
Available commands:
  node db.js generate    - Generate migrations
  node db.js migrate     - Run migrations
  node db.js push        - Push schema to database
  node db.js studio      - Open Drizzle Studio
  node db.js drop        - Drop database
  node db.js introspect  - Introspect database
    `);
}
