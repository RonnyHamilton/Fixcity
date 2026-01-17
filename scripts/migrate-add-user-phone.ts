import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔄 Running database migration...');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(process.cwd(), 'supabase_migration_add_user_phone.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log();

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });

        if (error) {
            // If exec_sql doesn't exist, try direct column addition
            console.log('⚠️  exec_sql RPC not found, trying direct approach...');

            const { error: alterError } = await supabase
                .from('reports')
                .select('user_phone')
                .limit(1);

            if (alterError && alterError.message.includes('column "user_phone" does not exist')) {
                console.log('✅ Column needs to be added. Please run the migration manually:');
                console.log('   1. Go to your Supabase Dashboard SQL Editor');
                console.log('   2. Paste the contents of supabase_migration_add_user_phone.sql');
                console.log('   3. Click Run');
                console.log();
                console.log('   Or use the online migration tool at:');
                console.log(`   ${supabaseUrl}/project/default/sql`);
                process.exit(1);
            } else if (!alterError) {
                console.log('✅ Column already exists! No migration needed.');
                process.exit(0);
            }

            throw error;
        }

        console.log('✅ Migration completed successfully!');
        console.log('📋 Data:', data);

        // Verify the column was added
        const { error: verifyError } = await supabase
            .from('reports')
            .select('user_phone')
            .limit(1);

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError.message);
            process.exit(1);
        }

        console.log('✅ Verification successful! The user_phone column is now available.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        console.log();
        console.log('📝 Manual Migration Instructions:');
        console.log('   1. Go to your Supabase Dashboard SQL Editor');
        console.log(`   2. URL: ${supabaseUrl.replace('https://', 'https://app.')}/project/default/sql`);
        console.log('   3. Run this SQL:');
        console.log();
        console.log('   ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_phone text;');
        console.log();
        process.exit(1);
    }
}

// Run the migration
runMigration();
