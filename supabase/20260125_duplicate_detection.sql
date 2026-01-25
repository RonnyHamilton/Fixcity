-- Create report_evidence table
CREATE TABLE IF NOT EXISTS report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    submitted_by_user_id TEXT, -- user_id from auth or report
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add/Ensure columns on reports table
DO $$ 
BEGIN 
    -- parent_report_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'parent_report_id') THEN
        ALTER TABLE reports ADD COLUMN parent_report_id TEXT REFERENCES reports(id);
    END IF;

    -- report_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'report_count') THEN
        ALTER TABLE reports ADD COLUMN report_count INT DEFAULT 1;
    END IF;

    -- latest_reported_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'latest_reported_at') THEN
        ALTER TABLE reports ADD COLUMN latest_reported_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- resolved_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'resolved_at') THEN
        ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;

    -- reopened_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'reopened_at') THEN
        ALTER TABLE reports ADD COLUMN reopened_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add index for performance on parent_report_id and category
CREATE INDEX IF NOT EXISTS idx_reports_parent_id ON reports(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
-- Standard index for lat/long for duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_reports_lat_long ON reports(latitude, longitude);
