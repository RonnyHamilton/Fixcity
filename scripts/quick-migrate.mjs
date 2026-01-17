// Quick migration script to add user_phone column
// Run with: node scripts/quick-migrate.mjs

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('🔄 Checking database schema...\n');

    // Check if column exists by trying to select it
    const { error: checkError } = await supabase
        .from('reports')
        .select('user_phone')
        .limit(1);

    if (!checkError) {
        console.log('✅ user_phone column already exists! No migration needed.');
        return;
    }

    if (checkError && !checkError.message.includes('column "user_phone" does not exist')) {
        console.error('❌ Unexpected error:', checkError.message);
        process.exit(1);
    }

    console.log('📝 user_phone column not found. Manual migration required.\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to your Supabase Dashboard SQL Editor:');
    console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);
    console.log('2. Copy and paste this SQL:\n');
    console.log('   ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_phone text;\n');
    console.log('3. Click "Run" to execute\n');
    console.log('Alternatively, run the SQL from: supabase_migration_add_user_phone.sql\n');
}

migrate().catch(err => {
    console.error('❌ Migration check failed:', err);
    process.exit(1);
});
