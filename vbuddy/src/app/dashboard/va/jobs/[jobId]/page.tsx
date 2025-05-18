import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import VANavbar from "@/components/VANavbar";
import ApplyButton from "@/components/ApplyButton";

// Define interface for the structure within job_skills_mapping
interface JobSkillsMappingItem {
  job_skills: { name: string }[] | { name: string } | null;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  work_type: string;
  duration: string;
  location: string;
  category_name?: string;
  required_skills: string[];
  employer: {
    id: string;
    full_name: string;
    company_name: string;
  };
  created_at: string;
}

const JobDetailsPage = async ({ params }: { params: { jobId: string } }) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookies(),
    }
  );

  const { data: jobData, error } = await supabase
    .from("jobs")
    .select(
      `
      *,
      employer:employer_id (
        id,
        full_name,
        company_name
      ),
      job_categories (
        name
      ),
      job_required_skills_mapping:job_skills_mapping (
        job_skills (
          name
        )
      )
    `
    )
    .eq("id", params.jobId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching job details:", error);
    // Optionally display an error message
    return (
      <div className="min-h-screen bg-gray-100">
        <VANavbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <p className="text-center text-red-600">Error loading job details.</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    notFound(); // Show 404 if job not found
  }

  // Transform the data to include category name and skills array
  const job = jobData;
  let categoryName = "";
  if (Array.isArray(job.job_categories)) {
    categoryName = job.job_categories[0]?.name || "";
  } else if (job.job_categories) {
    categoryName = job.job_categories.name;
  }

  const skills: string[] = (job.job_skills_mapping || [])
    .map((jsm: JobSkillsMappingItem) => {
      const skillData = Array.isArray(jsm.job_skills)
        ? jsm.job_skills[0]
        : jsm.job_skills;
      return skillData?.name;
    })
    .filter(
      (name: string | undefined | null): name is string =>
        name !== null && name !== undefined
    );

  const jobDetails: JobDetails = {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    hourly_rate_min: job.hourly_rate_min,
    hourly_rate_max: job.hourly_rate_max,
    work_type: job.work_type,
    duration: job.duration,
    location: job.location,
    category_name: categoryName,
    skills,
    employer: job.employer,
    created_at: job.created_at,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <VANavbar />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {jobDetails.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {jobDetails.employer?.company_name}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Hourly Rate
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobDetails.hourly_rate_min !== null &&
                  jobDetails.hourly_rate_max !== null
                    ? jobDetails.hourly_rate_min === jobDetails.hourly_rate_max
                      ? `$${jobDetails.hourly_rate_min}/hr`
                      : `$${jobDetails.hourly_rate_min} - $${jobDetails.hourly_rate_max}/hr`
                    : jobDetails.hourly_rate_min !== null
                    ? `$${jobDetails.hourly_rate_min}+/hr`
                    : jobDetails.hourly_rate_max !== null
                    ? `Up to $${jobDetails.hourly_rate_max}/hr`
                    : "Rate not specified"}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Work Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobDetails.work_type}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobDetails.location}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobDetails.duration}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {jobDetails.category_name}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd
                  className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                  dangerouslySetInnerHTML={{
                    __html: jobDetails.description || "",
                  }}
                ></dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Requirements
                </dt>
                <dd
                  className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                  dangerouslySetInnerHTML={{
                    __html: jobDetails.requirements?.[0] || "",
                  }}
                ></dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Responsibilities
                </dt>
                <dd
                  className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                  dangerouslySetInnerHTML={{
                    __html: jobDetails.responsibilities || "",
                  }}
                ></dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Posted At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(jobDetails.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
          {/* Apply button placeholder - will be a client component */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            {/* The Apply Button will be a Client Component */}
            <ApplyButton jobId={jobDetails.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
