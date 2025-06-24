-- Create optimized dashboard functions to reduce multiple queries to single calls

-- Function to get employer dashboard stats in one query
CREATE OR REPLACE FUNCTION get_employer_dashboard_stats(employer_uuid UUID)
RETURNS json AS $$
DECLARE
  result json;
  profile_data json;
  jobs_count integer;
  first_job_id uuid;
  active_apps_count integer;
  hired_vas_count integer;
BEGIN
  -- Get profile data
  SELECT row_to_json(ep) INTO profile_data 
  FROM employer_profiles ep 
  WHERE id = employer_uuid;
  
  -- Get job statistics
  SELECT COUNT(*) INTO jobs_count 
  FROM jobs 
  WHERE employer_id = employer_uuid;
  
  -- Get first job ID
  SELECT id INTO first_job_id 
  FROM jobs 
  WHERE employer_id = employer_uuid 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Get active applications count
  SELECT COUNT(*) INTO active_apps_count
  FROM job_applications ja 
  JOIN jobs j ON ja.job_id = j.id 
  WHERE j.employer_id = employer_uuid 
  AND ja.status = 'pending';
  
  -- Get hired VAs count
  SELECT COUNT(*) INTO hired_vas_count
  FROM job_applications ja 
  JOIN jobs j ON ja.job_id = j.id 
  WHERE j.employer_id = employer_uuid 
  AND ja.status = 'hired';
  
  -- Build result object
  SELECT json_build_object(
    'profile', profile_data,
    'stats', json_build_object(
      'totalJobs', jobs_count,
      'activeApplications', active_apps_count,
      'hiredVAs', hired_vas_count
    ),
    'firstJobId', first_job_id
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get VA dashboard data in one query
CREATE OR REPLACE FUNCTION get_va_dashboard_data(va_uuid UUID)
RETURNS json AS $$
DECLARE
  result json;
  profile_data json;
  hired_jobs json;
  applied_jobs json;
BEGIN
  -- Get profile data
  SELECT row_to_json(vp) INTO profile_data 
  FROM va_profiles vp 
  WHERE id = va_uuid;
  
  -- Get hired jobs with employer info
  SELECT json_agg(
    json_build_object(
      'id', j.id,
      'title', j.title,
      'employer', json_build_object(
        'id', ep.id,
        'full_name', ep.full_name,
        'company_name', ep.company_name
      )
    )
  ) INTO hired_jobs
  FROM job_applications ja
  JOIN jobs j ON ja.job_id = j.id
  JOIN employer_profiles ep ON j.employer_id = ep.id
  WHERE ja.va_id = va_uuid AND ja.status = 'accepted';
  
  -- Get applied jobs (not hired)
  SELECT json_agg(
    json_build_object(
      'id', j.id,
      'title', j.title,
      'application_status', ja.status,
      'employer', json_build_object(
        'full_name', ep.full_name
      )
    )
  ) INTO applied_jobs
  FROM job_applications ja
  JOIN jobs j ON ja.job_id = j.id
  JOIN employer_profiles ep ON j.employer_id = ep.id
  WHERE ja.va_id = va_uuid AND ja.status != 'accepted';
  
  -- Build result object
  SELECT json_build_object(
    'profile', profile_data,
    'hiredJobs', COALESCE(hired_jobs, '[]'::json),
    'appliedJobs', COALESCE(applied_jobs, '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job listings with all related data
CREATE OR REPLACE FUNCTION get_job_listings(
  category_filter text DEFAULT 'all',
  search_query text DEFAULT '',
  va_uuid UUID DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
  jobs_data json;
  applied_jobs_ids uuid[];
BEGIN
  -- Get applied job IDs for the VA if provided
  IF va_uuid IS NOT NULL THEN
    SELECT array_agg(job_id) INTO applied_jobs_ids
    FROM job_applications 
    WHERE va_id = va_uuid;
  END IF;
  
  -- Get jobs with all related data
  SELECT json_agg(
    json_build_object(
      'id', j.id,
      'title', j.title,
      'description', j.description,
      'requirements', j.requirements,
      'responsibilities', j.responsibilities,
      'hourly_rate', j.hourly_rate,
      'work_type', j.work_type,
      'duration', j.duration,
      'location', j.location,
      'category_id', j.category_id,
      'category_name', jc.name,
      'skills', COALESCE(skill_names.skills, ARRAY[]::text[]),
      'employer', json_build_object(
        'id', ep.id,
        'full_name', ep.full_name,
        'company_name', ep.company_name
      ),
      'created_at', j.created_at,
      'has_applied', CASE 
        WHEN va_uuid IS NOT NULL AND j.id = ANY(COALESCE(applied_jobs_ids, ARRAY[]::uuid[])) 
        THEN true 
        ELSE false 
      END
    )
  ) INTO jobs_data
  FROM jobs j
  JOIN employer_profiles ep ON j.employer_id = ep.id
  LEFT JOIN job_categories jc ON j.category_id = jc.id
  LEFT JOIN (
    SELECT 
      jsm.job_id,
      array_agg(js.name) as skills
    FROM job_skills_mapping jsm
    JOIN job_skills js ON jsm.skill_id = js.id
    GROUP BY jsm.job_id
  ) skill_names ON j.id = skill_names.job_id
  WHERE j.status = 'open'
  AND (category_filter = 'all' OR j.category_id::text = category_filter)
  AND (search_query = '' OR 
       j.title ILIKE '%' || search_query || '%' OR 
       j.description ILIKE '%' || search_query || '%')
  ORDER BY j.created_at DESC;
  
  RETURN COALESCE(jobs_data, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_employer_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_va_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_listings(text, text, UUID) TO authenticated; 