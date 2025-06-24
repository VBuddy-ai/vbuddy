-- Enhance va_time_entries table for better time tracking
-- Add proper start_time, end_time, and duration fields

ALTER TABLE va_time_entries 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS work_description TEXT;

-- Rename clockify_time_entry_id to reference_id for clarity
ALTER TABLE va_time_entries 
RENAME COLUMN clockify_time_entry_id TO reference_id;

-- Update the reference_id column to be optional since we don't need Clockify
ALTER TABLE va_time_entries 
ALTER COLUMN reference_id DROP NOT NULL;

-- Add helpful indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_va_time_entries_start_time ON va_time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_va_time_entries_duration ON va_time_entries(duration_hours DESC);

-- Add a function to calculate duration automatically
CREATE OR REPLACE FUNCTION calculate_duration_hours(start_time TIMESTAMP WITH TIME ZONE, end_time TIMESTAMP WITH TIME ZONE)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF start_time IS NULL OR end_time IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0, 2);
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to automatically calculate duration when start/end times are set
CREATE OR REPLACE FUNCTION update_duration_on_time_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.duration_hours = calculate_duration_hours(NEW.start_time, NEW.end_time);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_duration
    BEFORE INSERT OR UPDATE ON va_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_duration_on_time_change(); 