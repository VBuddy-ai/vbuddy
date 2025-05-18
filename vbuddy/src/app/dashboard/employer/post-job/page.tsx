"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";
// @ts-expect-error - No type declarations available for Combobox
import { Combobox } from "@headlessui/react";
// @ts-expect-error - No type declarations available for icons
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import EmployerNavbar from "@/components/EmployerNavbar";
import { useCSRF } from "@/hooks/useCSRF";
import { useRouter } from "next/navigation";

const WORK_TYPES = ["full-time", "part-time", "contract", "freelance"] as const;

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
  // responsibilities: string;
  experience_level: string;
  hourly_rate_min: number;
  hourly_rate_max: number;
  is_remote: boolean;
  work_type: (typeof WORK_TYPES)[number];
  duration: string;
  location: string;
  expires_at: string;
  required_skills: string[];
}

export default function PostJobPage() {
  const { fetchWithCSRF } = useCSRF();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [skills, setSkills] = useState<JobSkill[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category_id: "",
    description: "",
    requirements: "",
    // responsibilities: "",
    experience_level: "",
    hourly_rate_min: 0,
    hourly_rate_max: 0,
    is_remote: false,
    work_type: WORK_TYPES[0],
    duration: "",
    location: "",
    expires_at: "",
    required_skills: [],
  });

  const validateForm = () => {
    if (!formData.title.trim()) return "Job title is required";
    if (!formData.category_id) return "Job category is required";
    if (!formData.description.trim()) return "Job description is required";
    if (!formData.requirements.trim()) return "Job requirements are required";
    // if (!formData.responsibilities.trim())
    // return "Job responsibilities are required";
    if (formData.hourly_rate_min < 0 || formData.hourly_rate_max < 0)
      return "Hourly rates cannot be negative";
    if (formData.hourly_rate_min > formData.hourly_rate_max)
      return "Minimum hourly rate cannot be greater than maximum hourly rate";
    if (!formData.duration.trim()) return "Job duration is required";
    if (!formData.location.trim()) return "Job location is required";
    if (!formData.expires_at) return "Expiry date is required";
    if (formData.required_skills.length === 0)
      return "At least one skill is required";
    return null;
  };

  useEffect(() => {
    fetchCategoriesAndSkills();
  }, []);

  const fetchCategoriesAndSkills = async () => {
    try {
      const supabase = createSupabaseBrowserClient();

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("job_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("job_skills")
        .select("*")
        .order("name");

      if (skillsError) throw skillsError;
      setSkills(skillsData);

      // Set initial category if available
      if (categoriesData.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: categoriesData[0].id }));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch categories and skills"
      );
    }
  };

  const getFilteredSkills = () => {
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.category_id
    );
    if (!selectedCategory) return [];

    return skills
      .filter((skill) => skill.category_id === selectedCategory.id)
      .filter((skill) =>
        skill.name.toLowerCase().includes(query.toLowerCase())
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithCSRF("/api/employer/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          salary_range: formData.salary_range,
          location: formData.location,
          job_type: formData.job_type,
          experience_level: formData.experience_level,
          skills: formData.skills,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create job posting");
      }

      // Redirect to jobs list on success
      router.push("/dashboard/employer/my-jobs");
    } catch (err) {
      console.error("Error creating job posting:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create job posting"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNavbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Post a New Job
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Fill out the form below to post a new job opening.</p>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  Job posted successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Job Details
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Provide the basic information about the job position.
                    </p>
                  </div>
                  <div className="mt-5 md:mt-0 md:col-span-2">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Job Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="category_id"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Job Category
                        </label>
                        <select
                          id="category_id"
                          name="category_id"
                          required
                          value={formData.category_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category_id: e.target.value,
                            })
                          }
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="work_type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Work Type
                        </label>
                        <select
                          id="work_type"
                          name="work_type"
                          required
                          value={formData.work_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              work_type: e.target
                                .value as (typeof WORK_TYPES)[number],
                            })
                          }
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          {WORK_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Job Description
                        </label>
                        <RichTextEditor
                          value={formData.description}
                          onChange={(value) =>
                            setFormData({ ...formData, description: value })
                          }
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="requirements"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Requirements
                        </label>
                        <RichTextEditor
                          value={formData.requirements}
                          onChange={(value) =>
                            setFormData({ ...formData, requirements: value })
                          }
                        />
                      </div>

                      {/* <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="responsibilities"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Responsibilities
                        </label>
                        <RichTextEditor
                          value={formData.responsibilities}
                          onChange={(value) =>
                            setFormData({
                              ...formData,
                              responsibilities: value,
                            })
                          }
                        />
                      </div> */}

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="experience_level"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Experience Level
                        </label>
                        <select
                          id="experience_level"
                          name="experience_level"
                          required
                          value={formData.experience_level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              experience_level: e.target.value,
                            })
                          }
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select Experience Level</option>
                          <option value="entry">Entry-level</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="hourly_rate_min"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Hourly Rate (USD)
                        </label>
                        <input
                          type="number"
                          name="hourly_rate_min"
                          id="hourly_rate_min"
                          required
                          min="0"
                          step="0.01"
                          value={formData.hourly_rate_min}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hourly_rate_min: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="hourly_rate_max"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Hourly Rate (USD)
                        </label>
                        <input
                          type="number"
                          name="hourly_rate_max"
                          id="hourly_rate_max"
                          required
                          min="0"
                          step="0.01"
                          value={formData.hourly_rate_max}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hourly_rate_max: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="is_remote"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Is Remote
                        </label>
                        <input
                          type="checkbox"
                          name="is_remote"
                          id="is_remote"
                          checked={formData.is_remote}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_remote: e.target.checked,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="duration"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Duration
                        </label>
                        <input
                          type="text"
                          name="duration"
                          id="duration"
                          required
                          placeholder="e.g., 3 months, 6 months, Permanent"
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration: e.target.value,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          required
                          placeholder="e.g., Remote, US, Europe"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="expires_at"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Expires At
                        </label>
                        <input
                          type="date"
                          name="expires_at"
                          id="expires_at"
                          required
                          value={formData.expires_at}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expires_at: e.target.value,
                            })
                          }
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label
                          htmlFor="skills"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Required Skills
                        </label>
                        <Combobox
                          value={formData.required_skills}
                          onChange={(skills: string[]) =>
                            setFormData({
                              ...formData,
                              required_skills: skills,
                            })
                          }
                          multiple
                        >
                          <div className="relative mt-1">
                            <Combobox.Input
                              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                              onChange={(
                                event: React.ChangeEvent<HTMLInputElement>
                              ) => setQuery(event.target.value)}
                              displayValue={(skill: string) => skill}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </Combobox.Button>

                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {getFilteredSkills().map((skill) => (
                                <Combobox.Option
                                  key={skill.id}
                                  value={skill.name}
                                  className={({
                                    active,
                                  }: {
                                    active: boolean;
                                  }) =>
                                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                      active
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-900"
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
                                          selected
                                            ? "font-semibold"
                                            : "font-normal"
                                        }`}
                                      >
                                        {skill.name}
                                      </span>
                                      {selected && (
                                        <span
                                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                            active
                                              ? "text-white"
                                              : "text-indigo-600"
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
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {showPreview ? "Edit" : "Preview"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? "Posting..." : "Post Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
