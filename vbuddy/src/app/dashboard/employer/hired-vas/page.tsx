"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
// Removed Clockify imports - using local time tracking only
import {
  getTimeEntriesForEmployer,
  updateTimeEntryStatus,
  VATimeEntry,
} from "@/lib/supabase/vaTimeEntries";

interface HiredVA {
  id: string;
  va_profile: {
    id: string;
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
  created_at: string;
  status: "accepted";
}

const HiredVAsPage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [hiredVAs, setHiredVAs] = useState<HiredVA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed expandedVA state - not needed without Clockify timesheet
  // Removed Clockify timesheet state - employers use the review workflow instead
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
          return;
        }

        console.log("Fetching hired VAs for employer:", user.id);

        // First, get all jobs for this employer
        const { data: employerJobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id")
          .eq("employer_id", user.id);

        if (jobsError) {
          console.error("Error fetching employer jobs:", jobsError);
          throw jobsError;
        }

        if (!employerJobs || employerJobs.length === 0) {
          console.log("No jobs found for employer");
          setHiredVAs([]);
          return;
        }

        const jobIds = employerJobs.map((job) => job.id);
        console.log("Found jobs:", jobIds);

        // Then get accepted applications for these jobs
        const { data: applications, error: applicationsError } = await supabase
          .from("job_applications")
          .select(
            "id, va_id, job_id, created_at, status, va_profiles(id, full_name, profile_picture_url, headline, primary_skills), jobs(id, title, hourly_rate_min, hourly_rate_max)"
          )
          .eq("status", "accepted")
          .in("job_id", jobIds);

        if (applicationsError) {
          console.error("Error fetching applications:", applicationsError);
          throw applicationsError;
        }

        console.log("Found applications:", applications);

        // Transform the data
        const transformedData: HiredVA[] = (applications || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => ({
            id: item.id,
            va_profile: {
              id: item.va_profiles?.id || item.va_id,
              full_name: item.va_profiles?.full_name || "Unknown",
              profile_picture_url: item.va_profiles?.profile_picture_url,
              headline: item.va_profiles?.headline,
              primary_skills: item.va_profiles?.primary_skills,
            },
            job: {
              id: item.jobs?.id || item.job_id,
              title: item.jobs?.title || "Unknown Job",
              hourly_rate_min: item.jobs?.hourly_rate_min || 0,
              hourly_rate_max: item.jobs?.hourly_rate_max || 0,
            },
            created_at: item.created_at,
            status: item.status,
          })
        );

        console.log("Transformed data:", transformedData);
        setHiredVAs(transformedData);
      } catch (err) {
        console.error("Error in fetchHiredVAs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch hired VAs"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHiredVAs();
  }, [supabase]);

  // Removed handleViewTimesheet - employers use the review workflow instead

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
      {/* <EmployerNavbar /> */}
      <div className="container mx-auto px-4">
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
                                {typeof skill === "string" ? skill : skill.name}
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
                        <span className="text-gray-500">Hired:</span>
                        <span className="text-gray-900">
                          {new Date(hiredVA.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Status:</span>
                        <span className="text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/employer/vas/${hiredVA.va_profile.id}/messages`
                          )
                        }
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Message
                      </button>
                      {/* Removed View Timesheet button - employers use the review workflow */}
                    </div>
                  </div>
                  {/* Removed timesheet display - employers use the review workflow instead */}
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <button
                      onClick={() =>
                        handleFetchReviewEntries(
                          hiredVA.va_profile.id,
                          hiredVA.job.id
                        )
                      }
                      className="text-indigo-600 hover:underline text-sm font-medium"
                    >
                      {reviewEntries[hiredVA.va_profile.id]
                        ? "Hide Review Entries"
                        : "Review Time Entries"}
                    </button>
                  </div>
                  {reviewEntries[hiredVA.va_profile.id] && (
                    <div className="p-4 border-t">
                      {reviewLoading === hiredVA.va_profile.id ? (
                        <div className="text-center py-4">
                          Loading time entries...
                        </div>
                      ) : reviewError ? (
                        <div className="text-red-600 text-center py-4">
                          {reviewError}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs border">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="border px-3 py-2 text-left">
                                  Date
                                </th>
                                <th className="border px-3 py-2 text-left">
                                  Description
                                </th>
                                <th className="border px-3 py-2 text-left">
                                  Status
                                </th>
                                <th className="border px-3 py-2 text-left">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {reviewEntries[hiredVA.va_profile.id].map(
                                (entry) => (
                                  <tr
                                    key={entry.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="border px-3 py-2">
                                      {new Date(
                                        entry.submitted_at
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="border px-3 py-2">
                                      {entry.notes || "No description"}
                                    </td>
                                    <td className="border px-3 py-2">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          entry.status === "pending"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : entry.status === "approved"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {entry.status}
                                      </span>
                                    </td>
                                    <td className="border px-3 py-2">
                                      {entry.status === "pending" ? (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() =>
                                              handleReviewAction(
                                                entry.id,
                                                hiredVA.va_profile.id,
                                                "approved"
                                              )
                                            }
                                            className="text-green-600 hover:text-green-800 text-xs"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleReviewAction(
                                                entry.id,
                                                hiredVA.va_profile.id,
                                                "rejected"
                                              )
                                            }
                                            className="text-red-600 hover:text-red-800 text-xs"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-gray-500">-</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                              {reviewEntries[hiredVA.va_profile.id].length ===
                                0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="border px-3 py-4 text-center text-gray-500"
                                  >
                                    No time entries to review
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
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
