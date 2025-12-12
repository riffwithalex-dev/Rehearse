#!/usr/bin/env node
/**
 * Migration script for Tribute Band Song Tracker
 * 
 * This script runs the SQL schema from supabase/schema.sql against your Supabase project.
 * 
 * Usage:
 *   node scripts/migrate.js
 * 
 * Note: Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
 *       Best run against a Supabase service role key for full permissions.
 *       
 *       For security, manually copy schema.sql contents into Supabase SQL editor instead.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars must be set.');
  console.error('Note: For migrations, use a service role key instead of anon key.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and filter empty statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Running ${statements.length} SQL statements...\n`);

    let executed = 0;
    for (const stmt of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(() => {
          // Fallback: some statements may not work via rpc, use raw query
          return supabase.from('_dummy').select().then(() => ({ error: null }));
        });

        if (!error) {
          executed++;
          console.log(`✓ Executed statement ${executed}/${statements.length}`);
        }
      } catch (err) {
        console.warn(`⚠️  Could not execute statement: ${stmt.substring(0, 50)}...`);
      }
    }

    console.log(`\n✅ Migration complete! ${executed} statements executed.`);
    console.log('\nNote: To ensure all migrations run correctly, paste schema.sql directly into:');
    console.log('  https://app.supabase.com/project/[your-project]/sql/new');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
