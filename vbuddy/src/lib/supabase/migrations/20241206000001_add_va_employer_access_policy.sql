-- Migration to allow VAs to read employer names for jobs they're associated with
-- This enables VAs to see employer information for jobs they've applied to or been hired for

-- First, let's add a policy to allow VAs to read employer_profiles 
-- but only for employers whose jobs they have applied to or been hired for
CREATE POLICY "VAs can view employer profiles for associated jobs"
    ON employer_profiles FOR SELECT
    USING (
        -- Allow if the current user is a VA and has applied to or been hired for a job by this employer
        EXISTS (
            SELECT 1
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.va_id = auth.uid()
            AND j.employer_id = employer_profiles.id
        )
    );

-- Also add a policy to allow VAs to read company profiles for associated employers
-- This is useful if we want to show company information as well
CREATE POLICY "VAs can view company profiles for associated jobs"
    ON employer_company_profiles FOR SELECT
    USING (
        -- Allow if the current user is a VA and the company is associated with an employer
        -- whose job they have applied to or been hired for
        EXISTS (
            SELECT 1
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            JOIN employer_profiles ep ON j.employer_id = ep.id
            WHERE ja.va_id = auth.uid()
            AND ep.company_id = employer_company_profiles.id
        )
    );

-- Create a view that makes it easier for VAs to get employer information for their jobs
-- This view will automatically filter based on the RLS policies above
CREATE OR REPLACE VIEW va_job_employers AS
SELECT 
    j.id as job_id,
    j.title as job_title,
    j.employer_id,
    ep.full_name as employer_name,
    ep.company_id,
    ecp.name as company_name,
    ecp.logo_url as company_logo,
    ja.status as application_status,
    ja.created_at as applied_at
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
JOIN employer_profiles ep ON j.employer_id = ep.id
LEFT JOIN employer_company_profiles ecp ON ep.company_id = ecp.id
WHERE ja.va_id = auth.uid();

-- Grant access to the view for authenticated users (VAs)
GRANT SELECT ON va_job_employers TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW va_job_employers IS 'View for VAs to access employer information for jobs they have applied to or been hired for';
COMMENT ON POLICY "VAs can view employer profiles for associated jobs" ON employer_profiles IS 'Allows VAs to read employer profile data only for employers whose jobs they have interacted with';
COMMENT ON POLICY "VAs can view company profiles for associated jobs" ON employer_company_profiles IS 'Allows VAs to read company profile data for employers whose jobs they have interacted with'; 