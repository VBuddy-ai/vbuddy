-- Create va_time_entries table for time entry approval workflow
CREATE TABLE IF NOT EXISTS va_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    va_id UUID NOT NULL REFERENCES va_profiles(id),
    employer_id UUID NOT NULL REFERENCES employer_profiles(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    clockify_time_entry_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES employer_profiles(id),
    notes TEXT
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_va_time_entries_job_id ON va_time_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_va_id ON va_time_entries(va_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_employer_id ON va_time_entries(employer_id);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_status ON va_time_entries(status); 