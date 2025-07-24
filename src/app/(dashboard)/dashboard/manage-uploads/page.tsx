"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import UploadGrid from '@/components/dashboard/UploadGrid';

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
        <UploadGrid uploads={uploads} onDelete={handleDelete} />
      )}
    </div>
  );
}