"use client"; // For potential future client-side interactions, logout button

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
// import { useRouter } from "next/navigation"; // Removed unused import
import {
  getTimeEntries,
  getWorkspaces,
  getUsers,
  ClockifyTimeEntry,
} from "@/lib/clockify";
import { insertTimeEntry } from "@/lib/supabase/vaTimeEntries";
// import VANavbar from "@/components/VANavbar"; // Removed unused import
import ProfileCompletionIndicator from "@/components/ProfileCompletionIndicator";
import { calculateVAProfileCompletion } from "@/lib/utils/profileCompletion";

interface Job {
  id: string;
  title: string;
  employer: { full_name: string };
}

interface SupabaseJobRow {
  job: Job;
}

interface AppliedJobSupabase {
  id: string; // application id
  status: string; // application status
  job: {
    id: string; // job id
    title: string;
    employer: { full_name: string | null }[]; // <-- Changed employer to be an array
  }[]; // <-- Added array notation here
}

interface AppliedJobDisplay {
  id: string; // job id for key
  title: string;
  employer: { full_name: string | null };
  application_status: string;
}

interface VAProfile {
  full_name?: string;
  headline?: string;
  bio?: string;
  hourly_rate?: number;
  skills?: string[];
  experience?: string;
  portfolio_url?: string;
  profile_picture_url?: string;
  resume_url?: string;
}

const VADashboardPage = () => {
  const supabase = createSupabaseBrowserClient();
  // const router = useRouter(); // router is not used
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [timesheet, setTimesheet] = useState<
    Record<string, ClockifyTimeEntry[]>
  >({});
  const [timesheetLoading, setTimesheetLoading] = useState<string | null>(null);
  const [timesheetError, setTimesheetError] = useState<string | null>(null);
  const [showTimeEntryForm, setShowTimeEntryForm] = useState<string | null>(
    null
  );
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const [appliedJobs, setAppliedJobs] = useState<AppliedJobDisplay[]>([]);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(true);
  const [appliedJobsError, setAppliedJobsError] = useState<string | null>(null);

  const [profile, setProfile] = useState<VAProfile | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setAppliedJobsLoading(true);
      setError(null);
      setAppliedJobsError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        // Batch all dashboard queries in parallel for better performance
        const [
          { data: hiredJobsData, error: hiredJobsError },
          { data: appliedJobsData, error: appliedJobsFetchError },
          { data: profileData, error: profileError },
        ] = await Promise.all([
          // Fetch jobs where VA is hired
          supabase
            .from("job_applications")
            .select(`job:job_id(id, title, employer:employer_id(full_name))`)
            .eq("va_id", user.id)
            .eq("status", "accepted"),
          // Fetch jobs where VA has applied (status is not 'accepted')
          supabase
            .from("job_applications")
            .select(
              `
              id,
              status,
              job:job_id(
                id,
                title,
                employer:employer_id(full_name)
              )
            `
            )
            .eq("va_id", user.id)
            .neq("status", "accepted"),
          // Fetch VA profile
          supabase.from("va_profiles").select("*").eq("id", user.id).single(),
        ]);

        // Handle errors
        if (hiredJobsError) throw hiredJobsError;
        if (appliedJobsFetchError) throw appliedJobsFetchError;
        if (profileError && profileError.code !== "PGRST116")
          throw profileError;

        // Process hired jobs
        setJobs(
          ((hiredJobsData as unknown as SupabaseJobRow[]) || []).map((row) => {
            const job = Array.isArray(row.job) ? row.job[0] : row.job;
            return {
              ...job,
              employer: Array.isArray(job.employer)
                ? job.employer[0]
                : job.employer,
            };
          })
        );

        // Process applied jobs
        setAppliedJobs(
          (appliedJobsData || []).map((app: AppliedJobSupabase) => {
            const job = Array.isArray(app.job) ? app.job[0] : app.job;
            const employer = Array.isArray(job.employer)
              ? job.employer[0]
              : job.employer;
            return {
              id: job.id,
              title: job.title,
              employer: employer,
              application_status: app.status,
            };
          })
        );

        // Process profile data
        setProfile(profileData);
        if (profileData) {
          setCompletionPercentage(calculateVAProfileCompletion(profileData));
        }
      } catch (err) {
        const typedError = err as Error;
        const errorMessage =
          typedError.message || "Failed to fetch dashboard data";
        setError(errorMessage);
        setAppliedJobsError(errorMessage);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
        setAppliedJobsLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  const handleViewTimesheet = async (jobId: string, jobTitle: string) => {
    setTimesheetLoading(jobId);
    setTimesheetError(null);
    try {
      const workspaces = await getWorkspaces();
      const workspaceId = workspaces[0]?.id;
      if (!workspaceId) throw new Error("No Clockify workspace found");
      const users = await getUsers(workspaceId);
      const vaUser = users.find((u) => u.name === jobTitle);
      if (!vaUser) throw new Error("VA not found in Clockify");
      const now = new Date();
      const start = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const end = now.toISOString();
      const entries = await getTimeEntries(workspaceId, vaUser.id, start, end);
      setTimesheet((prev) => ({ ...prev, [jobId]: entries }));
      setExpandedJob(jobId);
    } catch (err) {
      setTimesheetError(
        err instanceof Error ? err.message : "Failed to fetch timesheet"
      );
    } finally {
      setTimesheetLoading(null);
    }
  };

  const handleLogTime = async (jobId: string, jobTitle: string) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const workspaces = await getWorkspaces();
      const workspaceId = workspaces[0]?.id;
      if (!workspaceId) throw new Error("No Clockify workspace found");
      const users = await getUsers(workspaceId);
      const vaUser = users.find((u) => u.name === jobTitle);
      if (!vaUser) throw new Error("VA not found in Clockify");
      const description = descriptionRef.current?.value || "";
      const date = dateRef.current?.value;
      const start = startRef.current?.value;
      const end = endRef.current?.value;
      if (!date || !start || !end) throw new Error("All fields are required");
      const startDateTime = new Date(`${date}T${start}:00Z`).toISOString();
      const endDateTime = new Date(`${date}T${end}:00Z`).toISOString();
      const { data: jobApp, error: jobAppError } = await supabase
        .from("job_applications")
        .select("id, job_id, employer_id, va_id")
        .eq("job_id", jobId)
        .eq("va_id", vaUser.id);
      if (jobAppError || !jobApp)
        throw new Error("Job application not found or error fetching it.");

      const mockClockifyEntryId = `mock_${Date.now()}`;

      await insertTimeEntry({
        job_id: jobId,
        va_id: vaUser.id,
        description: description,
        start_time: startDateTime,
        end_time: endDateTime,
        clockify_entry_id: mockClockifyEntryId,
      });
      setShowTimeEntryForm(null);
      await handleViewTimesheet(jobId, jobTitle);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading VA Dashboard...</p>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-8 text-center text-red-600">
        Error loading jobs: {error}
      </div>
    );

  if (!loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-600 mb-4">
          Could not load your profile data. Please try refreshing or contact
          support if the issue persists.
        </p>
        <Link href="/login" className="text-indigo-600 hover:underline">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* <VANavbar /> was here, removed as it's handled by layout */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {profile?.full_name || "VA"}!
            </h1>
          </div>

          <ProfileCompletionIndicator
            completionPercentage={completionPercentage}
            userType="va"
          />

          <section className="my-8 p-6 bg-white shadow-xl rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-5 border-b pb-3">
              Your Active Jobs
            </h2>
            {loading && !error && (
              <p className="text-gray-500">Loading your active jobs...</p>
            )}
            {!loading && !error && jobs.length === 0 && (
              <div className="text-center py-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No active jobs
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You are not currently hired for any jobs.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/va/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Find Jobs
                  </Link>
                </div>
              </div>
            )}
            <div className="space-y-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-gray-50 shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow duration-200"
                >
                  <h3 className="text-xl font-semibold text-indigo-700 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Employer: {job.employer?.full_name || "N/A"}
                  </p>

                  <div className="flex flex-wrap gap-3 items-center mb-4">
                    <button
                      onClick={() => handleViewTimesheet(job.id, job.title)}
                      disabled={timesheetLoading === job.id}
                      className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 transition-colors duration-150"
                    >
                      {timesheetLoading === job.id
                        ? "Loading..."
                        : expandedJob === job.id
                        ? "Hide Timesheet"
                        : "View Timesheet"}
                    </button>
                    <button
                      onClick={() => setShowTimeEntryForm(job.id)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors duration-150"
                    >
                      Log Time for this Job
                    </button>
                  </div>

                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        Timesheet (Last 30 Days)
                      </h4>
                      {timesheetLoading === job.id && (
                        <p className="text-sm text-gray-500">
                          Loading entries...
                        </p>
                      )}
                      {timesheetError && timesheetLoading !== job.id && (
                        <p className="text-sm text-red-600 py-2 px-3 bg-red-50 rounded-md">
                          Error: {timesheetError}
                        </p>
                      )}
                      {timesheet[job.id] && timesheet[job.id].length > 0 && (
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
                          {timesheet[job.id].map((entry) => (
                            <li key={entry.id} className="py-1">
                              <strong>
                                {new Date(
                                  entry.timeInterval.start
                                ).toLocaleDateString()}
                              </strong>
                              : {entry.description} (
                              {entry.timeInterval.duration})
                            </li>
                          ))}
                        </ul>
                      )}
                      {timesheet[job.id] &&
                        timesheet[job.id].length === 0 &&
                        timesheetLoading !== job.id &&
                        !timesheetError && (
                          <p className="text-sm text-gray-500">
                            No time entries recorded in the last 30 days.
                          </p>
                        )}
                    </div>
                  )}

                  {showTimeEntryForm === job.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLogTime(job.id, job.title);
                      }}
                      className="mt-4 pt-4 border-t border-gray-200 space-y-4 bg-indigo-50 p-4 rounded-md"
                    >
                      <h4 className="text-md font-semibold text-gray-700 mb-1">
                        Log New Time Entry for: {job.title}
                      </h4>
                      <div>
                        <label
                          htmlFor={`desc-${job.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Description
                        </label>
                        <input
                          type="text"
                          id={`desc-${job.id}`}
                          ref={descriptionRef}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor={`date-${job.id}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Date
                          </label>
                          <input
                            type="date"
                            id={`date-${job.id}`}
                            ref={dateRef}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`start-${job.id}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Start Time
                          </label>
                          <input
                            type="time"
                            id={`start-${job.id}`}
                            ref={startRef}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`end-${job.id}`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            End Time
                          </label>
                          <input
                            type="time"
                            id={`end-${job.id}`}
                            ref={endRef}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      {formError && (
                        <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">
                          {formError}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="px-5 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-60 transition-colors duration-150"
                        >
                          {formLoading ? "Submitting..." : "Submit Entry"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTimeEntryForm(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="my-8 p-6 bg-white shadow-xl rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-5 border-b pb-3">
              Your Applications
            </h2>
            {appliedJobsLoading && !appliedJobsError && (
              <p className="text-gray-500">Loading your applications...</p>
            )}
            {appliedJobsError && (
              <p className="text-red-500 py-2 px-3 bg-red-50 rounded-md">
                Error loading applications: {appliedJobsError}
              </p>
            )}
            {!appliedJobsLoading &&
              !appliedJobsError &&
              appliedJobs.length === 0 && (
                <div className="text-center py-6">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0L9 7m-4 0L9 7m0 0L7 5m2 2L7 5m6 14v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m0 0H5a2 2 0 00-2 2h14a2 2 0 00-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No applications found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven&apos;t applied to any jobs yet.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/va/jobs"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Browse Open Jobs
                    </Link>
                  </div>
                </div>
              )}
            <div className="space-y-4">
              {appliedJobs.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-50 shadow-md rounded-lg p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-indigo-600">
                      {app.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1 sm:mb-0">
                      Employer: {app.employer?.full_name || "N/A"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                        app.application_status === "pending" ||
                        app.application_status === "applied"
                          ? "bg-yellow-100 text-yellow-800"
                          : app.application_status === "viewed"
                          ? "bg-blue-100 text-blue-800"
                          : app.application_status === "shortlisted" ||
                            app.application_status === "interviewing"
                          ? "bg-purple-100 text-purple-800"
                          : app.application_status === "hired" ||
                            app.application_status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : app.application_status === "rejected" ||
                            app.application_status === "declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {app.application_status.charAt(0).toUpperCase() +
                        app.application_status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VADashboardPage;
