"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ApplyButtonProps {
  jobId: string;
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ jobId }) => {
  const supabase = createSupabaseBrowserClient();
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const checkApplicationStatus = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        // Handle not authenticated state if necessary, maybe disable button
        return;
      }
      const userId = userData.user.id;

      const { data, error: checkError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("va_id", userId)
        .eq("job_id", jobId);

      if (checkError) {
        console.error("Error checking application status:", checkError);
        // setError("Failed to check application status."); // Optional: display error
      }

      if (data && data.length > 0) {
        setHasApplied(true);
      }
    };

    checkApplicationStatus();
  }, [jobId, supabase]); // Re-run if jobId changes

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    setSuccess(false);

    if (!coverLetter.trim()) {
      setError("Cover letter is required.");
      setIsApplying(false);
      return;
    }

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("User not authenticated:", userError?.message);
        setError("Please log in to apply."); // Inform user they need to log in
        return;
      }
      const userId = userData.user.id;

      // Re-check if already applied to prevent double application in rare cases
      const { data: existingApplications, error: checkError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("va_id", userId)
        .eq("job_id", jobId);

      if (checkError) throw checkError;
      if (existingApplications && existingApplications.length > 0) {
        setHasApplied(true); // Update state if already applied
        setSuccess(true); // Indicate success as already applied is a form of success
        console.log("Already applied to this job.");
        return; // Stop if already applied
      }

      // Insert new application
      const { error: insertError } = await supabase
        .from("job_applications")
        .insert([
          {
            va_id: userId,
            job_id: jobId,
            status: "pending", // Set initial status
            cover_letter: coverLetter.trim(),
          },
        ]);

      if (insertError) throw insertError;

      setHasApplied(true);
      setSuccess(true);
      console.log("Successfully applied for job", jobId);
    } catch (err) {
      console.error("Failed to apply for job:", err);
      setError(err instanceof Error ? err.message : "Failed to apply for job.");
      setSuccess(false);
    } finally {
      setIsApplying(false);
    }
  };

  // Determine button text and disabled state
  const buttonText = isApplying
    ? "Applying..."
    : hasApplied
    ? "Applied"
    : "Apply";
  const isDisabled = isApplying || hasApplied;

  return (
    <>
      <div className="mt-4">
        <label
          htmlFor="coverLetter"
          className="block text-sm font-medium text-gray-700"
        >
          Cover Letter <span className="text-red-500">*</span>
        </label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          rows={6}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        ></textarea>
      </div>

      <button
        onClick={handleApply}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isDisabled
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
        disabled={isDisabled}
      >
        {buttonText}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {success && !hasApplied && (
        <p className="text-green-500 text-sm mt-2">
          Application submitted successfully!
        </p>
      )}
      {success && hasApplied && (
        <p className="text-gray-500 text-sm mt-2">
          You have already applied for this job.
        </p>
      )}
    </>
  );
};

export default ApplyButton;
