"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getKYCStatus,
  initiateKYCVerification,
  KYCVerification,
  KYCDocuments,
} from "@/lib/supabase/kycVerification";
import VANavbar from "@/components/VANavbar";

const KYCVerificationPage = () => {
  const router = useRouter();
  const [kycStatus, setKYCStatus] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<KYCDocuments>({
    id_document: {
      type: "",
      number: "",
      expiry_date: "",
      front_url: "",
      back_url: "",
    },
    proof_of_address: {
      type: "",
      issue_date: "",
      document_url: "",
    },
    selfie: {
      image_url: "",
    },
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const status = await getKYCStatus(user.id);
      setKYCStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch KYC status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: "id_front" | "id_back" | "address" | "selfie"
  ) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `kyc/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      setDocuments((prev: KYCDocuments) => ({
        ...prev,
        id_document: {
          ...prev.id_document,
          ...(type === "id_front" && { front_url: data.publicUrl }),
          ...(type === "id_back" && { back_url: data.publicUrl }),
        },
        proof_of_address: {
          ...prev.proof_of_address,
          ...(type === "address" && { document_url: data.publicUrl }),
        },
        selfie: {
          image_url: type === "selfie" ? data.publicUrl : prev.selfie.image_url,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Validate required fields
      if (!documents.id_document.type || !documents.id_document.number) {
        throw new Error("Please fill in all required ID document fields");
      }
      if (!documents.id_document.front_url || !documents.id_document.back_url) {
        throw new Error("Please upload both sides of your ID document");
      }
      if (
        !documents.proof_of_address.type ||
        !documents.proof_of_address.document_url
      ) {
        throw new Error("Please provide proof of address");
      }
      if (!documents.selfie.image_url) {
        throw new Error("Please upload a selfie");
      }

      const verification = await initiateKYCVerification(user.id, documents);
      if (!verification) throw new Error("Failed to initiate KYC verification");

      setKYCStatus(verification);
      router.push("/dashboard/va/profile");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit KYC verification"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <VANavbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-center text-gray-600">Loading KYC status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VANavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                KYC Verification
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Please complete the KYC verification process to make your
                  profile visible to employers.
                </p>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {kycStatus?.status === "verified" ? (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  Your KYC verification has been completed successfully!
                </div>
              ) : kycStatus?.status === "rejected" ? (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  Your KYC verification was rejected. Please try again.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID Document Type
                      </label>
                      <select
                        value={documents.id_document.type}
                        onChange={(e) =>
                          setDocuments((prev: KYCDocuments) => ({
                            ...prev,
                            id_document: {
                              ...prev.id_document,
                              type: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="">Select document type</option>
                        <option value="passport">Passport</option>
                        <option value="drivers_license">
                          Driver&apos;s License
                        </option>
                        <option value="national_id">National ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID Document Number
                      </label>
                      <input
                        type="text"
                        value={documents.id_document.number}
                        onChange={(e) =>
                          setDocuments((prev) => ({
                            ...prev,
                            id_document: {
                              ...prev.id_document,
                              number: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID Document Expiry Date
                      </label>
                      <input
                        type="date"
                        value={documents.id_document.expiry_date}
                        onChange={(e) =>
                          setDocuments((prev) => ({
                            ...prev,
                            id_document: {
                              ...prev.id_document,
                              expiry_date: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID Document (Front)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "id_front");
                        }}
                        className="mt-1 block w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ID Document (Back)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "id_back");
                        }}
                        className="mt-1 block w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Proof of Address Type
                      </label>
                      <select
                        value={documents.proof_of_address.type}
                        onChange={(e) =>
                          setDocuments((prev) => ({
                            ...prev,
                            proof_of_address: {
                              ...prev.proof_of_address,
                              type: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="">Select document type</option>
                        <option value="utility_bill">Utility Bill</option>
                        <option value="bank_statement">Bank Statement</option>
                        <option value="government_letter">
                          Government Letter
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Proof of Address Document
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "address");
                        }}
                        className="mt-1 block w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Selfie with ID
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "selfie");
                        }}
                        className="mt-1 block w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {uploading ? "Submitting..." : "Submit Verification"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerificationPage;
