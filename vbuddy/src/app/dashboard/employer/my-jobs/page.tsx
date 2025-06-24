"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import EmployerNavbar from "@/components/EmployerNavbar";

interface Job {
  id: string;
  title: string;
  status: string;
  category_id: string;
  category_name?: string;
  skills?: string[];
}

interface SupabaseJob {
  id: string;
  title: string;
  status: string;
  category_id: string;
  job_categories?: { name: string } | { name: string }[] | null;
  job_skills_mapping?: {
    job_skills?: { name: string } | { name: string }[] | null;
  }[];
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      // Fetch jobs with category name and skills
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `id, title, status, category_id, job_categories(name), job_skills_mapping(job_skills(name))`
        );
      if (error) throw error;
      // Transform data to include category name and skills array
      const jobsWithDetails: Job[] = ((data as SupabaseJob[]) || []).map(
        (job) => {
          // Handle job_categories as object or array
          let categoryName = "";
          if (Array.isArray(job.job_categories)) {
            categoryName = job.job_categories[0]?.name || "";
          } else if (job.job_categories) {
            categoryName = job.job_categories.name;
          }
          // Handle job_skills_mapping as array of objects
          const skills: string[] = (job.job_skills_mapping || [])
            .map((jsm) => {
              if (Array.isArray(jsm.job_skills)) {
                return jsm.job_skills[0]?.name;
              } else if (jsm.job_skills) {
                return jsm.job_skills.name;
              }
              return undefined;
            })
            .filter((name): name is string => Boolean(name));
          return {
            id: job.id,
            title: job.title,
            status: job.status,
            category_id: job.category_id,
            category_name: categoryName,
            skills,
          };
        }
      );
      setJobs(jobsWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: "open" | "closed"
  ) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (updateError) throw updateError;

      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update job status"
      );
    }
  };

  const handleDelete = async (jobId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);
      if (deleteError) throw deleteError;
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <EmployerNavbar /> */}

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Jobs</h1>
            <Link
              href="/dashboard/employer/post-job"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Post New Job
            </Link>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No jobs posted
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by posting a new job.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/employer/post-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Post New Job
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-medium text-indigo-600 truncate">
                            {job.title}
                          </h2>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {job.category_name}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {job.skills && job.skills.length > 0
                                ? job.skills.join(", ")
                                : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              job.status === "open"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/employer/jobs/${job.id}/applications`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Applications
                            </Link>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  job.id,
                                  job.status === "open" ? "closed" : "open"
                                )
                              }
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {job.status === "open" ? "Close" : "Reopen"}
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() =>
                                (window.location.href = `/dashboard/employer/my-jobs/${job.id}/edit`)
                              }
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
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
