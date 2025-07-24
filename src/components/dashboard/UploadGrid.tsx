import React from 'react';
import UploadCard from './UploadCard';

interface UploadGridProps {
  uploads: Array<{
    id: string;
    image_urls?: string;
    created_at: string;
  }>;
  onDelete: (id: string) => void;
}

const UploadGrid: React.FC<UploadGridProps> = ({ uploads, onDelete }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {uploads.map(upload => (
      <UploadCard key={upload.id} upload={upload} onDelete={onDelete} />
    ))}
  </ul>
);

export default UploadGrid; 