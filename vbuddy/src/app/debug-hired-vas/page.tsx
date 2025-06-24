"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DebugHiredVAsPage() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debugData = async () => {
      try {
        // Get current user
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(currentUser);

        if (!currentUser) {
          setError("Not logged in");
          return;
        }

        console.log("Current user:", currentUser.id);

        // Get all jobs for this employer
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("employer_id", currentUser.id);

        if (jobsError) throw jobsError;
        setJobs(jobsData || []);
        console.log("Jobs for employer:", jobsData);

        // Get all applications (regardless of status)
        const { data: allAppsData, error: allAppsError } = await supabase
          .from("job_applications")
          .select("*");

        if (allAppsError) throw allAppsError;
        setAllApplications(allAppsData || []);
        console.log("All applications in database:", allAppsData);

        // Get applications for this employer's jobs
        if (jobsData && jobsData.length > 0) {
          const jobIds = jobsData.map((job) => job.id);

          const { data: appsData, error: appsError } = await supabase
            .from("job_applications")
            .select(
              `
              *,
              va_profiles (
                id,
                full_name,
                profile_picture_url,
                headline,
                primary_skills
              ),
              jobs (
                id,
                title,
                hourly_rate_min,
                hourly_rate_max,
                employer_id
              )
            `
            )
            .in("job_id", jobIds);

          if (appsError) throw appsError;
          setApplications(appsData || []);
          console.log("Applications for employer's jobs:", appsData);
        }
      } catch (err) {
        console.error("Debug error:", err);
        setError(err instanceof Error ? err.message : "Debug failed");
      } finally {
        setLoading(false);
      }
    };

    debugData();
  }, [supabase]);

  if (loading) {
    return <div className="p-8">Loading debug data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Hired VAs Data</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Jobs */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Jobs ({jobs.length})</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(jobs, null, 2)}
          </pre>
        </div>

        {/* Applications for this employer */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            Applications for Employer ({applications.length})
          </h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(applications, null, 2)}
          </pre>
        </div>

        {/* All applications */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">
            All Applications in DB ({allApplications.length})
          </h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(allApplications, null, 2)}
          </pre>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>User ID: {user?.id}</li>
          <li>Jobs created by user: {jobs.length}</li>
          <li>Applications for user's jobs: {applications.length}</li>
          <li>
            Accepted applications:{" "}
            {applications.filter((app) => app.status === "accepted").length}
          </li>
          <li>Total applications in database: {allApplications.length}</li>
        </ul>
      </div>
    </div>
  );
}
