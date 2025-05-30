"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function ManageUploadsPage() {
  const { user, loading: authLoading } = useAuth();
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this upload?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      const errorMessage = error.message || (error.details ? error.details : 'Unknown error occurred');
      console.error('Error deleting upload:', errorMessage);
      alert(`Failed to delete upload: ${errorMessage}`);
    } else {
      setUploads(prev => prev.filter(item => item.id !== id));
    }
  };

  useEffect(() => {
    const fetchUploads = async () => {
      if (!user) return;
      const ownerId = user.id;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', ownerId);
      if (error) console.error('Error fetching uploads:', error.message);
      else setUploads(data || []);
      setLoading(false);
    };

    if (!authLoading) {
      fetchUploads();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="p-6 text-center">Loading uploads...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Manage Uploads</h1>
        <Link href="/dashboard/upload-products">
          <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
            Upload New
          </button>
        </Link>
      </div>
      {uploads.length === 0 ? (
        <p className="text-gray-500">No uploads found.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {uploads.map((item) => (
            <li key={item.id} className="relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 bg-white p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
                </svg>
              </button>
              {item.image_urls && (
                <img
                  src={item.image_urls}
                  alt="Upload"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-sm text-gray-600">Uploaded: {new Date(item.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}