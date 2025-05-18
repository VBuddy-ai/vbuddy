import { createSupabaseBrowserClient } from "./client";

interface KYCVerificationData {
  verification_id: string;
  verification_status: string;
  verification_date: string;
  document_checks: {
    document_type: string;
    status: string;
    expiry_date?: string;
  }[];
  identity_checks: {
    name_match: boolean;
    dob_match: boolean;
    address_match: boolean;
  };
}

export interface KYCDocuments {
  id_document: {
    type: string;
    number: string;
    expiry_date: string;
    front_url: string;
    back_url: string;
  };
  proof_of_address: {
    type: string;
    issue_date: string;
    document_url: string;
  };
  selfie: {
    image_url: string;
  };
}

export interface KYCVerification {
  id: string;
  va_id: string;
  status: "pending" | "verified" | "rejected";
  verification_id: string | null;
  verification_data: KYCVerificationData | null;
  documents: KYCDocuments | null;
  created_at: string;
  updated_at: string;
}

export async function getKYCStatus(
  vaId: string
): Promise<KYCVerification | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kyc_verifications")
    .select("*")
    .eq("va_id", vaId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching KYC status:", error);
    return null;
  }

  return data;
}

export async function initiateKYCVerification(
  vaId: string,
  documents: KYCDocuments
): Promise<KYCVerification | null> {
  const supabase = createSupabaseBrowserClient();

  // First, check if a verification already exists
  const existing = await getKYCStatus(vaId);
  if (existing) {
    // Update existing verification
    const { data, error } = await supabase
      .from("kyc_verifications")
      .update({
        status: "pending",
        documents,
        updated_at: new Date().toISOString(),
      })
      .eq("va_id", vaId)
      .select()
      .single();

    if (error) {
      console.error("Error updating KYC verification:", error);
      return null;
    }

    return data;
  }

  // Create new verification
  const { data, error } = await supabase
    .from("kyc_verifications")
    .insert([
      {
        va_id: vaId,
        status: "pending",
        documents,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating KYC verification:", error);
    return null;
  }

  return data;
}

export async function updateKYCStatus(
  verificationId: string,
  status: "verified" | "rejected",
  verificationData: KYCVerificationData
): Promise<KYCVerification | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("kyc_verifications")
    .update({
      status,
      verification_data: verificationData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", verificationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating KYC status:", error);
    return null;
  }

  return data;
}

// Function to check if a VA's profile should be visible
export async function isVAProfileVisible(vaId: string): Promise<boolean> {
  const kycStatus = await getKYCStatus(vaId);
  return kycStatus?.status === "verified";
}
