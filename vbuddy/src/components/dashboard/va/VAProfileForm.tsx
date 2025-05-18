"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image"; // For optimized image display

// Define a type for the VA profile data
export interface VAProfile {
  id?: string; // User ID, should match auth.users.id
  updated_at?: string;
  full_name?: string | null;
  profile_picture_url?: string | null;
  headline?: string | null;
  about_me?: string | null;
  contact_phone?: string | null;
  primary_skills?: Array<{ name: string; proficiency?: string }> | null; // More specific type
  years_of_experience?: number | null;
  desired_work_type?: string | null;
  preferred_hourly_rate?: number | null;
  availability?: string | null;
  resume_url?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  intro_video_url?: string | null;
  kyc_status?: string | null;
}

const VAProfileForm = () => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // New states for resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [currentResumeUrl, setCurrentResumeUrl] = useState<string | null>(null);

  // Fetch user and their profile data
  const fetchProfile = useCallback(
    async (currentUser: User) => {
      setLoading(true);
      setError(null);
      const { data, error: profileError } = await supabase
        .from("va_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116: row not found
        console.error("Error fetching profile:", profileError);
        setError("Failed to load profile. " + profileError.message);
      } else {
        const currentProfile = (data as VAProfile) || { id: currentUser.id };
        setProfile(currentProfile);
        if (currentProfile.profile_picture_url) {
          setImagePreviewUrl(currentProfile.profile_picture_url); // Set initial preview from DB
        }
        if (currentProfile.resume_url) {
          setCurrentResumeUrl(currentProfile.resume_url);
        }
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setLoading(false);
        setError("User not authenticated."); // Should be caught by middleware mostly
      }
    };
    getCurrentUser();
  }, [supabase, fetchProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfile((prev) =>
      prev ? { ...prev, [name]: value === "" ? null : value } : null
    );
    setSuccessMessage(null); // Clear success message on new input
    setError(null); // Clear error on new input
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) =>
      prev ? { ...prev, [name]: value === "" ? null : parseFloat(value) } : null
    );
    setSuccessMessage(null);
    setError(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      // Create a temporary URL for immediate preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setSuccessMessage(null);
      setError(null);
    } else {
      // If no file is selected (e.g., user clears the file input)
      // Revert to the original profile picture URL from the database if it exists
      // Or clear the preview if no file was previously uploaded or selected.
      setProfileImageFile(null);
      setImagePreviewUrl(profile?.profile_picture_url || null);
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setSuccessMessage(null);
      setError(null);
      // No direct preview for resume, but we can show the file name
      setCurrentResumeUrl(null); // Clear old DB URL if new file is selected
    } else {
      setResumeFile(null);
      // Revert to the original resume URL from the database if it exists
      setCurrentResumeUrl(profile?.resume_url || null);
    }
  };

  const uploadFileToBucket = async (
    file: File,
    bucketName: string,
    userId: string
  ): Promise<string | null> => {
    const fileName = `${userId}-${Date.now()}-${file.name}`.replace(
      /[^a-zA-Z0-9_.-]/g,
      "_"
    );
    const filePath = `${userId}/${fileName}`; // Store in a folder named by user_id

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading to ${bucketName}:`, uploadError);
      setError(
        `Failed to upload ${
          file.type.startsWith("image") ? "image" : "file"
        }: ${uploadError.message}`
      );
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      setError(
        `Failed to get public URL for the ${
          file.type.startsWith("image") ? "image" : "file"
        }.`
      );
      return null;
    }
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !user) {
      setError("User or profile data is missing.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    let uploadedImageUrl = profile.profile_picture_url;
    if (profileImageFile) {
      setUploadingImage(true);
      const newUrl = await uploadFileToBucket(
        profileImageFile,
        "profile-pictures",
        user.id
      );
      setUploadingImage(false);
      if (newUrl) {
        uploadedImageUrl = newUrl;
        setImagePreviewUrl(newUrl);
      } else {
        setSaving(false);
        return;
      }
    }

    let uploadedResumeUrl = profile.resume_url;
    if (resumeFile) {
      setUploadingResume(true);
      const newUrl = await uploadFileToBucket(resumeFile, "resumes", user.id);
      setUploadingResume(false);
      if (newUrl) {
        uploadedResumeUrl = newUrl;
        setCurrentResumeUrl(newUrl); // Update the displayed URL
      } else {
        setSaving(false);
        return;
      }
    }

    const { id, kyc_status, updated_at, ...restOfProfile } = profile;
    const profileDataToSave = {
      ...restOfProfile,
      profile_picture_url: uploadedImageUrl,
      resume_url: uploadedResumeUrl,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from("va_profiles")
      .update(profileDataToSave)
      .eq("id", user.id);

    setSaving(false);
    if (saveError) {
      console.error("Error saving profile:", saveError);
      setError("Failed to save profile: " + saveError.message);
    } else {
      setSuccessMessage("Profile updated successfully!");
      setProfileImageFile(null);
      setResumeFile(null); // Clear resume file state
      if (user) await fetchProfile(user); // Re-fetch to get the latest state including new image URL
    }
  };

  if (loading) {
    return <p className="text-center p-8">Loading profile...</p>;
  }

  if (error && !profile) {
    // Show critical error if profile couldn't be loaded at all
    return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  }

  if (!user || !profile) {
    // Should ideally not happen if loading is false and no critical error
    return (
      <p className="text-center text-red-500 p-8">
        Could not load profile data.
      </p>
    );
  }

  // Form JSX will go here
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 divide-y divide-gray-200"
    >
      {error && (
        <p className="mb-4 text-sm text-red-600 p-3 bg-red-100 rounded-md">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="mb-4 text-sm text-green-600 p-3 bg-green-100 rounded-md">
          {successMessage}
        </p>
      )}

      {/* Section 1: Basic Information */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Basic Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This information will be displayed publicly.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={profile.full_name || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Profile Picture Upload UI */}
          <div className="sm:col-span-6">
            <label
              htmlFor="profile_image_file"
              className="block text-sm font-medium text-gray-700"
            >
              Profile Picture
            </label>
            <div className="mt-2 flex items-center space-x-4">
              <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                {imagePreviewUrl ? (
                  <Image
                    src={imagePreviewUrl}
                    alt="Profile Preview"
                    width={80}
                    height={80}
                    className="object-cover h-full w-full"
                    onError={() => {
                      // Handle broken image links if necessary, e.g., revert to a default
                      console.warn(
                        "Failed to load image preview from: ",
                        imagePreviewUrl
                      );
                      // setImagePreviewUrl(DEFAULT_AVATAR_URL); // If you have one
                    }}
                  />
                ) : (
                  <svg
                    className="h-full w-full text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </span>
              <input
                type="file"
                name="profile_image_file"
                id="profile_image_file"
                onChange={handleImageFileChange}
                accept="image/png, image/jpeg, image/gif"
                className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              />
            </div>
            {uploadingImage && (
              <p className="mt-2 text-sm text-indigo-600">Uploading image...</p>
            )}
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="headline"
              className="block text-sm font-medium text-gray-700"
            >
              Headline / Tagline
            </label>
            <input
              type="text"
              name="headline"
              id="headline"
              value={profile.headline || ""}
              onChange={handleInputChange}
              placeholder="e.g., Experienced Social Media Manager | React Developer"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="about_me"
              className="block text-sm font-medium text-gray-700"
            >
              About Me
            </label>
            <textarea
              id="about_me"
              name="about_me"
              rows={5}
              value={profile.about_me || ""}
              onChange={handleInputChange}
              placeholder="Tell us a bit about your skills, experience, and what you are looking for."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Contact & Links */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Contact & Professional Links
          </h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label
              htmlFor="contact_email"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Email (from your account)
            </label>
            <input
              type="email"
              name="contact_email"
              id="contact_email"
              readOnly
              value={user.email || ""}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="sm:col-span-3">
            <label
              htmlFor="contact_phone"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Phone (Optional)
            </label>
            <input
              type="tel"
              name="contact_phone"
              id="contact_phone"
              value={profile.contact_phone || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label
              htmlFor="portfolio_url"
              className="block text-sm font-medium text-gray-700"
            >
              Portfolio URL (Optional)
            </label>
            <input
              type="url"
              name="portfolio_url"
              id="portfolio_url"
              value={profile.portfolio_url || ""}
              onChange={handleInputChange}
              placeholder="https://yourportfolio.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label
              htmlFor="github_url"
              className="block text-sm font-medium text-gray-700"
            >
              GitHub URL (Optional, for developers)
            </label>
            <input
              type="url"
              name="github_url"
              id="github_url"
              value={profile.github_url || ""}
              onChange={handleInputChange}
              placeholder="https://github.com/yourusername"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Work Preferences & Experience */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Work Preferences & Experience
          </h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label
              htmlFor="years_of_experience"
              className="block text-sm font-medium text-gray-700"
            >
              Overall Years of Experience
            </label>
            <input
              type="number"
              name="years_of_experience"
              id="years_of_experience"
              value={profile.years_of_experience || ""}
              onChange={handleNumericInputChange} // Use specific handler for numeric inputs
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="desired_work_type"
              className="block text-sm font-medium text-gray-700"
            >
              Desired Work Type
            </label>
            <select
              id="desired_work_type"
              name="desired_work_type"
              value={profile.desired_work_type || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select type</option>
              <option value="Part-time">Part-time</option>
              <option value="Full-time">Full-time</option>
              <option value="Project-based">Project-based</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="preferred_hourly_rate"
              className="block text-sm font-medium text-gray-700"
            >
              Preferred Hourly Rate (USD)
            </label>
            <input
              type="number"
              name="preferred_hourly_rate"
              id="preferred_hourly_rate"
              value={profile.preferred_hourly_rate || ""}
              onChange={handleNumericInputChange}
              min="0"
              step="0.01"
              placeholder="e.g., 25.50"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-6">
            <label
              htmlFor="availability"
              className="block text-sm font-medium text-gray-700"
            >
              Availability
            </label>
            <input
              type="text"
              name="availability"
              id="availability"
              value={profile.availability || ""}
              onChange={handleInputChange}
              placeholder="e.g., 20 hours/week, Mon-Fri, EST timezone"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          {/* TODO: Primary Skills - complex field, handle later (VAS-001) */}
          {/* TODO: Resume Upload UI - (VAS-001) */}
          <div className="sm:col-span-6">
            <label
              htmlFor="resume_file"
              className="block text-sm font-medium text-gray-700"
            >
              Upload Resume (PDF, DOCX)
            </label>
            <input
              type="file"
              name="resume_file"
              id="resume_file"
              onChange={handleResumeFileChange}
              accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {uploadingResume && (
              <p className="mt-2 text-sm text-indigo-600">
                Uploading resume...
              </p>
            )}
            {/* Display current resume link or newly selected file name */}
            {resumeFile && !uploadingResume && (
              <p className="mt-2 text-sm text-gray-700">
                Selected file: {resumeFile.name}
              </p>
            )}
            {!resumeFile && currentResumeUrl && (
              <div className="mt-2">
                <a
                  href={currentResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View Current Resume
                </a>
              </div>
            )}
          </div>
          {/* TODO: Intro Video Upload UI - (VAS-001) */}
          <div className="sm:col-span-6">
            <label
              htmlFor="intro_video_url"
              className="block text-sm font-medium text-gray-700"
            >
              Intro Video URL (Placeholder for upload)
            </label>
            <input
              type="text" // Will be file input later
              name="intro_video_url"
              id="intro_video_url"
              value={profile.intro_video_url || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading || uploadingImage || uploadingResume}
            className="ml-3 inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : uploadingImage || uploadingResume
              ? "Uploading Files..."
              : "Save Profile"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default VAProfileForm;
