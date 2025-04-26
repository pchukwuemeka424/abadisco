"use client";
import { useState, useRef } from "react";
import { z } from "zod";
import { supabase } from "@/supabaseClient";
import { FaIdCard, FaUpload, FaSpinner } from "react-icons/fa";
import { useAuth } from "@/context/auth-context";

const kycSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  idType: z.string().min(1, "Please select an ID type"),
  idNumber: z.string().min(1, "ID number is required"),
});

const ID_TYPES = [
  { value: "national-id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers-license", label: "Driver's License" },
  { value: "voters-card", label: "Voter's Card" },
];

export default function KYCPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
        setError("Please upload a valid image (JPG, PNG, WEBP) or PDF file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB");
        return;
      }

      setIdFile(file);
      setError("");

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerificationStatus("processing");

    try {
      // Validate form
      const result = kycSchema.safeParse({ fullName, idType, idNumber });
      if (!result.success) {
        setError(result.error.errors[0].message);
        setVerificationStatus("error");
        return;
      }

      if (!idFile) {
        setError("Please upload an ID document");
        setVerificationStatus("error");
        return;
      }

      if (!user) {
        setError("User not authenticated");
        setVerificationStatus("error");
        return;
      }

      // Upload ID document to storage
      const fileExt = idFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, idFile);

      if (uploadError) {
        throw new Error("Failed to upload document");
      }

      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(fileName);

      // Update KYC verification record
      const { error: updateError } = await supabase
        .from("kyc_verifications")
        .update({
          full_name: fullName,
          id_type: idType,
          id_number: idNumber,
          document_url: publicUrl,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error("Failed to update verification status");

      setVerificationStatus("success");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit KYC verification");
      setVerificationStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="flex-1 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500 flex items-center gap-2">
            <a href="/dashboard" className="hover:text-rose-600 transition-colors">Dashboard</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">KYC Verification</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-rose-100 rounded-xl">
                <FaIdCard className="text-rose-600" />
              </span>
              KYC Verification
            </h1>
            <p className="mt-2 text-gray-600">
              Complete your identity verification to access all features of your account.
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Requirements:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• A valid government-issued photo ID</li>
              <li>• Clear, readable images of your ID document</li>
              <li>• File size less than 5MB (JPG, PNG, WEBP, or PDF)</li>
              <li>• Information matching your account details</li>
            </ul>
          </div>

          {submitted ? (
            <div className={`rounded-lg p-6 ${
              verificationStatus === "success" 
                ? "bg-green-50 border border-green-100" 
                : "bg-red-50 border border-red-100"
            }`}>
              <div className="text-center">
                {verificationStatus === "success" ? (
                  <>
                    <h3 className="text-green-800 font-semibold mb-2">Verification Submitted Successfully!</h3>
                    <p className="text-green-700 text-sm">
                      Your verification is being processed. We'll notify you once it's complete.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-red-800 font-semibold mb-2">Verification Failed</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    placeholder="Enter your full name as it appears on your ID"
                    required
                  />
                </div>

                {/* ID Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    required
                  >
                    <option value="">Select ID Type</option>
                    {ID_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    placeholder="Enter your ID number"
                    required
                  />
                </div>

                {/* ID Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload ID Document
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {previewUrl ? (
                        <div className="mb-4">
                          <img
                            src={previewUrl}
                            alt="ID Preview"
                            className="mx-auto h-32 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-rose-600 hover:text-rose-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-rose-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,.pdf"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP or PDF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={verificationStatus === "processing"}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verificationStatus === "processing" ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
