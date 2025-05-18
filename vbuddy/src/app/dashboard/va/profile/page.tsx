"use client";

import React, { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { KYCVerification } from "@/lib/supabase/kycVerification";
import Link from "next/link";
import VANavbar from "@/components/VANavbar";
import Footer from "@/components/Footer";

// Define interface for VA Profile data
interface VAProfile {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  preferred_hourly_rate: number | null;
  primary_skills: string[] | null;
  years_of_experience: number | null;
  portfolio_url: string | null;
  profile_picture_url: string | null;
  resume_url: string | null;
}

const VAProfilePage = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [profile, setProfile] = useState<VAProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch VA profile
        const { data: profileData, error: profileError } = await supabase
          .from("va_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (
          profileError &&
          !(
            profileError.code === "PGRST116" &&
            profileError.details === "The result contains 0 rows"
          )
        ) {
          console.error("Failed to fetch VA profile:", profileError);
          setError("Failed to load profile data.");
        } else {
          setProfile(profileData as VAProfile | null);
        }

        // Fetch KYC status
        const { data: kycStatusData, error: kycStatusError } = await supabase
          .from("kyc_verifications")
          .select("*")
          .eq("va_id", user.id)
          .maybeSingle();

        if (
          kycStatusError &&
          !(
            kycStatusError.code === "PGRST116" &&
            kycStatusError.details === "The result contains 0 rows"
          )
        ) {
          console.error("Failed to fetch KYC status:", kycStatusError);
          setError((prev) =>
            prev
              ? prev + "\nFailed to load KYC status."
              : "Failed to load KYC status."
          );
        } else {
          setKycStatus(kycStatusData as KYCVerification | null);
        }
      } catch (err) {
        console.error("An unexpected error occurred:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!profile)
    return <div className="p-8 text-center">No profile data found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <VANavbar />
      <div className="flex-grow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profile Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name:</p>
              <p className="mt-1 text-gray-900">{profile.full_name}</p>
            </div>
            {profile.headline && (
              <div>
                <p className="text-sm font-medium text-gray-500">Headline:</p>
                <p className="mt-1 text-gray-900">{profile.headline}</p>
              </div>
            )}
            {profile.bio && (
              <div>
                <p className="text-sm font-medium text-gray-500">Bio:</p>
                <p className="mt-1 text-gray-900">{profile.bio}</p>
              </div>
            )}
            {profile.preferred_hourly_rate !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Hourly Rate:
                </p>
                <p className="mt-1 text-gray-900">
                  ${profile.preferred_hourly_rate}
                </p>
              </div>
            )}
            {profile.primary_skills && profile.primary_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Primary Skills:
                </p>
                <p className="mt-1 text-gray-900">
                  {profile.primary_skills.join(", ")}
                </p>
              </div>
            )}
            {profile.years_of_experience !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Years of Experience:
                </p>
                <p className="mt-1 text-gray-900">
                  {profile.years_of_experience}
                </p>
              </div>
            )}
            {profile.portfolio_url && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Portfolio URL:
                </p>
                <p className="mt-1 text-indigo-600 hover:underline">
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {profile.portfolio_url}
                  </a>
                </p>
              </div>
            )}

            {/* Video Section */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">
                Introduction Video:
              </p>
              {videoError ? (
                <p className="text-red-600">{videoError}</p>
              ) : profile.portfolio_url ? (
                <video
                  controls
                  width="640"
                  height="360"
                  className="rounded-lg shadow-md"
                  onError={(e) => {
                    console.error("Video loading error:", e);
                    setVideoError("Failed to load video");
                  }}
                >
                  <source src={profile.portfolio_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <p className="text-gray-500">No video available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            KYC Verification Status
          </h2>
          <div>
            <p className="text-sm font-medium text-gray-500">Status:</p>
            <p className="mt-1 text-gray-900">
              {kycStatus ? kycStatus.status : "Not submitted"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard/va/profile/edit"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Edit Profile
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VAProfilePage;
