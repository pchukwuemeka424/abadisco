"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import imageCompression from 'browser-image-compression';
import axios from 'axios';

// Helper: Business profile block message
function BusinessProfileBlock() {
  return (
    <div className="max-w-xl mx-auto mt-16 bg-white rounded-xl shadow p-8 text-center border border-amber-200">
      <h2 className="text-2xl font-bold text-amber-600 mb-2">Create Your Business</h2>
      <p className="text-gray-700 mb-4">Setting up your business profile increases your visibility in the marketplace and builds trust with potential customers.</p>
      <a href="/dashboard/profile" className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition">Set Up Business Profile</a>
    </div>
  );
}

export default function UploadProduct() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams.get('id');



  // State for business profile check
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [checkingBusiness, setCheckingBusiness] = useState(true);

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files)
      .find(f => f.type.startsWith("image/"));
    if (dropped) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    } else {
      setFile(null);
      setPreview(null);
    }
    

  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
      .find(f => f.type.startsWith("image/"));
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } else {
      setFile(null);
      setPreview(null);
    }
    

  };

  // Remove image
  const removeImage = (idx: number) => {
    setFile(null);
    setPreview(null);
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
    if (!file || !user) {
      alert("Please add an image.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const imageUrls: string[] = [];

    try {
      // Fetch business name for activity description (if paramId is provided)
      let businessName = "your business";
      if (paramId) {
        const { data: nameData, error: nameError } = await supabase
          .from("users")
          .select("business_name")
          .eq("id", paramId)
          .maybeSingle();
        if (nameError) throw new Error(nameError.message);
        if (nameData?.business_name) {
          businessName = nameData.business_name;
        }
      }
      
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be under 5MB.");
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
      const filePath = `products/${paramId || user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
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
      setProgress(100);


     // fetch from business table
      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", paramId || user.id)
        .limit(1)
        .single();
      if (bizError) throw new Error(bizError.message);
      if (!bizData) throw new Error("Business not found.");
      const businessId = bizData.id;

      // Include AI-generated data if available
      const productMetadata = imageAnalysis ? {
        product_type: imageAnalysis.productType || null,
        colors: imageAnalysis.colors || null,
        materials: imageAnalysis.materials || null,
        quality_score: imageAnalysis.qualityScore || null,
        visible_text: imageAnalysis.visibleText || null,
        ai_analyzed: true
      } : {};

      // Insert into database with tags and AI metadata
      const { data: productData, error: dbError } = await supabase
        .from('products')
        .insert({
          image_urls: imageUrls[0], // Main image
          user_id: businessId,
          owner_id: paramId || user.id,
          tags: tags.length > 0 ? tags : (suggestedTags.length > 0 ? suggestedTags.slice(0, 5) : null),
          metadata: productMetadata
        })
        .select()
        .maybeSingle();
      if (dbError) throw new Error(dbError.message);
      if (!productData) throw new Error('Failed to insert product.');
      
    

      setShowModal(true);
      setFile(null);
      setPreview(null);
      setTags([]);
      setImageAnalysis(null);
      setSuggestedTags([]);
      
      setTimeout(() => {
        setShowModal(false);
        router.push('/dashboard/manage-uploads');
      }, 2000);

    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Check if user has a business profile
  useEffect(() => {
    const checkBusiness = async () => {
      if (!user) return setHasBusiness(false);
      setCheckingBusiness(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      setHasBusiness(!!data);
      setCheckingBusiness(false);
    };
    checkBusiness();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {checkingBusiness ? (
            <div className="text-center py-20 text-lg text-gray-500">Checking business profile...</div>
          ) : !hasBusiness ? (
            <BusinessProfileBlock />
          ) : (
            <>
              {/* Breadcrumb with modern styling */}
              <nav className="mb-8 flex items-center gap-3 text-sm font-medium">
                <a href="/dashboard" className="text-gray-500 hover:text-rose-500 transition-colors flex items-center gap-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </span>
                  Dashboard
                </a>
                <span className="text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 border border-rose-100">
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span>
                  Upload Product
                </span>
              </nav>

              {/* Header with glass effect */}
              <div className="mb-10">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Product Images</h1>
                    <p className="text-gray-600 max-w-2xl">Showcase your products with high-quality images. Add relevant tags to make your products more discoverable to potential buyers.</p>
                    <p className="text-sm text-gray-500 mt-2 inline-block px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
                      User ID: <span className="font-mono font-medium">{paramId || user?.id}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Modal with modern styling */}
              {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                  <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative z-10 animate-scale-up border border-gray-100">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload Complete!</h3>
                      <p className="text-gray-600 mb-8">{file ? '1 image uploaded successfully.' : 'No image uploaded.'}</p>
                      
                      {preview && (
                        <div className="flex flex-wrap gap-3 justify-center mb-6">
                          <div className="relative group overflow-hidden rounded-xl shadow-sm border border-gray-200">
                            <img 
                              src={preview} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover transition-transform group-hover:scale-110 duration-300" 
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="relative">
                        <div className="animate-pulse flex justify-center">
                          <div className="h-1.5 w-24 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 rounded-full"></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">Redirecting to manage products...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-10">
                  <form className="space-y-10" onSubmit={handleSubmit}>
                    {/* Image Upload Section with modern styling */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="block font-medium text-gray-900 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                          Product Images
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-sm text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">Only 1 image allowed</span>
                      </div>
                      
                      <div
                        ref={dropRef}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className={`flex gap-4 flex-wrap p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                          !preview 
                            ? 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-rose-200' 
                            : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        {!preview ? (
                          <div className="w-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 mb-5 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                              <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-900 font-medium text-lg mb-2">Drag and drop your image here</p>
                            <p className="text-gray-500 mb-6">PNG, JPG and WEBP files are supported</p>
                            <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                            <button 
                              type="button" 
                              onClick={() => dropRef.current?.querySelector('input')?.click()} 
                              className="px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-100 hover:shadow-rose-200 transition-all"
                            >
                              Browse Files
                            </button>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="w-36 h-36 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                              <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(0)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 hover:bg-rose-50"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <span className="absolute -top-2 -left-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
                              Main
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Supported formats: JPG, PNG, WEBP. Max 5MB per image.
                      </p>
                    </div>


                    {/* Tags Section with modern styling */}
                    <div>
                      <label className="block font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        Tags
                      </label>
                      <div className="p-4 rounded-xl border border-gray-200 bg-white focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-100 transition-shadow">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border border-rose-100 shadow-sm">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(i)}
                                className="w-5 h-5 rounded-full hover:bg-rose-100 flex items-center justify-center transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {tags.length === 0 && (
                            <span className="text-sm text-gray-400 italic">No tags added yet</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={handleTagKeyDown}
                              className="w-full border-none p-2 text-sm focus:ring-0 bg-gray-50 rounded-lg"
                              placeholder={tags.length < 5 ? "Add tags (press Enter)" : "Maximum tags reached"}
                              disabled={uploading || tags.length >= 5}
                            />
                            {tagInput && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
                                    setTags([...tags, tagInput.trim()]);
                                    setTagInput("");
                                  }
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors"
                                disabled={tags.length >= 5}
                              >
                                +
                              </button>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">{tags.length}/5</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Add up to 5 tags to help buyers find your product
                      </p>
                    </div>

                    {/* Submit Button with modern styling */}
                    <div className="pt-8 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 group"
                        >
                          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={uploading || !file}
                          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 focus:ring-4 focus:ring-rose-200 transition-all disabled:opacity-50 disabled:hover:from-rose-500 disabled:hover:to-pink-500 shadow-lg shadow-rose-200 hover:shadow-rose-300 flex items-center gap-2 group"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              Upload
                              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                      {uploading && (
                        <div className="mt-6">
                          <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-rose-600 bg-rose-200">
                                  Uploading
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-rose-600">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-rose-200">
                              <div 
                                style={{ width: `${progress}%` }} 
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300 ease-in-out"
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}