import React from 'react';

const KYCFAQs: React.FC = () => (
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
);

export default KYCFAQs; 