'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import Image from 'next/image';
import { supabase } from '@/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface Market {
  id: string;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface MarketModalProps {
  market?: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function MarketModal({ market, isOpen, onClose, onSave }: MarketModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize form with market data if editing
  useEffect(() => {
    if (market) {
      setName(market.name || '');
      setLocation(market.location || '');
      setDescription(market.description || '');
      setImageUrl(market.image_url);
      setIsActive(market.is_active);
    } else {
      // Reset form for new market
      setName('');
      setLocation('');
      setDescription('');
      setImageUrl(null);
      setIsActive(true);
    }

    setError(null);
    setSuccess(null);
  }, [market, isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `markets/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        setImageUrl(publicUrlData.publicUrl);
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Market name is required');
      return;
    }

    try {
      if (market?.id) {
        // Update existing market
        const { error } = await supabase
          .from('markets')
          .update({
            name,
            location,
            description: description || null,
            image_url: imageUrl,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', market.id);

        if (error) {
          if (error.code === 'PGRST301') {
            throw new Error('Permission denied. Please check your database permissions or contact your administrator.');
          } else if (error.code === '42501') {
            throw new Error('Insufficient permissions to update markets. Please run the fix-markets-permissions.sql script.');
          }
          throw error;
        }
        setSuccess('Market updated successfully');
      } else {
        // Create new market
        const { error } = await supabase
          .from('markets')
          .insert({
            name,
            location,
            description: description || null,
            image_url: imageUrl,
            is_active: isActive,
          });

        if (error) {
          if (error.code === 'PGRST301') {
            throw new Error('Permission denied. Please check your database permissions or contact your administrator.');
          } else if (error.code === '42501') {
            throw new Error('Insufficient permissions to create markets. Please run the fix-markets-permissions.sql script.');
          } else if (error.code === '23505') {
            throw new Error('A market with this name already exists.');
          }
          throw error;
        }
        setSuccess('Market created successfully');
      }

      // Close modal and refresh data after short delay
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving market:', err);
      setError(err.message || 'Failed to save market');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">
            {market ? 'Edit Market' : 'Add New Market'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter market name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter market location"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter market description"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <div className="flex items-center space-x-4">
              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:border-blue-500 transition-colors flex flex-col items-center justify-center"
                style={{ width: '150px', height: '150px' }}
              >
                {imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt="Market preview"
                      className="object-cover rounded-md"
                      fill
                      sizes="150px"
                    />
                  </div>
                ) : (
                  <>
                    <FaUpload className="text-gray-400 mb-2" size={24} />
                    <span className="text-sm text-gray-500">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Market is active
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={uploading}
            >
              {uploading
                ? 'Uploading...'
                : market
                ? 'Update Market'
                : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}