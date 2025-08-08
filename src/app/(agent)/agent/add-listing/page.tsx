"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/auth-context";
import axios from "axios";
import { useRouter } from "next/navigation";

// Dynamic import for Cropper component to avoid SSR issues
const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg"></div>
});

// Replacing hardcoded services with data fetched from the database
export default function ProfilePage() {
  const { user, loading } = useAuth(); // Use auth context
  const router = useRouter();
  
  // State for services data fetched from the database
  const [serviceCategories, setServiceCategories] = useState<{id: number, name: string, description: string}[]>([]);
  const [subServiceCategories, setSubServiceCategories] = useState<{id: number, parent_id: number, name: string, description: string}[]>([]);
  const [specificServices, setSpecificServices] = useState<{id: number, name: string, category_id: number}[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, {id: number, name: string, services: string[]}>>({});

  // Updated state variables to match businesses_table schema
  const [businessData, setBusinessData] = useState({
    name: "",
    description: "",
    market_id: "",
    category_id: null as number | null,
    owner_id: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    logo_url: "",
    website: "",
    facebook: "",
    instagram: "",
    created_by: "",
    status: "active",
    business_type: "", // Added field from schema
    whatsapp: "", // Added field from schema
    role: null as string | null, // Added field from schema
  });
  
  // Additional form fields that aren't directly in businesses_table
  const [agentId, setAgentId] = useState("");
  const [marketName, setMarketName] = useState(""); // For display purposes
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState(""); // For category lookup
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  
  // Add missing state setters to fix the setWebsite reference error
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  
  // UI related state
  const [marketLocations, setMarketLocations] = useState<{id: string, name: string}[]>([]); 
  const [businessCategories, setBusinessCategories] = useState<{id: number, title: string}[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [customService, setCustomService] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const [croppingImage, setCroppingImage] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  
  // Helper function to update business data fields
  const updateBusinessData = (field: string, value: any) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add state to track authentication status 
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      // Pre-fill email from user auth if available
      if (user?.email && !businessData.contact_email) {
        updateBusinessData('contact_email', user.email);
      }
    }
  }, [user, loading, businessData.contact_email]); // These dependencies are consistent

  // Add useEffect to fetch market locations from the database
  useEffect(() => {
    const fetchMarketLocations = async () => {
      try {
        const { data: markets, error } = await supabase
          .from('markets')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          console.error('Error fetching markets:', error.message);
          return;
        }
        
        if (markets) {
          setMarketLocations(markets);
        }
      } catch (err) {
        console.error('Unexpected error fetching markets:', err);
      }
    };
    
    fetchMarketLocations();
  }, []);

  // Add useEffect to fetch business categories
  useEffect(() => {
    const fetchBusinessCategories = async () => {
      try {
        const { data: categories, error } = await supabase
          .from('business_categories')
          .select('id, title')
          .order('title');
          
        if (error) {
          console.error('Error fetching business categories:', error.message);
          return;
        }
        
        if (categories) {
          setBusinessCategories(categories);
        }
      } catch (err) {
        console.error('Unexpected error fetching business categories:', err);
      }
    };
    
    fetchBusinessCategories();
  }, []);

  // Fetch service categories and sub-service categories from the database
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        // Fetch main service categories
        const { data: categories, error: categoriesError } = await supabase
          .from('service_categories')
          .select('id, name, description')
          .order('name');
          
        if (categoriesError) {
          console.error('Error fetching service categories:', categoriesError.message);
        } else if (categories) {
          setServiceCategories(categories);
          
          // Fetch sub-service categories
          const { data: subCategories, error: subCategoriesError } = await supabase
            .from('sub_service_categories')
            .select('id, parent_id, name, description')
            .order('name');
            
          if (subCategoriesError) {
            console.error('Error fetching sub-service categories:', subCategoriesError.message);
          } else if (subCategories) {
            setSubServiceCategories(subCategories);
            
            // Create a map of service category ID to their sub-categories
            const tempCategoryMap: Record<number, {id: number, name: string, services: string[]}> = {};
            
            // Initialize with all categories
            categories.forEach(category => {
              tempCategoryMap[category.id] = {
                id: category.id,
                name: category.name,
                services: []
              };
            });
            
            // Group sub-categories by parent category
            subCategories.forEach(subCategory => {
              const parentId = subCategory.parent_id;
              
              if (tempCategoryMap[parentId]) {
                // Add sub-category as a service
                tempCategoryMap[parentId].services.push(subCategory.name);
              }
            });
            
            setCategoryMap(tempCategoryMap);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching services data:', err);
      }
    };
    
    fetchServicesData();
  }, []);

  // Logo handling functions
  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleLogoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCroppingImage(reader.result);
        setShowCrop(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setLogo(null);
  };

  const handleCropConfirm = async () => {
    if (!croppingImage || !croppedAreaPixels || !user) return;
    
    try {
      const croppedBlob = await getCroppedImgBlob(croppingImage, croppedAreaPixels);
      
      // Upload to Supabase Storage
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        setError('Failed to upload logo');
        setShowCrop(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl;
      if (publicUrl) {
        setLogoPreview(publicUrl);
        // Update business data with logo URL
        updateBusinessData('logo_url', publicUrl);
        setSuccess('Logo uploaded successfully!');
      }
    } catch (err) {
      setError('Failed to process image');
    }
    
    setShowCrop(false);
  };

  const handleServiceChange = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleRemoveService = (service: string) => {
    setSelectedServices(selectedServices.filter(s => s !== service));
  };

  const handleAddCustomService = () => {
    const trimmed = customService.trim();
    if (trimmed && !selectedServices.includes(trimmed)) {
      setSelectedServices([...selectedServices, trimmed]);
      setCustomService("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Show auth status for debugging
    console.log("Auth state:", { user, loading, authChecked });
    
    if (loading) {
      setError("Authentication is still loading. Please try again in a moment.");
      return;
    }

    if (!user) {
      setError("You must be logged in to add a listing");
      return;
    }

    if (!businessData.name) {
      setError("Business name is required");
      return;
    }

    if (!businessType) {
      setError("Business type is required");
      return;
    }

    try {
      // Get the agent ID if we don't have it already
      let currentAgentId = agentId;
      
      if (!currentAgentId) {
        console.log("Fetching agent ID for user:", user.id);
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('id, user_id')
          .eq('user_id', user.id)
          .single();
          
        if (agentError) {
          console.error("Error fetching agent data:", agentError);
          setError("Could not find your agent profile. Please make sure you're registered as an agent.");
          return;
        }
        
        if (!agentData) {
          setError("Your agent profile was not found. Please contact support.");
          return;
        }
        
        console.log("Retrieved agent data:", agentData);
        // Store the agent's ID for reference
        currentAgentId = agentData.id;
        setAgentId(currentAgentId);
      }

      // Find the market ID based on the selected market name
      let marketId: string | null = null;
      if (marketName) {
        const selectedMarketObj = marketLocations.find(m => m.name === marketName);
        if (selectedMarketObj) {
          marketId = selectedMarketObj.id;
        } else {
          console.warn("Selected market not found in marketLocations array:", marketName);
        }
      }

      // Find category ID based on business type
      let categoryId: number | null = null;
      if (businessType) {
        try {
          // First try to use the selected category from the dropdown if one was chosen
          if (businessData.category_id !== null) {
            categoryId = businessData.category_id;
            console.log("Using selected category ID:", categoryId);
          } else {
            // Otherwise look up the category by business type
            const { data: categoryData, error: categoryError } = await supabase
              .from('business_categories')
              .select('id, title')
              .ilike('title', businessType)
              .single();
              
            if (categoryError) {
              console.error("Error fetching category:", categoryError.message);
              // Continue with null category ID instead of stopping execution
            } else if (categoryData) {
              categoryId = categoryData.id;
              console.log("Found category ID:", categoryId, "for business type:", businessType);
            } else {
              console.warn("Category not found for business type:", businessType);
            }
          }
        } catch (err) {
          console.error("Exception when finding category:", err);
        }
      }

      // Format selected services as a JSON structure
      // We organize services by category and add metadata
      const servicesJson = {
        category: businessType,
        service_list: selectedServices,
        last_updated: new Date().toISOString(),
        count: selectedServices.length
      };

      console.log("Services JSON to be stored:", servicesJson);
      
      // Set the owner_id and created_by fields to the current user's ID
      const businessInsertData = {
        name: businessData.name,
        description: businessData.description || null,
        market_id: marketId,
        category_id: categoryId,
        owner_id: user.id, // Set the agent as the owner directly
        contact_phone: businessData.contact_phone || null,
        contact_email: businessData.contact_email || null,
        address: businessData.address || null,
        logo_url: logoPreview || null,
        website: businessData.website || null,
        facebook: businessData.facebook || null,
        instagram: businessData.instagram || null,
        created_by: user.id, // The agent creates the business
        status: 'active',
        services: servicesJson // Add services as JSONB data
        // These fields are automatically filled by default values in the database:
        // created_at: new Date().toISOString(),
        // updated_at: new Date().toISOString()
      };
      
      console.log("Inserting into businesses table:", businessInsertData);
      
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert(businessInsertData)
        .select()
        .single();
        
      if (businessError) {
        console.error("Error creating business:", businessError);
        throw new Error(`Failed to create business: ${businessError.message}`);
      }
      
      console.log("Business created successfully:", newBusiness);

      // 4. Update the agent's registration statistics
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('total_registrations, current_week_registrations')
        .eq('id', currentAgentId)
        .single();

      if (agentError) {
        console.error('Error fetching agent data:', agentError);
        // Continue execution even if this fails
      } else {
        // Then, increment the values
        const newTotal = (agentData.total_registrations || 0) + 1;
        const newWeekly = (agentData.current_week_registrations || 0) + 1;

        // Now, update the database with the new incremented values
        const { data: agentUpdateData, error: agentUpdateError } = await supabase
          .from('agents')
          .update({
            total_registrations: newTotal,
            current_week_registrations: newWeekly
          })
          .eq('id', currentAgentId)
          .select()
          .single();

        if (agentUpdateError) {
          console.error('Error updating agent data:', agentUpdateError);
        } else {
          console.log('Agent data updated:', agentUpdateData);
        }
      }

      setSuccess("Business listing added successfully!");
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push('/agent');
      }, 2000);
      
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "An unexpected error occurred");
    }
  };

  const onCropComplete = useCallback((
    _: any, 
    croppedAreaPixels: { width: number; height: number; x: number; y: number }
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper to get cropped image as Blob
  async function getCroppedImgBlob(imageSrc: string, crop: { width: number; height: number; x: number; y: number }): Promise<Blob> {
    const image = document.createElement('img');
    image.src = imageSrc;
    await new Promise(resolve => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
      }, 'image/jpeg');
    });
  }



  const handleAutoFillDescription = () => {
    const name = businessData.name.trim();
    const type = businessType.trim();
    const services = selectedServices.length > 0 ? selectedServices.join(", ") : "various services";
    if (name && type) {
      updateBusinessData('description', `${name} is a ${type.toLowerCase()} offering ${services}.`);
    } else if (name) {
      updateBusinessData('description', `${name} offers ${services}.`);
    } else {
      updateBusinessData('description', `We offer ${services}.`);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      // This is a new listing page, no need to fetch existing business data      
      // Pre-fill basic data from user if available
      if (user?.email && !businessData.contact_email) {
        updateBusinessData('contact_email', user.email);
      }
    };
    
    loadProfile();
  }, [user, loading, authChecked, businessData.contact_email]);

  // Add a useEffect to fetch the agent data when the component mounts
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user) {
        console.log("No user available, skipping agent data fetch");
        return;
      }
      
      console.log("Fetching agent data for user ID:", user.id);
      
      try {
        // First, check if the agents table exists and if the user has an agent record
        const { count, error: checkError } = await supabase
          .from('agents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (checkError) {
          console.error("Error checking agents table:", checkError.message);
          setError(`Failed to access agents table: ${checkError.message}. Please ensure you have proper permissions.`);
          return;
        }
        
        if (count === 0) {
          console.warn(`No agent record found for user ID: ${user.id}`);
          
          // Try to create a new agent record if one doesn't exist
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              const { data: newAgent, error: createError } = await supabase
                .from('agents')
                .insert({
                  id: crypto.randomUUID(),
                  user_id: user.id,
                  email: userData.user.email,
                  full_name: userData.user.user_metadata?.full_name || 'Unknown',
                  phone: '',
                  status: 'active'
                })
                .select('id')
                .single();
                
              if (createError) {
                console.error("Error creating agent record:", createError);
                setError(`Failed to create agent profile: ${createError.message}`);
                return;
              }
              
              if (newAgent) {
                console.log("Created new agent profile:", newAgent);
                setAgentId(newAgent.id);
                return;
              }
            }
          } catch (createErr) {
            console.error("Error in agent creation:", createErr);
          }
          
          setError("No agent profile found for your account. Please register as an agent first.");
          return;
        }
        
        // Get the agent ID from the agents table
        const { data: agentData, error } = await supabase
          .from('agents')
          .select('id, full_name, email')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching agent data:", error.message);
          setError(`Failed to fetch agent data: ${error.message}`);
          return;
        }
        
        if (!agentData) {
          console.error("No agent data returned despite count check");
          setError("Your agent profile was not found. Please contact support.");
          return;
        }
        
        console.log("Successfully retrieved agent data:", agentData);
        setAgentId(agentData.id);
      } catch (err: any) {
        console.error("Unexpected error in fetchAgentData:", err);
        setError(`An unexpected error occurred: ${err?.message || "Unknown error"}`);
      }
    };
    
    if (user && !loading) {
      fetchAgentData();
    }
  }, [user, loading, authChecked]);

  const getServiceOptions = useCallback(() => {
    if (!businessType) return [];
    
    // Find the service category ID based on the selected business type
    const serviceCategoryId = serviceCategories.find(category => category.name === businessType)?.id;
    
    if (!serviceCategoryId) return [];
    
    // Return the sub-services for this category from the category map
    return categoryMap[serviceCategoryId]?.services || [];
  }, [businessType, serviceCategories, categoryMap]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Updated!</h3>
              <p className="text-gray-600 mb-6">Your profile has been successfully updated. Redirecting to dashboard...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-green-500 h-2 rounded-full w-full animate-pulse"></div>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-4 sm:p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-6 text-rose-600 flex items-center gap-2"><span>🏬</span> Add New Business Listing</h1>
          
          {/* Authentication status indicator */}
          <div className={`mb-4 p-2 rounded-lg ${loading ? 'bg-yellow-50 border border-yellow-300' : user ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : user ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">
                {loading ? 'Authentication in progress...' : 
                 user ? `Authenticated as ${user.email}` : 
                 'Not authenticated - please log in'}
              </p>
            </div>
          </div>
          
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Logo upload section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Logo</h2>
              <div
                ref={dropRef}
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                className="flex gap-3 mt-2 flex-wrap min-h-[104px] p-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
              >
                {!logoPreview && (
                  <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer bg-white hover:bg-gray-100 transition relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-rose-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="3" strokeWidth="2" stroke="currentColor" fill="none" />
                      <path d="M8 12h8M12 8v8" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                    <input type="file" onChange={handleLogoInputChange} className="hidden" accept="image/*" />
                  </label>
                )}
                {logoPreview && (
                  <div className="relative group w-24 h-24">
                    <Image 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded border shadow-sm" 
                    />
                    <button type="button" onClick={handleRemoveLogo} className="absolute top-1 right-1 bg-white/80 hover:bg-rose-500 hover:text-white text-rose-600 rounded-full p-1 shadow transition-opacity opacity-80 group-hover:opacity-100" title="Remove">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">JPG, PNG, WEBP. Max 5MB.</div>
              {showCrop && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center relative w-[350px]">
                    <h3 className="text-lg font-semibold mb-4">Crop Logo (Square)</h3>
                    <div className="relative w-64 h-64 bg-gray-200 rounded-lg overflow-hidden border-2 border-blue-400">
                      <Cropper
                        image={croppingImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        rotation={0}
                        minZoom={1}
                        maxZoom={3}
                        zoomSpeed={1}
                        showGrid={false}
                        cropShape="rect"
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        objectFit="contain"
                        cropSize={{ width: 256, height: 256 }}
                        style={{ containerStyle: { width: '100%', height: '100%' } }}
                        classes={{ containerClassName: 'cropper' }}
                        restrictPosition={true}
                        mediaProps={{ crossOrigin: 'anonymous' }}
                        cropperProps={{}}
                        keyboardStep={1}
                      />
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow" onClick={handleCropConfirm}>Crop & Save</button>
                      <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow" onClick={() => setShowCrop(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Business Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.name} 
                    onChange={e => updateBusinessData('name', e.target.value)} 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Services Offering</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                    required
                  >
                    <option value="">Select Services</option>
                    {serviceCategories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.category_id !== null ? businessData.category_id.toString() : ""}
                    onChange={(e) => {
                      const categoryId = e.target.value ? parseInt(e.target.value) : null;
                      updateBusinessData('category_id', categoryId);
                      
                      // If Markets is selected, find the corresponding category title
                      if (categoryId) {
                        const selectedCategory = businessCategories.find(cat => cat.id === categoryId);
                        if (selectedCategory && selectedCategory.title === "Markets") {
                          // Auto-select "Market" as the businessType if Markets category is selected
                          setBusinessType("Market");
                        }
                      }
                    }}
                  >
                    <option value="">Select a category</option>
                    {businessCategories.length > 0 ? (
                      businessCategories.map((category) => (
                        <option key={category.id} value={category.id}>{category.title}</option>
                      ))
                    ) : (
                      <option value="" disabled>Loading categories...</option>
                    )}
                  </select>
                  {businessCategories.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">Loading categories from database...</p>
                  )}
                </div>
              </div>
              {/* Show market locations dropdown when Markets category is selected or businessType is Market */}
              {(businessType === "Market" || businessCategories.find(cat => cat.id === (businessData.category_id || 0))?.title === "Markets") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Location</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={marketName}
                    onChange={(e) => {
                      const selectedMarket = e.target.value;
                      setMarketName(selectedMarket);
                      // Find the corresponding market ID
                      const marketObj = marketLocations.find(m => m.name === selectedMarket);
                      if (marketObj) {
                        updateBusinessData('market_id', marketObj.id);
                      }
                    }}
                    required={businessType === "Market" || businessCategories.find(cat => cat.id === (businessData.category_id || 0))?.title === "Markets"}
                  >
                    <option value="">Select market location</option>
                    {marketLocations.length > 0 ? (
                      marketLocations.map((marketLocation) => (
                        <option key={marketLocation.id} value={marketLocation.name}>{marketLocation.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>Loading market locations...</option>
                    )}
                  </select>
                  {marketLocations.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">Loading market locations from database...</p>
                  )}
                </div>
              )}
              <div className="md:col-span-2 my-6">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-800">Services Offered</h3>
                  <p className="text-sm text-gray-700">
                    {businessType ? `Select the services you provide as a ${businessType.toLowerCase()}` : 'Select your business type to see relevant services'}
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Dropdown for sub-service selection */}
                  {businessType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Options</label>
                      <select
                        className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900"
                        value=""
                        onChange={(e) => {
                          const selectedService = e.target.value;
                          if (selectedService && !selectedServices.includes(selectedService)) {
                            setSelectedServices([...selectedServices, selectedService]);
                          }
                        }}
                      >
                        <option value="">Select a service to add</option>
                        {getServiceOptions().map((service) => (
                          <option 
                            key={service} 
                            value={service}
                            disabled={selectedServices.includes(service)}
                          >
                            {service} {selectedServices.includes(service) ? '(Added)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      placeholder="Add a custom service..."
                      className="flex-1 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomService}
                      className="px-4 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2 text-gray-800">Selected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((service) => (
                          <span
                            key={service}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-800 rounded-full text-sm font-medium border border-rose-200"
                          >
                            {service}
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                  <p className="text-sm text-gray-700 mb-2">
                    Describe your business, what makes it unique, and what customers can expect. 
                    You can use our AI to help generate a description or auto-fill based on your information.
                  </p>
                </div>
                <div className="space-y-3">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900"
                    rows={4}
                    value={businessData.description}
                    onChange={(e) => updateBusinessData('description', e.target.value)}
                    placeholder="Tell customers about your business..."
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAutoFillDescription}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-fill
                    </button>

                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Contact Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.contact_phone} 
                    onChange={e => updateBusinessData('contact_phone', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.contact_email} 
                    onChange={e => updateBusinessData('contact_email', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.website} 
                    onChange={e => updateBusinessData('website', e.target.value)} 
                    placeholder="https://your-website.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.address} 
                    onChange={e => updateBusinessData('address', e.target.value)} 
                  />
                </div>
              </div>
            </div>
        
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Social Connects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.facebook} 
                    onChange={e => updateBusinessData('facebook', e.target.value)} 
                    placeholder="Facebook URL or username" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessData.instagram} 
                    onChange={e => updateBusinessData('instagram', e.target.value)} 
                    placeholder="Instagram URL or username" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    placeholder="WhatsApp number or link" 
                  />
                </div>
              </div>
            </div>
           
            {success && (
              <div className="mb-4">
                <div className="bg-green-100 border border-green-500 text-green-800 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="block font-medium">{success}</span>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4">
                <div className="bg-red-100 border border-red-500 text-red-800 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="block font-medium">{error}</span>
                </div>
              </div>
            )}
            <button 
              type="submit" 
              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-md shadow transition-colors font-medium text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Save Profile
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}