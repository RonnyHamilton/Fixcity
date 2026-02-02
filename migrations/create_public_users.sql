-- Create a simple table to store public users
CREATE TABLE IF NOT EXISTS public.public_users (
    id TEXT PRIMARY KEY DEFAULT ('user_' || gen_random_uuid()::text),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_public_users_email ON public.public_users(email);

-- Enable RLS if needed
ALTER TABLE public.public_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert (adjust as needed)
CREATE POLICY "Anyone can insert public users" ON public.public_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read their own data" ON public.public_users FOR SELECT USING (true);
