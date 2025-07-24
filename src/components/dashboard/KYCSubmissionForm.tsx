import React, { useRef } from 'react';
import Image from 'next/image';
import { FaFileUpload, FaSpinner } from 'react-icons/fa';

interface KYCSubmissionFormProps {
  documentType: string;
  setDocumentType: (type: string) => void;
  documentFile: File | null;
  setDocumentFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  loading: boolean;
  errorMessage: string;
  agreementChecked: boolean;
  setAgreementChecked: (checked: boolean) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const KYCSubmissionForm: React.FC<KYCSubmissionFormProps> = ({
  documentType,
  setDocumentType,
  documentFile,
  setDocumentFile,
  previewUrl,
  setPreviewUrl,
  loading,
  errorMessage,
  agreementChecked,
  setAgreementChecked,
  onFileChange,
  onSubmit,
  fileInputRef,
}) => (
  <div className="bg-white rounded-lg shadow mb-6 p-6">
    <h2 className="text-lg font-medium mb-4">Submit Your Documents</h2>
    <p className="text-gray-600 mb-6">
      To verify your identity, please upload one of the following documents. This helps us maintain security and prevent fraud.
    </p>
    <form onSubmit={onSubmit}>
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
                  onChange={onFileChange}
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
);

export default KYCSubmissionForm; 