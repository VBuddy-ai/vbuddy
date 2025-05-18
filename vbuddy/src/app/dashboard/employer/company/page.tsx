"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import EmployerNavbar from "@/components/EmployerNavbar";

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

const CompanyProfilePage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [companyProfile, setCompanyProfile] =
    useState<EmployerCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
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

      // First get the employer profile to get the company_id
      const { data: employerData, error: employerError } = await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (employerError) throw employerError;

      if (!employerData?.company_id) {
        setError("No company profile found. Please create one first.");
        setLoading(false);
        return;
      }

      // Then fetch the company profile
      const { data: companyData, error: companyError } = await supabase
        .from("employer_company_profiles")
        .select("*")
        .eq("id", employerData.company_id)
        .single();

      if (companyError) throw companyError;
      setCompanyProfile(companyData);
    } catch (err) {
      console.error("Error fetching company profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch company profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-8">Loading company profile...</div>;
  if (error)
    return <div className="text-center text-red-600 py-8">Error: {error}</div>;
  if (!companyProfile)
    return <div className="text-center py-8">No company profile found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <EmployerNavbar />
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Company Profile</h1>
            <button
              onClick={() => router.push("/dashboard/employer/profile/edit")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit Profile
            </button>
          </div>

          <div className="space-y-6">
            {companyProfile.logo_url && (
              <div className="flex justify-center">
                <img
                  src={companyProfile.logo_url}
                  alt="Company Logo"
                  className="h-32 w-32 object-contain"
                />
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-2">
                {companyProfile.name}
              </h2>
              <p className="text-gray-600">{companyProfile.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                <p className="mt-1">
                  {companyProfile.industry || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Company Size
                </h3>
                <p className="mt-1">
                  {companyProfile.company_size || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1">
                  {companyProfile.location || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Website</h3>
                {companyProfile.website_url ? (
                  <a
                    href={companyProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-indigo-600 hover:text-indigo-500"
                  >
                    {companyProfile.website_url}
                  </a>
                ) : (
                  <p className="mt-1">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
