import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getKYCStatus, KYCVerification } from "@/lib/supabase/kycVerification";
import { User } from "@supabase/supabase-js";

interface VAProfile {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  hourly_rate: number | null;
  primary_skills: string[] | null;
  experience_years: number | null;
  portfolio_url: string | null;
  profile_picture_url: string | null;
}

interface VAProfileData {
  profile: VAProfile | null;
  kycStatus: KYCVerification | null;
  user: User | null;
}

export async function fetchVAProfileData(): Promise<VAProfileData> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser().maybeSingle();

  if (!user) {
    return { profile: null, kycStatus: null, user: null };
  }

  // Fetch KYC status
  const kycStatus = await getKYCStatus(user.id);

  // Fetch VA profile
  const { data: profileData, error: profileError } = await supabase
    .from("va_profiles")
    .select("*", { count: "exact" })
    .eq("id", user.id)
    .maybeSingle(); // Use maybeSingle for robustness

  if (profileError) {
    console.error("Error fetching VA profile in Server Action:", profileError);
    // Depending on how we want to handle this, we might return null profile
    // or re-throw the error. For now, return null profile on error.
    return { profile: null, kycStatus, user };
  }

  return { profile: profileData, kycStatus, user };
}
