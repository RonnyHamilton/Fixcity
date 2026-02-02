import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPublicUsersTable() {
    console.log('🚀 Creating public_users table...\n');

    try {
        // Execute the SQL to create the table
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                -- Create public_users table
                CREATE TABLE IF NOT EXISTS public.public_users (
                    id TEXT PRIMARY KEY DEFAULT ('user_' || gen_random_uuid()::text),
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );

                -- Create index for faster email lookups
                CREATE INDEX IF NOT EXISTS idx_public_users_email ON public.public_users(email);

                -- Enable RLS
                ALTER TABLE public.public_users ENABLE ROW LEVEL SECURITY;

                -- Drop existing policies if they exist
                DROP POLICY IF EXISTS "Anyone can insert public users" ON public.public_users;
                DROP POLICY IF EXISTS "Anyone can read their own data" ON public.public_users;

                -- Create policies
                CREATE POLICY "Anyone can insert public users" 
                    ON public.public_users FOR INSERT 
                    WITH CHECK (true);

                CREATE POLICY "Anyone can read their own data" 
                    ON public.public_users FOR SELECT 
                    USING (true);
            `
        });

        if (error) {
            throw error;
        }

        console.log('✅ Successfully created public_users table!');
        console.log('✅ Created index on email column');
        console.log('✅ Enabled RLS and created policies\n');

        // Verify table was created
        const { data: tableCheck, error: checkError } = await supabase
            .from('public_users')
            .select('*')
            .limit(0);

        if (checkError) {
            console.warn('⚠️  Warning: Could not verify table creation:', checkError.message);
        } else {
            console.log('✅ Table verified and ready to use!\n');
        }

    } catch (error: any) {
        console.error('❌ Error creating table:', error.message);
        console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
        console.log(`
CREATE TABLE IF NOT EXISTS public.public_users (
    id TEXT PRIMARY KEY DEFAULT ('user_' || gen_random_uuid()::text),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_users_email ON public.public_users(email);
ALTER TABLE public.public_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert public users" ON public.public_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their own data" ON public.public_users FOR SELECT USING (true);
        `);
        process.exit(1);
    }
}

// Run the migration
createPublicUsersTable();
