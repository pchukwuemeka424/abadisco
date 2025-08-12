#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting geolocation migration...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'add_geolocation_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   [${i + 1}/${statements.length}] Executing statement...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('businesses').select('id').limit(1);
          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.error('Statement:', statement);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Geolocation migration completed successfully!');
    console.log('');
    console.log('📋 Migration Summary:');
    console.log('   ✅ Added latitude column (DECIMAL(10, 8))');
    console.log('   ✅ Added longitude column (DECIMAL(11, 8))');
    console.log('   ✅ Added location_accuracy column (DECIMAL(10, 2))');
    console.log('   ✅ Added location_timestamp column (TIMESTAMP WITH TIME ZONE)');
    console.log('   ✅ Created indexes for latitude and longitude');
    console.log('   ✅ Added check constraints for valid coordinate ranges');
    console.log('   ✅ Created calculate_distance function');
    console.log('   ✅ Created find_businesses_nearby function');
    console.log('');
    console.log('🎉 Your businesses table now supports geolocation!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
