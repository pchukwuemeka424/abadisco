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
  
  // Geolocation state variables
  const [locationData, setLocationData] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
    timestamp: null as string | null,
    address: "" as string,
    isLocationLoading: false,
    locationError: "",
    locationPermission: "prompt" as "granted" | "denied" | "prompt"
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

  // Geolocation functions
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationData(prev => ({
        ...prev,
        locationError: "Geolocation is not supported by this browser."
      }));
      return;
    }

    setLocationData(prev => ({
      ...prev,
      isLocationLoading: true,
      locationError: ""
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = new Date(position.timestamp).toISOString();
        
        setLocationData(prev => ({
          ...prev,
          latitude,
          longitude,
          accuracy,
          timestamp,
          isLocationLoading: false,
          locationPermission: "granted"
        }));

        // Reverse geocode to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        let errorMessage = "Failed to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            setLocationData(prev => ({ ...prev, locationPermission: "denied" }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred while getting location.";
            break;
        }
        
        setLocationData(prev => ({
          ...prev,
          isLocationLoading: false,
          locationError: errorMessage
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data.display_name) {
        const detectedAddress = data.display_name;
        
        setLocationData(prev => ({
          ...prev,
          address: detectedAddress
        }));
        
        // Also update the business address field if it's empty or different
        if (!businessData.address || businessData.address !== detectedAddress) {
          updateBusinessData('address', detectedAddress);
        }
        
        console.log('📍 Detected address:', detectedAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Don't show error to user as this is not critical
    }
  };

  const clearLocation = () => {
    setLocationData({
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      address: "",
      isLocationLoading: false,
      locationError: "",
      locationPermission: "prompt"
    });
    
    // Also clear the business address field if it was set by geolocation
    if (businessData.address === locationData.address) {
      updateBusinessData('address', "");
    }
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
        address: locationData.address || businessData.address || null, // Use detected address if available
        logo_url: logoPreview || null,
        website: businessData.website || null,
        facebook: businessData.facebook || null,
        instagram: businessData.instagram || null,
        created_by: user.id, // The agent creates the business
        status: 'active',
        services: servicesJson, // Add services as JSONB data
        // Add geolocation data if available
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location_accuracy: locationData.accuracy,
        location_timestamp: locationData.timestamp,
        detected_address: locationData.address || null
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

  // Auto-get location when component mounts and user is authenticated
  useEffect(() => {
    if (user && !loading && authChecked && locationData.locationPermission === "prompt") {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        getCurrentLocation();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, authChecked, locationData.locationPermission]);

  const getServiceOptions = useCallback(() => {
    if (!businessType) return [];
    
    // Find the service category ID based on the selected business type
    const serviceCategoryId = serviceCategories.find(category => category.name === businessType)?.id;
    
    if (!serviceCategoryId) return [];
    
    // Return the sub-services for this category from the category map
    return categoryMap[serviceCategoryId]?.services || [];
  }, [businessType, serviceCategories, categoryMap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Success!</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Your business listing has been created successfully. Redirecting to dashboard...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full animate-pulse"></div>
              </div>
              <button 
                onClick={() => router.push('/agent')}
                className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl">🏬</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Business Listing</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">Create a compelling business profile to attract customers and grow your business</p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">Business Information</h2>
                    <p className="text-rose-100 text-sm">Fill in your business details below</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-right">
                    <div className="text-white font-medium">Step 1 of 1</div>
                    <div className="text-rose-100 text-sm">Complete Profile</div>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Form Content */}
            <div className="p-6 space-y-8">
              {/* Authentication Status */}
              <div className={`p-4 rounded-xl border-l-4 ${
                loading ? 'bg-amber-50 border-amber-400' : 
                user ? 'bg-emerald-50 border-emerald-400' : 
                'bg-red-50 border-red-400'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    loading ? 'bg-amber-500 animate-pulse' : 
                    user ? 'bg-emerald-500' : 
                    'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      loading ? 'text-amber-800' : 
                      user ? 'text-emerald-800' : 
                      'text-red-800'
                    }`}>
                      {loading ? 'Verifying your account...' : 
                       user ? `Welcome back, ${user.email}` : 
                       'Please log in to continue'}
                    </p>
                    {user && (
                      <p className="text-xs text-emerald-600 mt-1">You're all set to create your business listing</p>
                    )}
                  </div>
                  {user && (
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Logo Upload Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
                      <p className="text-sm text-gray-600">Upload your business logo to make your listing stand out</p>
                    </div>
                  </div>
                  
                  <div
                    ref={dropRef}
                    onDrop={handleLogoDrop}
                    onDragOver={handleLogoDragOver}
                    className="relative group"
                  >
                    {!logoPreview ? (
                      <label className="block w-full">
                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 transition-all duration-200 cursor-pointer group-hover:border-blue-400 group-hover:shadow-md">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-blue-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-600">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                          </div>
                          <input type="file" onChange={handleLogoInputChange} className="hidden" accept="image/*" />
                        </div>
                      </label>
                    ) : (
                      <div className="relative">
                        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-lg border-4 border-white">
                          <Image 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            width={128}
                            height={128}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={handleRemoveLogo} 
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110" 
                          title="Remove logo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Recommended: Square image, 512x512 pixels</p>
                  </div>
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
                {/* Business Information Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                      <p className="text-sm text-gray-600">Tell us about your business</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Business Name *</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessData.name} 
                        onChange={e => updateBusinessData('name', e.target.value)} 
                        placeholder="Enter your business name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Services Offering *</label>
                      <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessType} 
                        onChange={e => setBusinessType(e.target.value)}
                        required
                      >
                        <option value="">Select your services</option>
                        {serviceCategories.map(category => (
                          <option key={category.id} value={category.name}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Business Category</label>
                      <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
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
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Loading categories from database...
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Market Location Section */}
                  {(businessType === "Market" || businessCategories.find(cat => cat.id === (businessData.category_id || 0))?.title === "Markets") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Market Location *</label>
                      <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
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
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Loading market locations from database...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Location Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Location</h3>
                      <p className="text-sm text-gray-600">Capture your current location for better customer discovery</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Location Status */}
                    <div className={`p-4 rounded-xl border-l-4 ${
                      locationData.isLocationLoading ? 'bg-blue-50 border-blue-400' : 
                      locationData.latitude && locationData.longitude ? 'bg-green-50 border-green-400' : 
                      locationData.locationError ? 'bg-red-50 border-red-400' : 
                      'bg-gray-50 border-gray-400'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          locationData.isLocationLoading ? 'bg-blue-500 animate-pulse' : 
                          locationData.latitude && locationData.longitude ? 'bg-green-500' : 
                          locationData.locationError ? 'bg-red-500' : 
                          'bg-gray-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            locationData.isLocationLoading ? 'text-blue-800' : 
                            locationData.latitude && locationData.longitude ? 'text-green-800' : 
                            locationData.locationError ? 'text-red-800' : 
                            'text-gray-800'
                          }`}>
                            {locationData.isLocationLoading ? 'Getting your location...' : 
                             locationData.latitude && locationData.longitude ? 'Location captured successfully!' : 
                             locationData.locationError ? locationData.locationError : 
                             'Click "Get Current Location" to capture your business location'}
                          </p>
                          {locationData.latitude && locationData.longitude && (
                            <p className="text-xs text-green-600 mt-1">
                              Accuracy: {locationData.accuracy ? `${Math.round(locationData.accuracy)}m` : 'Unknown'}
                            </p>
                          )}
                        </div>
                        {locationData.latitude && locationData.longitude && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={locationData.isLocationLoading}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {locationData.isLocationLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Get Current Location
                          </>
                        )}
                      </button>
                      
                      {locationData.latitude && locationData.longitude && (
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear Location
                        </button>
                      )}
                    </div>

                    {/* Location Details */}
                    {locationData.latitude && locationData.longitude && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-indigo-200">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Coordinates</label>
                          <div className="text-sm font-mono text-gray-900">
                            <div>Lat: {locationData.latitude.toFixed(6)}</div>
                            <div>Lng: {locationData.longitude.toFixed(6)}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Details</label>
                          <div className="text-sm text-gray-900">
                            <div>Accuracy: {locationData.accuracy ? `${Math.round(locationData.accuracy)}m` : 'Unknown'}</div>
                            <div>Captured: {locationData.timestamp ? new Date(locationData.timestamp).toLocaleString() : 'Unknown'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address Display */}
                    {locationData.address && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Detected Address
                        </label>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">📍 {locationData.address}</p>
                              <p className="text-xs text-green-600">This address will be automatically used for your business listing</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                updateBusinessData('address', locationData.address);
                                setSuccess('Address updated successfully!');
                              }}
                              className="ml-3 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                            >
                              Use This
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services Section */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Services Offered</h3>
                      <p className="text-sm text-gray-600">
                        {businessType ? `Select the services you provide as a ${businessType.toLowerCase()}` : 'Select your business type to see relevant services'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Service Options Dropdown */}
                    {businessType && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Available Services</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400"
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
                    
                    {/* Custom Service Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Add Custom Service</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={customService}
                          onChange={(e) => setCustomService(e.target.value)}
                          placeholder="Enter a custom service..."
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomService}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Selected Services Display */}
                    {selectedServices.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Selected Services ({selectedServices.length})</p>
                        <div className="flex flex-wrap gap-3">
                          {selectedServices.map((service) => (
                            <span
                              key={service}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200 shadow-sm"
                            >
                              <span>{service}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveService(service)}
                                className="text-purple-600 hover:text-purple-800 transition-colors"
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

                {/* Business Description Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Description</h3>
                      <p className="text-sm text-gray-600">Tell customers about your business and what makes you unique</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Description</label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400"
                        rows={4}
                        value={businessData.description}
                        onChange={(e) => updateBusinessData('description', e.target.value)}
                        placeholder="Describe your business, services, and what makes you stand out..."
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAutoFillDescription}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Auto-fill Description
                      </button>
                    </div>
                  </div>
                </div>
            </div>
                {/* Contact Information Section */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                      <p className="text-sm text-gray-600">How customers can reach your business</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessData.contact_phone} 
                        onChange={e => updateBusinessData('contact_phone', e.target.value)} 
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed" 
                        value={businessData.contact_email} 
                        readOnly
                      />
                      <p className="text-xs text-gray-500">Email is automatically filled from your account</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Website</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessData.website} 
                        onChange={e => updateBusinessData('website', e.target.value)} 
                        placeholder="https://your-website.com" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        Business Address
                        {locationData.address && businessData.address === locationData.address && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Auto-filled
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:border-cyan-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400 ${
                          locationData.address && businessData.address === locationData.address 
                            ? 'border-green-300 focus:ring-green-500' 
                            : 'border-gray-300 focus:ring-cyan-500'
                        }`}
                        value={businessData.address} 
                        onChange={e => updateBusinessData('address', e.target.value)} 
                        placeholder="Enter your business address or use detected location"
                      />
                      {locationData.address && businessData.address === locationData.address && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Address auto-filled from your current location
                        </p>
                      )}
                    </div>
                  </div>
                </div>
        
                {/* Social Media Section */}
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
                      <p className="text-sm text-gray-600">Connect your social media accounts</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessData.facebook} 
                        onChange={e => updateBusinessData('facebook', e.target.value)} 
                        placeholder="Facebook URL or username" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                        </svg>
                        Instagram
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={businessData.instagram} 
                        onChange={e => updateBusinessData('instagram', e.target.value)} 
                        placeholder="Instagram URL or username" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        WhatsApp
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400" 
                        value={whatsapp} 
                        onChange={e => setWhatsapp(e.target.value)} 
                        placeholder="WhatsApp number or link" 
                      />
                    </div>
                  </div>
                </div>
           
                {/* Success/Error Messages */}
                {success && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl relative flex items-center gap-3 shadow-sm" role="alert">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-semibold">{success}</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl relative flex items-center gap-3 shadow-sm" role="alert">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="font-semibold">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <button 
                    type="submit" 
                    className="px-12 py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transform hover:-translate-y-0.5 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Create Business Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}