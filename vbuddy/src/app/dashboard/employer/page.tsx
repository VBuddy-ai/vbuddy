"use client"; // For potential future client-side interactions, logout button

import React, { useState, useEffect, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import EmployerNavbar from "@/components/EmployerNavbar";
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

interface EmployerProfile {
  full_name?: string;
  company_name?: string;
  company_description?: string;
  company_website?: string;
  company_logo_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
}

const EmployerDashboard = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
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
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setCompletionPercentage(calculateEmployerProfileCompletion(data));
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Fetch total jobs
      const {
        data: jobsData,
        error: jobsError,
        count: totalJobs,
      } = await supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .eq("employer_id", user.id);

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        throw jobsError;
      }

      console.log("Total jobs found:", totalJobs);
      console.log("Jobs data:", jobsData);

      // Store the first job ID if available
      if (jobsData && jobsData.length > 0) {
        setFirstJobId(jobsData[0].id);
      }

      // Get job IDs from the jobs data
      const jobIds = jobsData?.map((job) => job.id) || [];
      console.log("Job IDs:", jobIds);

      // Fetch active applications
      const {
        data: activeAppsData,
        error: activeAppsError,
        count: activeApplications,
      } = await supabase
        .from("job_applications")
        .select("*", { count: "exact" })
        .eq("status", "pending")
        .in("job_id", jobIds);

      if (activeAppsError) {
        console.error("Error fetching active applications:", activeAppsError);
        throw activeAppsError;
      }

      console.log("Active applications found:", activeApplications);
      console.log("Active applications data:", activeAppsData);

      // Fetch hired VAs
      const {
        data: hiredVAsData,
        error: hiredVAsError,
        count: hiredVAs,
      } = await supabase
        .from("job_applications")
        .select("*", { count: "exact" })
        .eq("status", "hired")
        .in("job_id", jobIds);

      if (hiredVAsError) {
        console.error("Error fetching hired VAs:", hiredVAsError);
        throw hiredVAsError;
      }

      console.log("Hired VAs found:", hiredVAs);
      console.log("Hired VAs data:", hiredVAsData);

      setStats({
        totalJobs: totalJobs || 0,
        activeApplications: activeApplications || 0,
        hiredVAs: hiredVAs || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

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
        <EmployerNavbar />
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
        <EmployerNavbar />
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
      <EmployerNavbar />
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
