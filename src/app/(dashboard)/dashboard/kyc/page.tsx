"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/auth-context';
import { FaIdCard, FaFileUpload, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';

// Define proper types
interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  document_type: string;
  document_number: string;
  document_image_url: string;
  submitted_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
}

export default function KYCPage() {
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState('national_id');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingVerification, setExistingVerification] = useState<KYCVerification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Check for existing verification
  useEffect(() => {
    const checkExistingVerification = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('kyc_verifications')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) {
          console.error('Error checking existing verification:', error.message || 'Unknown error', error);
          setErrorMessage('Failed to retrieve verification status. Please try refreshing the page.');
          return;
        }
        
        if (data && data.length > 0) {
          setExistingVerification(data[0] as KYCVerification);
        }
      } catch (error: any) {
        // Properly handle the error with more information
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error('Error checking existing verification:', errorMessage, error);
        setErrorMessage('Failed to retrieve verification status. Please try refreshing the page.');
      }
    };
    
    checkExistingVerification();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB. Please choose a smaller file.');
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, WEBP and PDF files are allowed.');
      return;
    }
    
    setDocumentFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !documentFile || !agreementChecked) {
      setErrorMessage('Please select a document and agree to the terms.');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Upload file to storage
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `kyc/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc')
        .upload(filePath, documentFile);
      
      if (uploadError) {
        console.error('Error uploading document to storage:', uploadError.message || 'Storage error', uploadError);
        throw new Error(`Document upload failed: ${uploadError.message || 'Storage error'}`);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('kyc')
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded document');
      }
      
      const documentUrl = publicUrlData.publicUrl;
      
      // Use raw SQL query to avoid role-related issues with the ORM
      const { error: insertError } = await supabase.rpc('insert_kyc_verification', {
        p_user_id: user.id,
        p_document_type: documentType,
        p_document_image_url: documentUrl,
        p_document_number: `${documentType}-${Date.now()}`,
        p_status: 'pending'
      });
      
      if (insertError) {
        console.error('Error inserting KYC record:', insertError.message || 'Database error', insertError);
        throw new Error(`Verification record creation failed: ${insertError.message || 'Database error'}`);
      }
      
      // Update successful status
      setSubmissionStatus('success');
      
      // Refresh the existing verification data
      const { data, error: refreshError } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (refreshError) {
        console.error('Error refreshing verification data:', refreshError);
        // We don't throw here to avoid disrupting the success flow
      }
      
      if (data && data.length > 0) {
        setExistingVerification(data[0] as KYCVerification);
      }
      
    } catch (error: any) {
      console.error('Error in KYC submission process:', error);
      setSubmissionStatus('error');
      setErrorMessage(error?.message || 'There was an error uploading your document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDocumentFile(null);
    setPreviewUrl(null);
    setSubmissionStatus('idle');
    setErrorMessage('');
    setAgreementChecked(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">KYC Verification</h1>
        
        {existingVerification ? (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Verification Status</h2>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  existingVerification.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : existingVerification.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {existingVerification.status.charAt(0).toUpperCase() + existingVerification.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium capitalize">{existingVerification.document_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted Date</p>
                <p className="font-medium">{new Date(existingVerification.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {existingVerification.status === 'rejected' && existingVerification.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-sm text-gray-700">Your verification was rejected for the following reason:</p>
                <p className="font-medium text-red-600">{existingVerification.rejection_reason}</p>
              </div>
            )}
            
            {existingVerification.document_image_url && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Submitted Document</p>
                <div className="bg-gray-100 rounded-lg p-2 relative">
                  {existingVerification.document_image_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <div className="relative w-full h-64">
                      <Image 
                        src={existingVerification.document_image_url} 
                        alt="KYC document" 
                        fill
                        style={{ objectFit: 'contain' }}
                        className="rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={existingVerification.document_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-blue-50 p-4 text-center text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {existingVerification.status === 'rejected' && (
              <div className="mt-4">
                <button
                  onClick={resetForm}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Submit New Document
                </button>
              </div>
            )}
          </div>
        ) : submissionStatus === 'success' ? (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <FaCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium">Verification Submitted</h3>
              <p className="mt-2 text-gray-600">
                Your verification document has been submitted successfully. We will review it and update you with the status.
              </p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">This process typically takes 1-2 business days.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-medium mb-4">Submit Your Documents</h2>
            <p className="text-gray-600 mb-6">
              To verify your identity, please upload one of the following documents. This helps us maintain security and prevent fraud.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="national_id">National ID Card</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                  <option value="passport">Passport</option>
                  <option value="voter_card">Voter&apos;s Card</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex justify-center">
                      <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="document-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="document-upload"
                          name="document-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPEG, WEBP or PDF up to 5MB</p>
                  </div>
                </div>
              </div>
              
              {previewUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Preview</label>
                  <div className="relative h-64 w-full border border-gray-200 rounded-md overflow-hidden">
                    <Image 
                      src={previewUrl} 
                      alt="Document preview" 
                      fill
                      style={{ objectFit: 'contain' }} 
                      className="rounded"
                    />
                  </div>
                </div>
              )}
              
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreement"
                      type="checkbox"
                      checked={agreementChecked}
                      onChange={(e) => setAgreementChecked(e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreement" className="text-gray-700">
                      I confirm that the information provided is accurate, and I consent to the processing of my data for verification purposes.
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!documentFile || loading || !agreementChecked}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  !documentFile || loading || !agreementChecked
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">KYC Verification FAQs</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Why do I need to verify my identity?</h3>
              <p className="text-gray-600 mt-1">
                Identity verification helps us prevent fraud, maintain security, and comply with regulatory requirements.
              </p>
            </div>
            <div>
              <h3 className="font-medium">How long does verification take?</h3>
              <p className="text-gray-600 mt-1">
                The verification process typically takes 1-2 business days. You&apos;ll be notified once your documents have been reviewed.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Is my data secure?</h3>
              <p className="text-gray-600 mt-1">
                Yes, all your personal information and documents are encrypted and securely stored. We follow strict data protection protocols.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
