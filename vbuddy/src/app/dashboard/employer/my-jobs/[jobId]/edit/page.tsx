"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";
// @ts-expect-error - No type declarations available
import { Combobox } from "@headlessui/react";
// @ts-expect-error - No type declarations available
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const WORK_TYPES = ["Full-time", "Part-time", "Contract", "Freelance"] as const;

interface JobCategory {
  id: string;
  name: string;
  description: string;
}

interface JobSkill {
  id: string;
  name: string;
  category_id: string;
}

interface FormData {
  title: string;
  category_id: string;
  description: string;
  requirements: string;
  hourly_rate: number;
  work_type: (typeof WORK_TYPES)[number];
  duration: string;
  location: string;
  required_skills: string[];
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [skills, setSkills] = useState<JobSkill[]>([]);
  const [query, setQuery] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);

  useEffect(() => {
    fetchCategoriesAndSkills();
    fetchJob();
  }, []);

  const fetchCategoriesAndSkills = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: categoriesData } = await supabase
        .from("job_categories")
        .select("*")
        .order("name");
      setCategories(categoriesData || []);
      const { data: skillsData } = await supabase
        .from("job_skills")
        .select("*")
        .order("name");
      setSkills(skillsData || []);
    } catch (err) {
      setError("Failed to fetch categories or skills");
    }
  };

  const fetchJob = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      if (jobError) throw jobError;
      // Fetch job skills
      const { data: jobSkills } = await supabase
        .from("job_skills_mapping")
        .select("job_skills!inner(name)")
        .eq("job_id", jobId);
      setFormData({
        title: job.title,
        category_id: job.category_id,
        description: job.description,
        requirements: job.requirements,
        hourly_rate: job.hourly_rate,
        work_type: job.work_type,
        duration: job.duration,
        location: job.location,
        required_skills: (jobSkills || [])
          .map((jsm: any) => jsm.job_skills?.name)
          .filter(Boolean),
      });
    } catch (err) {
      setError("Failed to fetch job data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      // Update job
      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          category_id: formData.category_id,
          description: formData.description,
          requirements: formData.requirements,
          hourly_rate: formData.hourly_rate,
          work_type: formData.work_type,
          duration: formData.duration,
          location: formData.location,
        })
        .eq("id", jobId);
      if (updateError) throw updateError;
      // Update job skills: delete old, insert new
      await supabase.from("job_skills_mapping").delete().eq("job_id", jobId);
      if (formData.required_skills.length > 0) {
        const jobSkills = formData.required_skills.map((skillName) => {
          const skill = skills.find((s) => s.name === skillName);
          return {
            job_id: jobId,
            skill_id: skill?.id,
          };
        });
        await supabase.from("job_skills_mapping").insert(jobSkills);
      }
      router.push("/dashboard/employer/my-jobs");
    } catch (err) {
      setError("Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !formData) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Work Type
          </label>
          <select
            value={formData.work_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                work_type: e.target.value as (typeof WORK_TYPES)[number],
              })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            {WORK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requirements
          </label>
          <RichTextEditor
            value={formData.requirements}
            onChange={(value) =>
              setFormData({ ...formData, requirements: value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Hourly Rate (USD)
          </label>
          <input
            type="number"
            value={formData.hourly_rate}
            onChange={(e) =>
              setFormData({
                ...formData,
                hourly_rate: parseFloat(e.target.value),
              })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Required Skills
          </label>
          <Combobox
            value={formData.required_skills}
            onChange={(skills: string[]) =>
              setFormData({ ...formData, required_skills: skills })
            }
            multiple
          >
            <div className="relative mt-1">
              <Combobox.Input
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(event.target.value)
                }
                displayValue={(skill: string) => skill}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </Combobox.Button>
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {skills
                  .filter((skill) =>
                    skill.name.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((skill) => (
                    <Combobox.Option
                      key={skill.id}
                      value={skill.name}
                      className={({ active }: { active: boolean }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                          active ? "bg-indigo-600 text-white" : "text-gray-900"
                        }`
                      }
                    >
                      {({
                        selected,
                        active,
                      }: {
                        selected: boolean;
                        active: boolean;
                      }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-semibold" : "font-normal"
                            }`}
                          >
                            {skill.name}
                          </span>
                          {selected && (
                            <span
                              className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                active ? "text-white" : "text-indigo-600"
                              }`}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
