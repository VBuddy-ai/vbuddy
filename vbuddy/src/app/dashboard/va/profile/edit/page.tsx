"use client";

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface VAProfile {
  id: string;
  full_name: string;
  headline: string | null;
  about_me: string | null;
  preferred_hourly_rate: number | null;
  primary_skills: string[] | null;
  years_of_experience: number | null;
  portfolio_url: string | null;
  profile_picture_url: string | null;
  resume_url: string | null;
}

const VAProfileEditPage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [profile, setProfile] = useState<VAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("User not authenticated:", userError?.message);
          router.push("/login");
          return;
        }
        const user = userData.user;

        const { data, error: profileError } = await supabase
          .from("va_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(data as VAProfile | null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (!profile) return;

    // In a real implementation, you would get form values here
    const updatedProfileData = { ...profile }; // Replace with actual form data

    try {
      const { error } = await supabase
        .from("va_profiles")
        .update(updatedProfileData)
        .eq("id", profile.id);

      if (error) throw error;

      setSaveSuccess(true);
      // Optionally, navigate back to the profile view page or update state
      router.push("/dashboard/va/profile");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">Loading profile for editing...</div>
    );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!profile)
    return (
      <div className="p-8 text-center">No profile data found to edit.</div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit My Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSave}>
          {/* Add form fields here for name, headline, bio, rate, etc. */}
          {/* Example: */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="full_name"
            >
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.full_name || ""} // Use || '' for nullable fields
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              required
            />
          </div>
          {/* Add more fields for other profile properties */}

          {/* Headline */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="headline"
            >
              Headline
            </label>
            <input
              type="text"
              id="headline"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.headline || ""}
              onChange={(e) =>
                setProfile({ ...profile, headline: e.target.value })
              }
            />
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="about_me"
            >
              About Me
            </label>
            <textarea
              id="about_me"
              rows={4}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.about_me || ""}
              onChange={(e) =>
                setProfile({ ...profile, about_me: e.target.value })
              }
            />
          </div>

          {/* Hourly Rate */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="preferred_hourly_rate"
            >
              Hourly Rate ($)
            </label>
            <input
              type="number"
              id="preferred_hourly_rate"
              step="0.01"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.preferred_hourly_rate || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferred_hourly_rate: parseFloat(e.target.value) || null,
                })
              }
            />
          </div>

          {/* Primary Skills (comma-separated) */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="primary_skills"
            >
              Primary Skills (comma-separated)
            </label>
            <textarea
              id="primary_skills"
              rows={2}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.primary_skills?.join(", ") || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  primary_skills: e.target.value
                    ? e.target.value.split(",").map((skill) => skill.trim())
                    : null,
                })
              }
            />
          </div>

          {/* Years of Experience */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="years_of_experience"
            >
              Years of Experience
            </label>
            <input
              type="number"
              id="years_of_experience"
              step="1"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.years_of_experience || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  years_of_experience: parseInt(e.target.value) || null,
                })
              }
            />
          </div>

          {/* Portfolio URL */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="portfolio_url"
            >
              Portfolio URL
            </label>
            <input
              type="url"
              id="portfolio_url"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profile.portfolio_url || ""}
              onChange={(e) =>
                setProfile({ ...profile, portfolio_url: e.target.value })
              }
            />
          </div>

          {/* Profile Picture Upload */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="profile_picture"
            >
              Profile Picture
            </label>
            <input
              type="file"
              id="profile_picture"
              accept="image/*"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsSaving(true); // Use isSaving for file uploads too
                setSaveError(null);
                try {
                  const filePath = `${profile.id}/avatar/${Date.now()}-${
                    file.name
                  }`;
                  const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, file, { upsert: true }); // Use upsert: true to replace existing file
                  if (uploadError) throw uploadError;
                  const { publicUrl } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath).data;
                  setProfile({ ...profile, profile_picture_url: publicUrl });
                  setSaveSuccess(true);
                } catch (err) {
                  console.error("Failed to upload profile picture:", err);
                  setSaveError(
                    err instanceof Error
                      ? err.message
                      : "Failed to upload profile picture."
                  );
                  setSaveSuccess(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            {profile.profile_picture_url && (
              <img
                src={profile.profile_picture_url}
                alt="Current Profile"
                className="mt-2 w-24 h-24 object-cover rounded-full"
              />
            )}
          </div>

          {/* Resume Upload */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="resume"
            >
              Resume (PDF or Word)
            </label>
            <input
              type="file"
              id="resume"
              accept=".pdf,.doc,.docx"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsSaving(true);
                setSaveError(null);
                try {
                  const filePath = `${profile.id}/resume/${Date.now()}-${
                    file.name
                  }`;
                  const { error: uploadError } = await supabase.storage
                    .from("resumes")
                    .upload(filePath, file);
                  if (uploadError) throw uploadError;
                  const { publicUrl } = supabase.storage
                    .from("resumes")
                    .getPublicUrl(filePath).data;
                  setProfile({ ...profile, resume_url: publicUrl });
                  setSaveSuccess(true);
                } catch (err) {
                  console.error("Failed to upload resume:", err);
                  setSaveError(
                    err instanceof Error
                      ? err.message
                      : "Failed to upload resume."
                  );
                  setSaveSuccess(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            {profile.resume_url && (
              <p className="mt-2 text-sm text-gray-600">
                Current Resume:{" "}
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View
                </a>
              </p>
            )}
          </div>

          {/* Portfolio Video Upload */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="portfolio"
            >
              Portfolio Video/File
            </label>
            <input
              type="file"
              id="portfolio"
              accept="video/*,image/*,.pdf"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsSaving(true);
                setSaveError(null);
                try {
                  const filePath = `${profile.id}/portfolio/${Date.now()}-${
                    file.name
                  }`;
                  const { error: uploadError } = await supabase.storage
                    .from("portfolios")
                    .upload(filePath, file);
                  if (uploadError) throw uploadError;
                  const { publicUrl } = supabase.storage
                    .from("portfolios")
                    .getPublicUrl(filePath).data;
                  setProfile({ ...profile, portfolio_url: publicUrl });
                  setSaveSuccess(true);
                } catch (err) {
                  console.error("Failed to upload portfolio:", err);
                  setSaveError(
                    err instanceof Error
                      ? err.message
                      : "Failed to upload portfolio."
                  );
                  setSaveSuccess(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            {profile.portfolio_url && (
              <p className="mt-2 text-sm text-gray-600">
                Current Portfolio:{" "}
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  View
                </a>
              </p>
            )}
          </div>

          {saveError && (
            <div className="text-red-600 text-sm mb-4">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="text-green-600 text-sm mb-4">
              Profile saved successfully!
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VAProfileEditPage;
