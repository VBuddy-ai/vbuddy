-- Create job_skills table
CREATE TABLE job_skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for job_skills
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view skills
CREATE POLICY "Anyone can view job skills"
    ON job_skills FOR SELECT
    USING (true);

-- Create job_skills_mapping table
CREATE TABLE job_skills_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES job_skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (job_id, skill_id) -- Prevent duplicate entries for the same job/skill
);

-- Add RLS policies for job_skills_mapping
ALTER TABLE job_skills_mapping ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view skill mappings (needed for viewing job details)
CREATE POLICY "Anyone can view job skill mappings"
    ON job_skills_mapping FOR SELECT
    USING (true);

-- Employers can insert mappings for their jobs
CREATE POLICY "Employers can insert job skill mappings for their jobs"
    ON job_skills_mapping FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_skills_mapping.job_id
            AND jobs.employer_id = auth.uid()
        )})
);

-- Employers can delete mappings for their jobs
CREATE POLICY "Employers can delete job skill mappings for their jobs"
    ON job_skills_mapping FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_skills_mapping.job_id
            AND jobs.employer_id = auth.uid()
        )
    );

-- Add trigger for updated_at on job_skills
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON job_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at on job_skills_mapping
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON job_skills_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 