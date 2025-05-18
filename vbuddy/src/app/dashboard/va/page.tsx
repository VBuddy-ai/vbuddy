"use client"; // For potential future client-side interactions, logout button

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  getTimeEntries,
  getWorkspaces,
  getUsers,
  ClockifyTimeEntry,
} from "@/lib/clockify";
import { insertTimeEntry } from "@/lib/supabase/vaTimeEntries";
import VANavbar from "@/components/VANavbar";
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

// Define interfaces for applied job data
interface AppliedJobSupabase {
  id: string; // application id
  status: string; // application status
  job: {
    // nested job object
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
  const router = useRouter();
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

  const [appliedJobs, setAppliedJobs] = useState<AppliedJobDisplay[]>([]); // State for applied jobs
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(true); // Loading state for applied jobs
  const [appliedJobsError, setAppliedJobsError] = useState<string | null>(null); // Error state for applied jobs

  const [profile, setProfile] = useState<VAProfile | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        // Fetch jobs where VA is hired
        const { data: hiredJobsData, error: hiredJobsError } = await supabase
          .from("job_applications")
          .select(`job:job_id(id, title, employer:employer_id(full_name))`)
          .eq("va_id", user.id)
          .eq("status", "accepted");

        if (hiredJobsError) throw hiredJobsError;
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
        setLoading(false);

        // Fetch jobs where VA has applied (status is not 'accepted')
        setAppliedJobsLoading(true);
        setAppliedJobsError(null);
        const { data: appliedJobsData, error: appliedJobsError } =
          await supabase
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
            .neq("status", "accepted"); // Assuming status 'accepted' means hired

        if (appliedJobsError) throw appliedJobsError;
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
        setAppliedJobsError(
          err instanceof Error ? err.message : "Failed to fetch applied jobs"
        );
      } finally {
        setLoading(false);
        setAppliedJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("va_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setCompletionPercentage(calculateVAProfileCompletion(data));
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleViewTimesheet = async (jobId: string, jobTitle: string) => {
    setTimesheetLoading(jobId);
    setTimesheetError(null);
    try {
      const workspaces = await getWorkspaces();
      const workspaceId = workspaces[0]?.id;
      if (!workspaceId) throw new Error("No Clockify workspace found");
      const users = await getUsers(workspaceId);
      // Assume VA's Clockify user matches current user
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
      // Fetch job application to get job_id, employer_id, va_id
      const { data: jobApp } = await supabase
        .from("job_applications")
        .select("id, job_id, employer_id, va_id")
        .eq("job_id", jobId)
        .eq("va_id", vaUser.id)
        .single();
      if (!jobApp) throw new Error("Job application not found");
      // Create time entry in Clockify
      const clockifyRes = await fetch(
        `https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`,
        {
          method: "POST",
          headers: {
            "X-Api-Key": process.env.CLOCKIFY_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start: startDateTime,
            end: endDateTime,
            description,
            userId: vaUser.id,
          }),
        }
      );
      const clockifyEntry = await clockifyRes.json();
      if (!clockifyEntry.id)
        throw new Error("Failed to create time entry in Clockify");
      // Insert into va_time_entries
      await insertTimeEntry({
        va_id: jobApp.va_id,
        employer_id: jobApp.employer_id,
        job_id: jobApp.job_id,
        clockify_time_entry_id: clockifyEntry.id,
        status: "pending",
        notes: null,
      });
      setShowTimeEntryForm(null);
      // Refresh timesheet
      await handleViewTimesheet(jobId, jobTitle);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <VANavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            VA Dashboard
          </h1>

          <ProfileCompletionIndicator
            completionPercentage={completionPercentage}
            userType="va"
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={() => router.push("/dashboard/va/profile/edit")}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/va/jobs")}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Find Jobs
                  </button>
                </div>
              </div>
            </div>

            {/* Applied Jobs */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Applied Jobs
                </h2>
                <button
                  onClick={() => router.push("/dashboard/va/applications")}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  View Applications
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Messages
                </h2>
                <button
                  onClick={() => router.push("/dashboard/va/messages")}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  View Messages
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Applied Jobs</h1>
        {appliedJobsLoading ? (
          <div className="text-gray-500">Loading applied jobs...</div>
        ) : appliedJobsError ? (
          <div className="text-red-600">{appliedJobsError}</div>
        ) : appliedJobs.length === 0 ? (
          <div className="text-gray-500">
            You have not applied for any jobs yet.
          </div>
        ) : (
          <div className="space-y-6">
            {appliedJobs.map((job) => (
              <div key={job.id} className="bg-white shadow rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <div className="text-sm text-gray-500">
                      Employer: {job.employer?.full_name || "-"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Status: {job.application_status}
                    </div>
                  </div>
                  {/* Optional: Link to job details page */}
                  {/* <Link href={`/dashboard/va/jobs/${job.id}`} className="text-indigo-600 hover:underline text-sm font-medium">View Details</Link> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Hired Jobs</h1>
        {jobs.length === 0 ? (
          <div className="text-gray-500">You have no hired jobs yet.</div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white shadow rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <div className="text-sm text-gray-500">
                      Employer: {job.employer?.full_name || "-"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewTimesheet(job.id, job.title)}
                    className="text-indigo-600 hover:underline text-sm font-medium"
                  >
                    {expandedJob === job.id
                      ? "Hide Timesheet"
                      : "View Timesheet"}
                  </button>
                </div>
                {expandedJob === job.id && (
                  <div className="mt-2">
                    {timesheetLoading === job.id ? (
                      <div>Loading timesheet...</div>
                    ) : timesheetError ? (
                      <div className="text-red-600">{timesheetError}</div>
                    ) : (
                      <table className="min-w-full text-xs border mt-2">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1">Date</th>
                            <th className="border px-2 py-1">Description</th>
                            <th className="border px-2 py-1">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(timesheet[job.id] || []).map((entry) => (
                            <tr key={entry.id}>
                              <td className="border px-2 py-1">
                                {new Date(entry.start).toLocaleDateString()}
                              </td>
                              <td className="border px-2 py-1">
                                {entry.description}
                              </td>
                              <td className="border px-2 py-1">
                                {entry.duration}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() => setShowTimeEntryForm(job.id)}
                        className="inline-block text-indigo-600 hover:underline text-sm mb-2"
                      >
                        Log Time
                      </button>
                      {showTimeEntryForm === job.id && (
                        <form
                          className="bg-gray-50 p-3 rounded mb-2"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await handleLogTime(job.id, job.title);
                          }}
                        >
                          <div className="flex flex-col sm:flex-row gap-2 mb-2">
                            <input
                              ref={descriptionRef}
                              type="text"
                              placeholder="Description"
                              className="border rounded px-2 py-1 flex-1"
                              required
                            />
                            <input
                              ref={dateRef}
                              type="date"
                              className="border rounded px-2 py-1"
                              required
                            />
                            <input
                              ref={startRef}
                              type="time"
                              className="border rounded px-2 py-1"
                              required
                            />
                            <input
                              ref={endRef}
                              type="time"
                              className="border rounded px-2 py-1"
                              required
                            />
                          </div>
                          {formError && (
                            <div className="text-red-600 text-xs mb-1">
                              {formError}
                            </div>
                          )}
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                            disabled={formLoading}
                          >
                            {formLoading ? "Logging..." : "Submit"}
                          </button>
                          <button
                            type="button"
                            className="ml-2 text-gray-500 text-xs"
                            onClick={() => setShowTimeEntryForm(null)}
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VADashboardPage;
