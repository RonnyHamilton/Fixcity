-- Migration to add user_phone column to reports table
-- Run this if your database was created before this column was added

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS user_phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.reports.user_phone IS 'Optional phone number of the user who submitted the report';
