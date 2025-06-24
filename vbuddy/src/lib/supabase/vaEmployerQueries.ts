import { createSupabaseBrowserClient } from "./client";

// Types for the va_job_employers view
export interface VAJobEmployer {
  job_id: string;
  job_title: string;
  employer_id: string;
  employer_name: string | null;
  company_id: string | null;
  company_name: string | null;
  company_logo: string | null;
  application_status: string;
  applied_at: string;
}

// Separated job data for VA dashboard
export interface VAJobWithEmployer {
  id: string;
  title: string;
  employer: {
    full_name: string;
  };
}

export interface VAApplicationWithEmployer {
  id: string;
  title: string;
  employer: {
    full_name: string;
  };
  application_status: string;
}

/**
 * Get all job-employer relationships for the current VA user
 * This uses the va_job_employers view which automatically applies RLS policies
 * to only show employers for jobs the VA has applied to or been hired for
 */
export async function getVAJobEmployers(): Promise<VAJobEmployer[]> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("va_job_employers")
    .select("*")
    .order("applied_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch VA job employers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get hired jobs with employer information for the current VA
 */
export async function getVAHiredJobsWithEmployers(): Promise<
  VAJobWithEmployer[]
> {
  const jobEmployers = await getVAJobEmployers();

  return jobEmployers
    .filter((item) => item.application_status === "accepted")
    .map((item) => ({
      id: item.job_id,
      title: item.job_title,
      employer: {
        full_name: item.employer_name || item.company_name || "Employer",
      },
    }));
}

/**
 * Get applied jobs (not hired) with employer information for the current VA
 */
export async function getVAApplicationsWithEmployers(): Promise<
  VAApplicationWithEmployer[]
> {
  const jobEmployers = await getVAJobEmployers();

  return jobEmployers
    .filter((item) => item.application_status !== "accepted")
    .map((item) => ({
      id: item.job_id,
      title: item.job_title,
      employer: {
        full_name: item.employer_name || item.company_name || "Employer",
      },
      application_status: item.application_status,
    }));
}

/**
 * Get employer information for a specific job (if the VA has applied to it)
 * This will return null if the VA hasn't applied to the job (due to RLS)
 */
export async function getEmployerForJob(jobId: string): Promise<{
  employer_name: string | null;
  company_name: string | null;
  company_logo: string | null;
} | null> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("va_job_employers")
    .select("employer_name, company_name, company_logo")
    .eq("job_id", jobId)
    .single();

  if (error) {
    // This is expected if the VA hasn't applied to this job
    return null;
  }

  return data;
}

/**
 * Check if VA can see employer information for a specific job
 * (i.e., if they have applied to or been hired for the job)
 */
export async function canVAAccessEmployerInfo(jobId: string): Promise<boolean> {
  const employerInfo = await getEmployerForJob(jobId);
  return employerInfo !== null;
}
