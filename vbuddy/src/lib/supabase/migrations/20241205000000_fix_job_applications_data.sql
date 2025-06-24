-- Migration to fix job applications data consistency
-- This ensures all job applications have proper status values and constraints

-- First, let's ensure all existing data has valid status values
UPDATE job_applications 
SET status = 'accepted' 
WHERE status = 'hired';

-- Add index for better performance on hired VAs queries
CREATE INDEX IF NOT EXISTS idx_job_applications_status_employer 
ON job_applications(status) 
WHERE status = 'accepted';

-- Add index for employer queries through jobs
CREATE INDEX IF NOT EXISTS idx_job_applications_job_employer 
ON job_applications(job_id, status);

-- Add composite index for VA dashboard queries
CREATE INDEX IF NOT EXISTS idx_job_applications_va_status 
ON job_applications(va_id, status);

-- Ensure referential integrity with better constraints
ALTER TABLE job_applications 
DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_status_check 
CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'));

-- Add updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for hired VAs for easier querying
CREATE OR REPLACE VIEW hired_vas_view AS
SELECT 
    ja.id as application_id,
    ja.va_id,
    ja.job_id,
    ja.created_at as hired_at,
    ja.updated_at,
    vp.full_name as va_name,
    vp.profile_picture_url,
    vp.headline,
    vp.primary_skills,
    j.title as job_title,
    j.hourly_rate_min,
    j.hourly_rate_max,
    j.employer_id,
    ep.full_name as employer_name,
    ep.company_name
FROM job_applications ja
JOIN va_profiles vp ON ja.va_id = vp.id
JOIN jobs j ON ja.job_id = j.id
JOIN employer_profiles ep ON j.employer_id = ep.id
WHERE ja.status = 'accepted';

-- Grant appropriate permissions
GRANT SELECT ON hired_vas_view TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW hired_vas_view IS 'Simplified view for querying hired VAs with all relevant information'; 