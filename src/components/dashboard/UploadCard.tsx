import React from 'react';

interface UploadCardProps {
  upload: {
    id: string;
    image_urls?: string;
    created_at: string;
  };
  onDelete: (id: string) => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ upload, onDelete }) => (
  <li className="relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
    <button
      onClick={() => onDelete(upload.id)}
      className="absolute top-2 right-2 bg-white p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Delete upload"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
      </svg>
    </button>
    {upload.image_urls ? (
      <img
        src={upload.image_urls}
        alt="Upload"
        className="w-full h-48 object-cover"
      />
    ) : (
      <div className="w-full h-48 flex items-center justify-center text-gray-400 bg-gray-50">No Image</div>
    )}
    <div className="p-4">
      <p className="text-sm text-gray-600">Uploaded: {new Date(upload.created_at).toLocaleString()}</p>
    </div>
  </li>
);

export default UploadCard; 