"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import imageCompression from 'browser-image-compression';
import axios from 'axios';

type Params = {
  id: string;
}

export default function UploadProduct({ params }: { params: Params | Promise<Params> }) {
  // Properly unwrap the params object using React.use()
  const unwrappedParams = React.use(params as any) as Params;
  const businessId = unwrappedParams.id;
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const dropRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  // AI Analysis states
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  


  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 3);
    setFiles(dropped);
    setPreviews(dropped.map(f => URL.createObjectURL(f)));
    

  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
      .filter(f => f.type.startsWith("image/"))
      .slice(0, 3);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
    

  };

  // Remove image
  const removeImage = (idx: number) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    

  };

  // AI Image Analysis function
  const analyzeImage = async () => {
    if (!files.length) return;
    
    setAnalyzing(true);
    try {
      // For now, we'll simulate AI analysis with mock data
      // In a real implementation, you would call an AI service here
      setTimeout(() => {
        setImageAnalysis({
          productType: "Sample Product",
          colors: "Red, Blue, Green",
          materials: "Cotton, Polyester",
          qualityScore: 8.5,
          visibleText: "Sample text"
        });
        setSuggestedTags(["sample", "product", "quality", "modern", "trendy"]);
        setAnalyzing(false);
      }, 2000);
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAnalyzing(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !user || !businessId) {
      alert("Please add at least one image.");
      return;
    }
    setUploading(true);
    setProgress(0);
    const imageUrls: string[] = [];
    try {
      // Fetch business name for activity description
      let businessName = "Unknown business";
      try {
        const { data: businessData } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", businessId)
          .single();
          
        if (businessData && businessData.name) {
          businessName = businessData.name;
        }
      } catch (businessError) {
        console.error("Error fetching business data:", businessError);
        // Continue with generic business name
      }
      
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be under 5MB.");
        }
        let uploadFile = file;
        if (file.size > 1024 * 1024) {
          uploadFile = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        }
        const fileExt = uploadFile.name.split('.').pop();
        const filePath = `products/${businessId || user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(filePath, uploadFile, { upsert: true });
        if (storageError) throw new Error(storageError.message);

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL.');
        imageUrls.push(publicUrlData.publicUrl);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      // Product metadata
      const productMetadata = {};
      
      // Insert product record with metadata
      const { data: productData, error: dbError } = await supabase
        .from('products')
        .insert({
          image_urls: imageUrls[0],
          user_id: businessId || user.id,
          metadata: productMetadata
        })
        .select()
        .single();
        
      if (dbError) throw new Error(dbError.message);
      
      setShowModal(true);
      setFiles([]);
      setPreviews([]);
      setImageAnalysis(null);
      setSuggestedTags([]);
      setShowAnalysis(false);
      await fetchGallery(); // Fetch images instantly after upload
      setTimeout(() => {
        setShowModal(false);
      }, 1500);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Fetch all uploaded images for this user/agent
  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('image_urls')
        .eq('user_id', businessId);
      if (error) throw error;
      // Flatten all image_urls (handle string or array)
      const images: string[] = [];
      (data || []).forEach((row) => {
        if (!row.image_urls) return;
        try {
          const parsed = JSON.parse(row.image_urls);
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          } else if (typeof parsed === 'string') {
            images.push(parsed);
          }
        } catch {
          images.push(row.image_urls);
        }
      });
      setGalleryImages(images);
    } catch (e) {
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchGallery();
  }, [businessId]);

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
      await supabase.from('products').delete().eq('image_urls', imgUrl).eq('user_id', businessId);
      // Refresh gallery
      setGalleryImages(galleryImages.filter((url) => url !== imgUrl));
    } catch (e) {
      alert('Failed to delete image.');
    } finally {
      setGalleryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-rose-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-0 md:p-8">
        <div className="w-full max-w-5xl mx-auto mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 px-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                <span className="p-2 bg-rose-100 rounded-xl">🖼️</span>
                Product Image Manager
              </h1>
              <p className="mt-2 text-gray-600 text-base">Upload, preview, and manage your product images instantly in a beautiful gallery.</p>
            </div>
            <div>
              <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 cursor-pointer font-semibold text-lg transition-all">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Upload Images
                <input id="file-upload" type="file" onChange={handleFileChange} multiple accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          {/* Gallery Section */}
          <section className="bg-white/80 rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-rose-100 rounded-xl">📸</span>
              Uploaded Images
            </h2>
            {galleryLoading ? (
              <div className="text-gray-500 py-16 text-center text-lg">Loading images...</div>
            ) : galleryImages.length === 0 ? (
              <div className="text-gray-400 py-16 text-center text-lg">No images uploaded yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {galleryImages.map((src, i) => (
                  <div key={i} className="relative group rounded-2xl overflow-hidden shadow border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center">
                    <img src={src} alt={`Uploaded ${i + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(src)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-full p-2 shadow transition-colors z-10 opacity-0 group-hover:opacity-100"
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
          </section>

          {/* Upload Preview & Progress */}
          {previews.length > 0 && (
            <section className="bg-white/90 rounded-3xl shadow-lg border border-gray-100 p-8 mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="p-2 bg-rose-100 rounded-xl">🆕</span>
                New Images Preview
              </h3>
              <div className="flex flex-wrap gap-6 mb-6">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-rose-600 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {i === 0 && (
                      <span className="absolute -top-2 -left-2 bg-rose-100 text-rose-600 text-xs font-medium px-2 py-1 rounded-full shadow">Main</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* AI Analysis Section */}
              {files.length > 0 && !imageAnalysis && !analyzing && (
                <button
                  onClick={analyzeImage}
                  type="button"
                  className="mb-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze Image with AI
                </button>
              )}
              
              {analyzing && (
                <div className="mb-6 flex items-center bg-indigo-50 p-4 rounded-xl">
                  <div className="animate-spin w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full mr-3"></div>
                  <p>Analyzing image with AI...</p>
                </div>
              )}
              
              {imageAnalysis && (
                <div className="mb-6 bg-indigo-50 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg text-indigo-900">AI Image Analysis</h4>
                    <button 
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {showAnalysis ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  {showAnalysis && (
                    <div className="space-y-3">
                      {imageAnalysis.productType && (
                        <div>
                          <p className="text-sm font-medium text-indigo-800">Product Type</p>
                          <p className="text-gray-700">{imageAnalysis.productType}</p>
                        </div>
                      )}
                      
                      {imageAnalysis.colors && (
                        <div>
                          <p className="text-sm font-medium text-indigo-800">Colors</p>
                          <p className="text-gray-700">{imageAnalysis.colors}</p>
                        </div>
                      )}
                      
                      {imageAnalysis.materials && (
                        <div>
                          <p className="text-sm font-medium text-indigo-800">Materials</p>
                          <p className="text-gray-700">{imageAnalysis.materials}</p>
                        </div>
                      )}
                      
                      {imageAnalysis.qualityScore && (
                        <div>
                          <p className="text-sm font-medium text-indigo-800">Image Quality Score</p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-indigo-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, imageAnalysis.qualityScore * 10))}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {imageAnalysis.qualityScore}/10
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {suggestedTags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-indigo-800 mb-2">Suggested Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-4">
                <button
                  type="button"
                  onClick={() => { setFiles([]); setPreviews([]); }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg border border-gray-200 bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !files.length}
                  className="px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:ring-2 focus:ring-rose-200 transition-colors font-semibold text-lg disabled:opacity-50 disabled:hover:bg-rose-600"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                {uploading && (
                  <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 text-center">Uploading: {progress}%</p>
                  </div>
                )}
              </form>
            </section>
          )}

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
                  <p className="text-gray-600 mb-6">Image(s) uploaded successfully.</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Gallery updated instantly.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}