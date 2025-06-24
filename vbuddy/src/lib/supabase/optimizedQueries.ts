import { createSupabaseBrowserClient } from "./client";
import { calculateEmployerProfileCompletion } from "../utils/profileCompletion";

// Optimized employer dashboard data fetching
export async function getEmployerDashboardData(employerId: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("get_employer_dashboard_stats", {
    employer_uuid: employerId,
  });

  if (error) {
    throw new Error(
      `Failed to fetch employer dashboard data: ${error.message}`
    );
  }

  return {
    profile: data.profile,
    stats: data.stats,
    firstJobId: data.firstJobId,
    completionPercentage: data.profile
      ? calculateEmployerProfileCompletion(data.profile)
      : 0,
  };
}

// Optimized VA dashboard data fetching
export async function getVADashboardData(vaId: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("get_va_dashboard_data", {
    va_uuid: vaId,
  });

  if (error) {
    throw new Error(`Failed to fetch VA dashboard data: ${error.message}`);
  }

  return {
    profile: data.profile,
    hiredJobs: data.hiredJobs || [],
    appliedJobs: data.appliedJobs || [],
    completionPercentage: data.profile
      ? calculateVAProfileCompletion(data.profile)
      : 0,
  };
}

// Optimized job listings fetching
export async function getJobListings(
  categoryFilter: string = "all",
  searchQuery: string = "",
  vaId?: string
) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("get_job_listings", {
    category_filter: categoryFilter,
    search_query: searchQuery,
    va_uuid: vaId || null,
  });

  if (error) {
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  }

  return data || [];
}

// Placeholder for VA profile completion calculation
// TODO: Import the actual function from your utils
function calculateVAProfileCompletion(_profileData: unknown): number {
  // This is a placeholder - replace with actual logic from your existing utils
  return 80;
}
