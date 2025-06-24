"use client"; // For potential future client-side interactions, logout button

import React, { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// import EmployerNavbar from "@/components/EmployerNavbar"; // Removed unused import
import ProfileCompletionIndicator from "@/components/ProfileCompletionIndicator";
import { calculateEmployerProfileCompletion } from "@/lib/utils/profileCompletion";

// Dynamically import heavy components
const StatsGrid = dynamic(() => import("@/components/dashboard/StatsGrid"), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />,
});

const QuickActions = dynamic(
  () => import("@/components/dashboard/QuickActions"),
  {
    loading: () => (
      <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />
    ),
  }
);

// interface EmployerProfile { // Removed as it became unused after commenting out setProfile
//   full_name?: string;
//   company_name?: string;
//   company_description?: string;
//   company_website?: string;
//   company_logo_url?: string;
//   industry?: string;
//   company_size?: string;
//   location?: string;
// }

const EmployerDashboard = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  // const [profile, setProfile] = useState<EmployerProfile | null>(null); // Commented out as it's set but not used
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeApplications: 0,
    hiredVAs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstJobId, setFirstJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Batch all queries in parallel for better performance
        const [
          { data: profileData, error: profileError },
          { data: allJobsData, error: allJobsError },
        ] = await Promise.all([
          // Fetch profile
          supabase
            .from("employer_profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          // Fetch all jobs at once (we need the data anyway)
          supabase
            .from("jobs")
            .select("id, created_at")
            .eq("employer_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

        if (profileError) throw profileError;
        if (allJobsError) throw allJobsError;

        // Calculate profile completion
        if (profileData) {
          setCompletionPercentage(
            calculateEmployerProfileCompletion(profileData)
          );
        }

        // Process jobs data
        const totalJobs = allJobsData?.length || 0;
        const firstJobId = totalJobs > 0 ? allJobsData[0].id : null;
        const allJobIds = allJobsData?.map((job) => job.id) || [];

        setFirstJobId(firstJobId);

        // Batch application queries in parallel if we have jobs
        let activeApplications = 0;
        let hiredVAs = 0;

        if (allJobIds.length > 0) {
          const [
            { count: activeAppsCount, error: activeAppsError },
            { count: hiredVAsCount, error: hiredVAsError },
          ] = await Promise.all([
            supabase
              .from("job_applications")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending")
              .in("job_id", allJobIds),
            supabase
              .from("job_applications")
              .select("*", { count: "exact", head: true })
              .eq("status", "hired")
              .in("job_id", allJobIds),
          ]);

          if (activeAppsError) {
            console.error(
              "Error fetching active applications count:",
              activeAppsError
            );
          } else {
            activeApplications = activeAppsCount || 0;
          }

          if (hiredVAsError) {
            console.error("Error fetching hired VAs count:", hiredVAsError);
          } else {
            hiredVAs = hiredVAsCount || 0;
          }
        }

        setStats({
          totalJobs,
          activeApplications,
          hiredVAs,
        });
      } catch (err) {
        console.error("Error fetching data for employer dashboard:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [supabase]);

  const handleReviewApplications = () => {
    if (firstJobId) {
      router.push(`/dashboard/employer/jobs/${firstJobId}/applications`);
    } else {
      router.push("/dashboard/employer/my-jobs");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Employer Dashboard
          </h1>

          <ProfileCompletionIndicator
            completionPercentage={completionPercentage}
            userType="employer"
          />

          <Suspense
            fallback={
              <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
            }
          >
            <StatsGrid
              stats={stats}
              onReviewApplications={handleReviewApplications}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />
            }
          >
            <QuickActions
              onPostJob={() => router.push("/dashboard/employer/post-job")}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
