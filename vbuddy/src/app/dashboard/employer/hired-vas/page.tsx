"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  getTimeEntries,
  getWorkspaces,
  getUsers,
  ClockifyTimeEntry,
} from "@/lib/clockify";
import {
  getTimeEntriesForEmployer,
  updateTimeEntryStatus,
  VATimeEntry,
} from "@/lib/supabase/vaTimeEntries";
import EmployerNavbar from "@/components/EmployerNavbar";

interface HiredVA {
  id: string;
  va_profile: {
    full_name: string;
    profile_picture_url: string | null;
    headline: string | null;
    primary_skills: Array<{ name: string; proficiency?: string }> | null;
  };
  job: {
    id: string;
    title: string;
    hourly_rate_min: number;
    hourly_rate_max: number;
  };
  start_date: string;
  status: "active" | "completed" | "terminated";
}

interface SupabaseHiredVA {
  id: string;
  va_profile: {
    full_name: string;
    profile_picture_url: string | null;
    headline: string | null;
    primary_skills: Array<{ name: string; proficiency?: string }> | null;
  };
  job: {
    id: string;
    title: string;
    hourly_rate_min: number;
    hourly_rate_max: number;
  };
  start_date: string;
  status: "active" | "completed" | "terminated";
}

const HiredVAsPage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [hiredVAs, setHiredVAs] = useState<HiredVA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVA, setExpandedVA] = useState<string | null>(null);
  const [timesheet, setTimesheet] = useState<
    Record<string, ClockifyTimeEntry[]>
  >({});
  const [timesheetLoading, setTimesheetLoading] = useState<string | null>(null);
  const [timesheetError, setTimesheetError] = useState<string | null>(null);
  const [reviewEntries, setReviewEntries] = useState<
    Record<string, VATimeEntry[]>
  >({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHiredVAs = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // The Navbar handles authentication redirect
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("job_applications")
          .select(
            `
            id,
            // This assumes 'job_applications' has a column 'va_id'
            // which is a foreign key to 'va_profiles.id'.
            // The fields selected below (full_name, profile_picture_url, etc.)
            // correctly match the columns in your 'va_profiles' table.
            va_profile:va_id (
              full_name,
              profile_picture_url,
              headline,
              primary_skills
            ),
            job:job_id (
              id,
              title,
              hourly_rate_min,
              hourly_rate_max
            ),
            start_date,
            status
          `
          )
          .eq("status", "accepted")
          .eq("employer_id", user.id);

        if (fetchError) throw fetchError;

        // Transform the data to match the HiredVA interface
        // This transformation also correctly maps the fields from va_profile
        // as per the 'va_profiles' table schema.
        const transformedData: HiredVA[] = (
          (data as unknown as SupabaseHiredVA[]) || []
        ).map((item) => ({
          id: item.id,
          va_profile: {
            full_name: item.va_profile.full_name,
            profile_picture_url: item.va_profile.profile_picture_url,
            headline: item.va_profile.headline,
            primary_skills: item.va_profile.primary_skills,
          },
          job: {
            id: item.job.id,
            title: item.job.title,
            hourly_rate_min: item.job.hourly_rate_min,
            hourly_rate_max: item.job.hourly_rate_max,
          },
          start_date: item.start_date,
          status: item.status,
        }));

        setHiredVAs(transformedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch hired VAs"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHiredVAs();
  }, [supabase]);

  const handleViewTimesheet = async (vaId: string, jobTitle: string) => {
    setTimesheetLoading(vaId);
    setTimesheetError(null);
    try {
      // Get workspace and user info from Clockify
      const workspaces = await getWorkspaces();
      const workspaceId = workspaces[0]?.id;
      if (!workspaceId) throw new Error("No Clockify workspace found");
      const users = await getUsers(workspaceId);
      const vaUser = users.find((u) => u.id === vaId || u.name === jobTitle);
      if (!vaUser) throw new Error("VA not found in Clockify");
      // Fetch time entries for this VA (last 30 days)
      const now = new Date();
      const start = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const end = now.toISOString();
      const entries = await getTimeEntries(workspaceId, vaUser.id, start, end);
      setTimesheet((prev) => ({ ...prev, [vaId]: entries }));
      setExpandedVA(vaId);
    } catch (err) {
      setTimesheetError(
        err instanceof Error ? err.message : "Failed to fetch timesheet"
      );
    } finally {
      setTimesheetLoading(null);
    }
  };

  const handleFetchReviewEntries = async (vaId: string, jobId: string) => {
    setReviewLoading(vaId);
    setReviewError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      // Fetch time entries for this employer, VA, and job
      const entries = await getTimeEntriesForEmployer(user.id, jobId);
      setReviewEntries((prev) => ({
        ...prev,
        [vaId]: entries.filter((e) => e.va_id === vaId),
      }));
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to fetch time entries"
      );
    } finally {
      setReviewLoading(null);
    }
  };

  const handleReviewAction = async (
    entryId: string,
    vaId: string,
    action: "approved" | "rejected"
  ) => {
    setReviewLoading(vaId);
    setReviewError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await updateTimeEntryStatus(entryId, action, user.id);
      // Refresh entries
      const jobId = hiredVAs.find((v) => v.id === vaId)?.job?.id;
      if (jobId) await handleFetchReviewEntries(vaId, jobId);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setReviewLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-center text-gray-600">Loading hired VAs...</p>
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
            <p className="text-center text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <EmployerNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Hired Virtual Assistants
          </h1>

          {hiredVAs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                You haven&apos;t hired any VAs yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hiredVAs.map((hiredVA) => (
                <div
                  key={hiredVA.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {hiredVA.va_profile.profile_picture_url ? (
                          <img
                            className="h-12 w-12 rounded-full"
                            src={hiredVA.va_profile.profile_picture_url}
                            alt={hiredVA.va_profile.full_name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">
                              {hiredVA.va_profile.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h2 className="text-lg font-medium text-gray-900">
                          {hiredVA.va_profile.full_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {hiredVA.job.title}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        {hiredVA.va_profile.headline}
                      </p>
                      {hiredVA.va_profile.primary_skills && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {hiredVA.va_profile.primary_skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {skill.name}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rate:</span>
                        <span className="text-gray-900">
                          ${hiredVA.job.hourly_rate_min} - $
                          {hiredVA.job.hourly_rate_max}/hr
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Started:</span>
                        <span className="text-gray-900">
                          {new Date(hiredVA.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Status:</span>
                        <span
                          className={`text-${
                            hiredVA.status === "active" ? "green" : "gray"
                          }-600`}
                        >
                          {hiredVA.status.charAt(0).toUpperCase() +
                            hiredVA.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/employer/vas/${hiredVA.id}/messages`
                          )
                        }
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Message
                      </button>
                      <button
                        onClick={() =>
                          handleViewTimesheet(hiredVA.id, hiredVA.job.title)
                        }
                        className="text-indigo-600 hover:underline text-sm font-medium mt-2"
                      >
                        {expandedVA === hiredVA.id
                          ? "Hide Timesheet"
                          : "View Timesheet"}
                      </button>
                    </div>
                  </div>
                  {expandedVA === hiredVA.id && (
                    <div className="mt-2">
                      {timesheetLoading === hiredVA.id ? (
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
                            {(timesheet[hiredVA.id] || []).map((entry) => (
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
                    </div>
                  )}
                  <button
                    onClick={() =>
                      handleFetchReviewEntries(hiredVA.id, hiredVA.job.id)
                    }
                    className="text-indigo-600 hover:underline text-sm font-medium mt-2"
                  >
                    {reviewEntries[hiredVA.id]
                      ? "Hide Timesheet Review"
                      : "Review Timesheets"}
                  </button>
                  {reviewEntries[hiredVA.id] && (
                    <div className="mt-2">
                      {reviewLoading === hiredVA.id ? (
                        <div>Loading time entries...</div>
                      ) : reviewError ? (
                        <div className="text-red-600">{reviewError}</div>
                      ) : (
                        <table className="min-w-full text-xs border mt-2">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1">Date</th>
                              <th className="border px-2 py-1">Description</th>
                              <th className="border px-2 py-1">Status</th>
                              <th className="border px-2 py-1">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reviewEntries[hiredVA.id].map((entry) => (
                              <tr key={entry.id}>
                                <td className="border px-2 py-1">
                                  {new Date(
                                    entry.submitted_at
                                  ).toLocaleDateString()}
                                </td>
                                <td className="border px-2 py-1">
                                  {entry.notes || "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {entry.status}
                                </td>
                                <td className="border px-2 py-1">
                                  {entry.status === "pending" ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleReviewAction(
                                            entry.id,
                                            hiredVA.id,
                                            "approved"
                                          )
                                        }
                                        className="text-green-600 hover:underline mr-2"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleReviewAction(
                                            entry.id,
                                            hiredVA.id,
                                            "rejected"
                                          )
                                        }
                                        className="text-red-600 hover:underline"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HiredVAsPage;
