"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import VANavbar from "@/components/VANavbar";

interface JobCategory {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  hourly_rate: number;
  work_type: string;
  duration: string;
  location: string;
  category_id: string;
  category_name: string;
  skills: string[];
  employer: {
    id: string;
    full_name: string;
    company_name: string;
  };
  created_at: string;
}

interface DatabaseJob {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  hourly_rate: number;
  work_type: string;
  duration: string;
  location: string;
  category_id: string;
  created_at: string;
  employer: {
    id: string;
    full_name: string;
    company_name: string;
  };
  job_categories?: { name: string };
  job_skills_mapping?: Array<{
    job_skills?: { name: string };
  }>;
}

const JobsPage = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<Record<string, boolean>>({});
  const [hasApplied, setHasApplied] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]); // Only re-run if searchQuery changes

  useEffect(() => {
    fetchJobs(selectedCategoryId, debouncedSearchQuery);
  }, [selectedCategoryId, debouncedSearchQuery, supabase]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("job_categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchJobs = async (categoryId: string | "all", query: string) => {
    setLoading(true);
    setError(null);
    try {
      // Optimized query with better structure
      let jobsQuery = supabase
        .from("jobs")
        .select(
          `
          id,
          title,
          description,
          requirements,
          responsibilities,
          hourly_rate,
          work_type,
          duration,
          location,
          category_id,
          created_at,
          employer:employer_id!inner (
            id,
            full_name,
            company_name
          ),
          job_categories!inner (
            name
          ),
          job_skills_mapping (
            job_skills (
              name
            )
          )
        `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (categoryId !== "all") {
        jobsQuery = jobsQuery.eq("category_id", categoryId);
      }

      if (query) {
        jobsQuery = jobsQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      const { data, error } = await jobsQuery;

      if (error) throw error;

      // Optimized data transformation
      const jobsWithDetails = (data || []).map((job: any) => {
        // Safely extract category name
        const categoryName = job.job_categories?.name || "";

        // Safely extract skills with improved logic
        const skills: string[] = (job.job_skills_mapping || [])
          .map((mapping: any) => mapping.job_skills?.name)
          .filter(Boolean);

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          hourly_rate: job.hourly_rate,
          work_type: job.work_type,
          duration: job.duration,
          location: job.location,
          category_id: job.category_id,
          category_name: categoryName,
          skills,
          employer: job.employer,
          created_at: job.created_at,
        };
      });

      setJobs(jobsWithDetails);

      // Check application status for fetched jobs in parallel
      const user = await supabase.auth.getUser();
      if (user.data.user && jobsWithDetails.length > 0) {
        const jobIds = jobsWithDetails.map((job) => job.id);
        const { data: applications } = await supabase
          .from("job_applications")
          .select("job_id, status")
          .eq("va_id", user.data.user.id)
          .in("job_id", jobIds);

        // Create lookup map for O(1) lookups
        const applicationMap = new Map(
          (applications || []).map((app) => [app.job_id, app.status])
        );

        // Update application status efficiently
        const appliedJobsMap = Object.fromEntries(
          jobsWithDetails.map((job) => [job.id, applicationMap.has(job.id)])
        );

        setHasApplied(appliedJobsMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setIsApplying((prev) => ({ ...prev, [jobId]: true }));
    setSuccessMessage(null);
    setError(null);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("User not authenticated:", userError?.message);
        return;
      }
      const userId = userData.user.id;

      // Check if already applied
      const { data: existingApplications, error: checkError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("va_id", userId)
        .eq("job_id", jobId);

      if (checkError) throw checkError;
      if (existingApplications && existingApplications.length > 0) {
        setHasApplied((prev) => ({ ...prev, [jobId]: true }));
        setSuccessMessage("You have already applied for this job.");
        console.log("Already applied to this job.");
        return;
      }

      // Insert new application
      const { error: insertError } = await supabase
        .from("job_applications")
        .insert([
          {
            va_id: userId,
            job_id: jobId,
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      setHasApplied((prev) => ({ ...prev, [jobId]: true }));
      setSuccessMessage("Application submitted successfully!");
      console.log("Successfully applied for job", jobId);
    } catch (err) {
      console.error("Failed to apply for job:", err);
      setError(err instanceof Error ? err.message : "Failed to apply for job.");
      setSuccessMessage(null);
    } finally {
      setIsApplying((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VANavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Available Jobs
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1">
              <label
                htmlFor="job-search"
                className="block text-sm font-medium text-gray-700 sr-only"
              >
                Search Jobs
              </label>
              <input
                type="text"
                id="job-search"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Search by title or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="w-full sm:w-auto">
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700 sr-only"
              >
                Filter by Category:
              </label>
              <select
                id="category-filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          )}

          {!loading && jobs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No jobs available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back later for new job postings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-indigo-600 truncate">
                      {job.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      {job.employer?.company_name}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rate:</span>
                        <span className="text-gray-900">
                          ${job.hourly_rate}/hr
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-900">{job.work_type}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900">{job.location}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
                          onClick={() => setSelectedCategoryId(job.category_id)}
                        >
                          {job.category_name}
                        </span>
                        {job.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/va/jobs/${job.id}`)
                        }
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApply(job.id)}
                        className={`text-sm font-medium ${
                          hasApplied[job.id]
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        disabled={isApplying[job.id] || hasApplied[job.id]}
                      >
                        {isApplying[job.id]
                          ? "Applying..."
                          : hasApplied[job.id]
                          ? "Applied"
                          : "Apply"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
