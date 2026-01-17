# Database Schema Fix - user_phone Column Missing

## Issue
The application was failing with the error:
```
Failed to create report: Could not find the 'user_phone' column of 'reports' in the schema cache
```

## Solution
The `user_phone` column was missing from the `reports` table in the database.

## What Was Fixed
1. **Updated `supabase_schema.sql`**: Added `user_phone text` column to the reports table definition
2. **Created migration file**: `supabase_migration_add_user_phone.sql` to update existing databases

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase_migration_add_user_phone.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI (If you have it installed)
```bash
# From the fixcity directory
supabase db execute --file supabase_migration_add_user_phone.sql
```

### Option 3: Manual Update via Supabase Dashboard
1. Go to Table Editor in Supabase
2. Select the "reports" table
3. Click "Add Column"
4. Name: `user_phone`
5. Type: `text`
6. Allow nullable: Yes
7. Save

## Verification
After applying the migration, the report creation should work correctly. The `user_phone` column will store optional phone numbers for users who submit reports.
