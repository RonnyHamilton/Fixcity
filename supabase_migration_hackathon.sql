-- FixCity Hackathon Database Migration
-- Run this after backing up your database

-- Add rejection tracking
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add audit timestamp fields
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Add audit name fields
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_by_name text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_by_name text;

-- Add duplicate tracking enhancement
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS last_reported_at timestamptz DEFAULT now();

-- Add index for faster duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_reports_category_status ON public.reports(category, status);
CREATE INDEX IF NOT EXISTS idx_reports_parent_id ON public.reports(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports(latitude, longitude);

-- Update existing records to set last_reported_at from created_at
UPDATE public.reports SET last_reported_at = created_at WHERE last_reported_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.reports.rejection_reason IS 'Reason provided by officer when rejecting a report';
COMMENT ON COLUMN public.reports.assigned_at IS 'Timestamp when technician was assigned';
COMMENT ON COLUMN public.reports.resolved_at IS 'Timestamp when report was marked as resolved';
COMMENT ON COLUMN public.reports.assigned_by_name IS 'Name of officer who assigned the technician';
COMMENT ON COLUMN public.reports.resolved_by_name IS 'Name of technician who resolved the issue';
COMMENT ON COLUMN public.reports.last_reported_at IS 'Timestamp of most recent report (used for duplicate tracking)';
