-- Add performance indexes to improve query speed
-- This migration addresses the major performance bottlenecks identified

-- Critical indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_status ON jobs(employer_id, status);

-- Critical indexes for job_applications table
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_va_id ON job_applications(va_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status ON job_applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_va_status ON job_applications(va_id, status);

-- Critical indexes for job_skills_mapping table
CREATE INDEX IF NOT EXISTS idx_job_skills_mapping_job_id ON job_skills_mapping(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_mapping_skill_id ON job_skills_mapping(skill_id);

-- Indexes for profile tables
CREATE INDEX IF NOT EXISTS idx_employer_profiles_id ON employer_profiles(id);
CREATE INDEX IF NOT EXISTS idx_va_profiles_id ON va_profiles(id);

-- Indexes for KYC table
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_va_id ON kyc_verifications(va_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

-- Indexes for time entries
CREATE INDEX IF NOT EXISTS idx_va_time_entries_va_id ON va_time_entries(va_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_employer_id ON va_time_entries(employer_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_job_id ON va_time_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_status ON va_time_entries(status);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_submitted_at ON va_time_entries(submitted_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_employer_status_created ON jobs(employer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_composite ON job_applications(job_id, va_id, status);

-- Add index for text search on jobs
CREATE INDEX IF NOT EXISTS idx_jobs_title_gin ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_jobs_description_gin ON jobs USING gin(to_tsvector('english', description));

-- Update table statistics for better query planning
ANALYZE jobs;
ANALYZE job_applications;
ANALYZE job_skills_mapping;
ANALYZE employer_profiles;
ANALYZE va_profiles; 