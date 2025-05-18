-- Create KYC verifications table
CREATE TABLE kyc_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    va_id UUID REFERENCES va_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verification_id TEXT,
    verification_data JSONB,
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- VAs can view their own KYC status
CREATE POLICY "VAs can view own KYC status"
    ON kyc_verifications FOR SELECT
    USING (va_id = auth.uid());

-- VAs can update their own KYC status
CREATE POLICY "VAs can update own KYC status"
    ON kyc_verifications FOR UPDATE
    USING (va_id = auth.uid());

-- Employers can view KYC status of VAs they've hired
DROP POLICY IF EXISTS "Employers can view hired VAs KYC status" ON kyc_verifications;
CREATE POLICY "Employers can view hired VAs KYC status"
    ON kyc_verifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.va_id = kyc_verifications.va_id
            AND j.employer_id = auth.uid()
            AND ja.status = 'accepted'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 