"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import EmployerNavbar from "@/components/EmployerNavbar";
import { v4 as uuidv4 } from "uuid";
import { useCSRF } from "@/hooks/useCSRF";

// Interface for the employer_profiles table
interface EmployerProfile {
  id: string;
  updated_at?: string;
  full_name?: string;
  position?: string;
  company_id?: string; // Foreign key to employer_company_profiles
  contact_phone?: string;
  profile_picture_url?: string;
  about_me?: string;
  created_at?: string;
}

// Interface for the employer_company_profiles table
interface EmployerCompanyProfile {
  id: string;
  name?: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

const EmployerProfileEditPage = () => {
  const supabase = createSupabaseBrowserClient();
  const { fetchWithCSRF } = useCSRF();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for form fields, mirroring the table structures
  const [employerFormData, setEmployerFormData] = useState<EmployerProfile>({
    id: "", // This will be filled with user.id on fetch/create
    full_name: "",
    position: "",
    company_id: undefined, // Will be filled on fetch/create of company profile
    contact_phone: "",
    profile_picture_url: "",
    about_me: "",
  });

  const [companyFormData, setCompanyFormData] =
    useState<EmployerCompanyProfile>({
      id: "", // This will be filled on create/fetch
      name: "",
      description: "",
      website_url: "",
      logo_url: "", // Placeholder for URL
      industry: "",
      company_size: "",
      location: "",
    });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      // Fetch or Create Employer Profile
      const { data: employerData, error: employerError } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (employerError && employerError.code !== "PGRST116") {
        // PGRST116 means no row found
        throw employerError;
      }

      let currentEmployerProfile = employerData as EmployerProfile | null;

      if (!currentEmployerProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from("employer_profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata.full_name || "",
          })
          .select("*")
          .single();

        if (createError) throw createError;
        currentEmployerProfile = newProfile;
      }

      setEmployerFormData(currentEmployerProfile || { id: user.id });

      // Fetch or Create Company Profile and link it if necessary
      let currentCompanyProfile = null;
      let currentCompanyId = currentEmployerProfile?.company_id;

      if (currentCompanyId) {
        // Try fetching existing company profile
        const { data: companyData, error: companyError } = await supabase
          .from("employer_company_profiles")
          .select("*")
          .eq("id", currentCompanyId)
          .single();

        if (companyError && companyError.code !== "PGRST116") {
          throw companyError;
        }
        currentCompanyProfile = companyData as EmployerCompanyProfile | null;
      }

      // If no company profile found or linked, create a new one
      if (!currentCompanyProfile) {
        const newCompanyId = uuidv4();
        const { data: newCompany, error: companyCreateError } = await supabase
          .from("employer_company_profiles")
          .insert({
            id: newCompanyId,
            name: "New Company", // Add default name to satisfy not-null constraint
            description: "",
            website_url: "",
            logo_url: "",
            industry: "",
            company_size: "",
            location: "",
          })
          .select("*")
          .single();

        if (companyCreateError) throw companyCreateError;
        currentCompanyProfile = newCompany;
        currentCompanyId = newCompanyId; // Use the newly created company id

        // Link the new company id to the employer profile
        const { error: linkError } = await supabase
          .from("employer_profiles")
          .update({ company_id: currentCompanyId })
          .eq("id", user.id);

        if (linkError) throw linkError;
        // Update local state to reflect the new company_id
        setEmployerFormData((prev) => ({
          ...prev,
          company_id: currentCompanyId,
        }));
      }

      setCompanyFormData(currentCompanyProfile || { id: "" });
    } catch (err) {
      console.error("Error fetching or creating profiles:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch or create profiles"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    // Determine which form data to update based on the input name
    if (
      [
        "full_name",
        "position",
        "contact_phone",
        "profile_picture_url",
        "about_me",
      ].includes(name)
    ) {
      setEmployerFormData((prev) => ({ ...prev, [name]: value }));
    } else if (
      [
        "name",
        "description",
        "website_url",
        "logo_url",
        "industry",
        "company_size",
        "location",
      ].includes(name)
    ) {
      setCompanyFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("User not logged in.");
        setSaving(false);
        return;
      }

      // Ensure we have the correct company_id before saving company profile
      const currentCompanyId = employerFormData.company_id;
      if (!currentCompanyId) {
        setSaveError("Company ID is missing. Cannot save company profile.");
        setSaving(false);
        return;
      }

      // Save Employer Profile data with CSRF protection
      const employerResponse = await fetchWithCSRF("/api/employer/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: employerFormData.full_name,
          position: employerFormData.position,
          contact_phone: employerFormData.contact_phone,
          profile_picture_url: employerFormData.profile_picture_url,
          about_me: employerFormData.about_me,
        }),
      });

      if (!employerResponse.ok) {
        throw new Error("Failed to save employer profile");
      }

      // Save Company Profile data with CSRF protection
      const companyResponse = await fetchWithCSRF("/api/employer/company", {
        method: "PUT",
        body: JSON.stringify({
          id: currentCompanyId,
          name: companyFormData.name,
          description: companyFormData.description,
          website_url: companyFormData.website_url,
          logo_url: companyFormData.logo_url,
          industry: companyFormData.industry,
          company_size: companyFormData.company_size,
          location: companyFormData.location,
        }),
      });

      if (!companyResponse.ok) {
        throw new Error("Failed to save company profile");
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error("Error saving profiles:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profiles"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading profile...</div>;
  if (error)
    return <div className="text-center text-red-600 py-8">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <EmployerNavbar />
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Company Profile</h1>
        <form
          onSubmit={handleSaveProfile}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          {/* Employer Profile Fields */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={employerFormData.full_name || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700"
            >
              Your Position
            </label>
            <input
              type="text"
              name="position"
              id="position"
              value={employerFormData.position || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="contact_phone"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Phone
            </label>
            <input
              type="text"
              name="contact_phone"
              id="contact_phone"
              value={employerFormData.contact_phone || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="profile_picture_url"
              className="block text-sm font-medium text-gray-700"
            >
              Profile Picture URL (Optional)
            </label>
            <input
              type="url"
              name="profile_picture_url"
              id="profile_picture_url"
              value={employerFormData.profile_picture_url || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {/* TODO: Implement actual file upload for profile picture */}
          </div>

          <div>
            <label
              htmlFor="about_me"
              className="block text-sm font-medium text-gray-700"
            >
              About You
            </label>
            <textarea
              name="about_me"
              id="about_me"
              value={employerFormData.about_me || ""}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <h2 className="text-xl font-bold mb-4 mt-8">Company Information</h2>

          {/* Company Profile Fields */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Company Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={companyFormData.name || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Company Description
            </label>
            <textarea
              name="description"
              id="description"
              value={companyFormData.description || ""}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="block text-sm font-medium text-gray-700"
            >
              Industry
            </label>
            <input
              type="text"
              name="industry"
              id="industry"
              value={companyFormData.industry || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
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
              value={companyFormData.location || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="website_url"
              className="block text-sm font-medium text-gray-700"
            >
              Company Website (Optional)
            </label>
            <input
              type="url"
              name="website_url"
              id="website_url"
              value={companyFormData.website_url || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="company_size"
              className="block text-sm font-medium text-gray-700"
            >
              Company Size (Optional)
            </label>
            <input
              type="text"
              name="company_size"
              id="company_size"
              value={companyFormData.company_size || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="logo_url"
              className="block text-sm font-medium text-gray-700"
            >
              Company Logo URL (Optional)
            </label>
            <input
              type="url"
              name="logo_url"
              id="logo_url"
              value={companyFormData.logo_url || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {/* TODO: Implement actual file upload for logo */}
          </div>

          {saveSuccess && (
            <div className="text-green-600 text-sm">
              Profile saved successfully!
            </div>
          )}
          {saveError && (
            <div className="text-red-600 text-sm">
              Error saving profile: {saveError}
            </div>
          )}

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployerProfileEditPage;
