"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/auth-context';
import { FaIdCard, FaFileUpload, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import KYCStatusCard from '@/components/dashboard/KYCStatusCard';
import KYCSubmissionForm from '@/components/dashboard/KYCSubmissionForm';
import KYCFAQs from '@/components/dashboard/KYCFAQs';
import ErrorAlert from '@/components/dashboard/ErrorAlert';

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
          <KYCStatusCard
            verification={existingVerification}
            onResubmit={resetForm}
          />
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
          <KYCSubmissionForm
            documentType={documentType}
            setDocumentType={setDocumentType}
            documentFile={documentFile}
            setDocumentFile={setDocumentFile}
            previewUrl={previewUrl}
            setPreviewUrl={setPreviewUrl}
            loading={loading}
            onSubmit={handleSubmit}
            onFileChange={handleFileChange}
            agreementChecked={agreementChecked}
            setAgreementChecked={setAgreementChecked}
            errorMessage={errorMessage}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          />
        )}
        
        <KYCFAQs />
        {errorMessage && <ErrorAlert message={errorMessage} />}
      </main>
    </div>
  );
}
