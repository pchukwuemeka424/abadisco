"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

export default function UploadProduct() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const dropRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 5);
    setFiles(dropped);
    setPreviews(dropped.map(f => URL.createObjectURL(f)));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  // Remove image
  const removeImage = (idx: number) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  // Tag input handlers
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !user) {
      alert("Please add at least one image.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const imageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be under 5MB.");
        }

        // Compress if needed
        let uploadFile = file;
        if (file.size > 1024 * 1024) {
          uploadFile = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        }

        // Upload to storage
        const fileExt = uploadFile.name.split('.').pop();
        const filePath = `products/${id || user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(filePath, uploadFile, { upsert: true });

        if (storageError) throw new Error(storageError.message);

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL.');

        imageUrls.push(publicUrlData.publicUrl);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Insert into database
      const { error: dbError } = await supabase.from('products').insert({
        image_urls: imageUrls[0], // Main image
        // Use id parameter from URL, fallback to user.id if not available
        user_id: id || user.id,
      });

      if (dbError) throw new Error(dbError.message);

      setShowModal(true);
      setFiles([]);
      setPreviews([]);
      setTags([]);
      
      setTimeout(() => {
        setShowModal(false);
        router.push('/agent/upload-images/'+id);
      }, 2000);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Fetch all uploaded images for this user/agent
  useEffect(() => {
    async function fetchGallery() {
      setGalleryLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('image_urls')
          .eq('user_id', id);
        if (error) throw error;
        // Flatten all image_urls (handle string or array)
        const images: string[] = [];
        (data || []).forEach((row) => {
          if (!row.image_urls) return;
          try {
            // Try to parse as JSON array
            const parsed = JSON.parse(row.image_urls);
            if (Array.isArray(parsed)) {
              images.push(...parsed);
            } else if (typeof parsed === 'string') {
              images.push(parsed);
            }
          } catch {
            // Not JSON, treat as single string
            images.push(row.image_urls);
          }
        });
        setGalleryImages(images);
      } catch (e) {
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    }
    if (id) fetchGallery();
  }, [id]);

  // Delete image from storage and DB
  const handleDeleteImage = async (imgUrl: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    setGalleryLoading(true);
    try {
      // Extract storage path from public URL
      const uploadsUrl = supabase.storage.from('uploads').getPublicUrl('x').data.publicUrl.replace('/x', '');
      const filePath = imgUrl.replace(uploadsUrl, '').replace(/^\//, '');
      // Remove from storage
      const { error: storageError } = await supabase.storage.from('uploads').remove([filePath]);
      if (storageError) throw storageError;
      // Remove from DB: delete product row with this image (if you want to delete only the image, you may need to update the row instead)
      await supabase.from('products').delete().eq('image_urls', imgUrl).eq('user_id', id);
      // Refresh gallery
      setGalleryImages(galleryImages.filter((url) => url !== imgUrl));
    } catch (e) {
      alert('Failed to delete image.');
    } finally {
      setGalleryLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
            <a href="/dashboard" className="hover:text-rose-600 transition-colors">Dashboard</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Upload Product</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-rose-100 rounded-xl">⬆️</span>
              Upload Product Images
            </h1>
            <p className="mt-2 text-gray-600">Upload product images and add relevant tags to help buyers find your products.</p>
          </div>

          {/* Success Modal */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 relative z-10 animate-scale-up">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
                  <p className="text-gray-600 mb-6">{files.length} image{files.length !== 1 ? 's' : ''} uploaded successfully.</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {previews.map((src, i) => (
                      <Image 
                        key={i} 
                        src={src} 
                        alt="Preview" 
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-lg border" 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Redirecting to manage products...</p>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Section */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-rose-100 rounded-xl">🖼️</span>
              Uploaded Images Gallery
            </h2>
            {galleryLoading ? (
              <div className="text-gray-500 py-8 text-center">Loading images...</div>
            ) : galleryImages.length === 0 ? (
              <div className="text-gray-400 py-8 text-center">No images uploaded yet.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group relative">
                    <Image 
                      src={src} 
                      alt={`Uploaded ${i + 1}`} 
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" 
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(src)}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-rose-600 hover:text-white text-rose-600 rounded-full p-1 shadow transition-colors z-10"
                      title="Delete image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-900">Product Images <span className="text-rose-500">*</span></label>
                    <span className="text-xs text-gray-500">Up to 5 images</span>
                  </div>
                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="flex gap-4 flex-wrap p-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {previews.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 mb-4 rounded-xl bg-rose-50 flex items-center justify-center">
                          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">Drag and drop your images here</p>
                        <p className="text-gray-500 text-sm mb-4">or click to browse</p>
                        <input type="file" onChange={handleFileChange} className="hidden" multiple accept="image/*" />
                        <button type="button" onClick={() => dropRef.current?.querySelector('input')?.click()} className="text-sm text-rose-600 font-medium hover:text-rose-700">
                          Browse Files
                        </button>
                      </div>
                    ) : (
                      <>
                        {previews.map((src, i) => (
                          <div key={i} className="relative group">
                            <div className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
                              <Image 
                                src={src} 
                                alt={`Preview ${i + 1}`}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            {i === 0 && (
                              <span className="absolute -top-2 -left-2 bg-rose-100 text-rose-600 text-xs font-medium px-2 py-1 rounded-full">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => dropRef.current?.querySelector('input')?.click()}
                          className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-xs font-medium">Add More</span>
                          <input type="file" onChange={handleFileChange} className="hidden" multiple accept="image/*" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Supported formats: JPG, PNG, WEBP. Max 5MB per image.</p>
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tags
                  </label>
                  <div className="p-3 rounded-lg border border-gray-200 bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200 transition-colors">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-rose-50 text-rose-600">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(i)}
                            className="w-4 h-4 rounded-full hover:bg-rose-100 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full border-none p-0 text-sm focus:ring-0"
                      placeholder={tags.length < 5 ? "Add tags (press Enter)" : "Maximum tags reached"}
                      disabled={uploading || tags.length >= 5}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Add up to 5 tags to help buyers find your product</p>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !files.length}
                      className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:ring-2 focus:ring-rose-200 transition-colors disabled:opacity-50 disabled:hover:bg-rose-600"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {uploading && (
                    <div className="mt-4">
                      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-600 transition-all duration-300 ease-in-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-center mt-2">Uploading: {progress}%</p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}