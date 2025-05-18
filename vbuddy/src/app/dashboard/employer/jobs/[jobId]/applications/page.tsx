"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Application {
  id: string;
  va_profiles: {
    id: string;
    full_name: string;
    profile_picture_url: string;
    preferred_hourly_rate: number | null;
    primary_skills: string[] | null;
    years_of_experience: number | null;
  };
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  cover_letter: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
}

export default function JobApplicationsPage({
  params: initialParams,
}: {
  params: { jobId: string } | Promise<{ jobId: string }>;
}) {
  const params = React.use(initialParams) as { jobId: string };

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobAndApplications();
  }, [params.jobId]);

  const fetchJobAndApplications = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to view applications");
      }

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", params.jobId)
        .eq("employer_id", user.id)
        .maybeSingle();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch applications
      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from("job_applications")
          .select(
            `
        *,
        va_profiles(
          id,
          full_name,
          profile_picture_url,
          preferred_hourly_rate,
          primary_skills,
          years_of_experience
        )
      `
          )
          .eq("job_id", params.jobId)
          .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (
    applicationId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update application status"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
          <p className="mt-2 text-sm text-gray-500">
            The job you&apos;re looking for doesn&apos;t exist or you don&apos;t
            have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/employer/my-jobs"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Back to My Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/dashboard/employer"
                  className="text-xl font-bold text-gray-900"
                >
                  VBuddy
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard/employer/post-job"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Post Job
                </Link>
                <Link
                  href="/dashboard/employer/my-jobs"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Jobs
                </Link>
                <Link
                  href="/dashboard/employer/hired-vas"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Hired VAs
                </Link>
                <Link
                  href="/dashboard/employer/company-profile"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Company Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard/employer/my-jobs"
              className="text-indigo-600 hover:text-indigo-500"
            >
              ← Back to My Jobs
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Applications for {job.title}
            </h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No applications yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Applications will appear here when VAs apply to your job.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <li key={application.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-full"
                              src={
                                application.va_profiles?.profile_picture_url ||
                                "/default-avatar.png"
                              }
                              alt={application.va_profiles?.full_name}
                            />
                          </div>
                          <div className="ml-4">
                            <h2 className="text-lg font-medium text-gray-900">
                              {application.va_profiles?.full_name}
                            </h2>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                $
                                {application.va_profiles
                                  ?.preferred_hourly_rate ?? "N/A"}
                                /hr
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {application.va_profiles?.years_of_experience ??
                                  "N/A"}{" "}
                                years experience
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {application.va_profiles?.primary_skills?.map(
                                (skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : application.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {application.status}
                          </span>
                          {application.status === "pending" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleApplicationStatus(
                                    application.id,
                                    "accepted"
                                  )
                                }
                                className="text-green-600 hover:text-green-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleApplicationStatus(
                                    application.id,
                                    "rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          Cover Letter
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
                          {application.cover_letter}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
