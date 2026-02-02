-- Create public_users table for simple name+email login
-- No changes to existing tables - additive only

CREATE TABLE IF NOT EXISTS public.public_users (
  id TEXT PRIMARY KEY DEFAULT ('public_' || gen_random_uuid()::text),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast email lookups (for uniqueness checks)
CREATE INDEX IF NOT EXISTS idx_public_users_email ON public.public_users(email);

-- Optional: Add comment for documentation
COMMENT ON TABLE public.public_users IS 'Stores public users who login with name + email only. No authentication.';

