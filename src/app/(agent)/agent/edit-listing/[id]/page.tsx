"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/auth-context";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic import for Cropper component to avoid SSR issues
const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg"></div>
});

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Utility components
const FormSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <motion.div 
    variants={itemVariants}
    className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
    <div className="space-y-5">
      {children}
    </div>
  </motion.div>
);

const FormField = ({ 
  label, 
  children, 
  hint 
}: { 
  label: string, 
  children: React.ReactNode, 
  hint?: string 
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
    {children}
  </div>
);

// Replacing hardcoded services with data fetched from the database
export default function ProfilePage() {
  const { user, loading } = useAuth(); // Use auth context
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  
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

  // Function to directly update the logo URL for a specific business in the database
  const updateLogoInDatabase = async (logoUrl: string) => {
    try {
      console.log(`Directly updating logo_url for business ID ${businessId} to: ${logoUrl}`);
      
      const { data, error } = await supabase
        .from('businesses')
        .update({ logo_url: logoUrl })
        .eq('id', businessId)
        .select('logo_url')
        .single();
        
      if (error) {
        console.error("Failed to update logo_url in database:", error);
        setError(`Logo update failed: ${error.message}`);
        return false;
      }
      
      console.log("Logo updated successfully in database:", data);
      setSuccess("Logo updated successfully");
      return true;
    } catch (err) {
      console.error("Exception during logo update:", err);
      setError("An unexpected error occurred updating the logo");
      return false;
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

  // Add useEffect to fetch business data by ID when component mounts
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!businessId || !user) return;
      
      setIsLoading(true);
      setError("");
      
      try {
        console.log("Fetching business data for ID:", businessId);
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();
          
        if (error) {
          console.error("Error fetching business data:", error.message);
          setError(`Failed to fetch business information: ${error.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!data) {
          setError("Business listing not found. It may have been deleted.");
          setIsLoading(false);
          return;
        }
        
        console.log("Business data loaded:", data);
        
        // Set all business data
        setBusinessData({
          name: data.name || "",
          description: data.description || "",
          market_id: data.market_id || "",
          category_id: data.category_id || null,
          owner_id: data.owner_id || "",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
          address: data.address || "",
          logo_url: data.logo_url || "",
          website: data.website || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          created_by: data.created_by || "",
          status: data.status || "active",
          business_type: data.business_type || "",
          whatsapp: data.whatsapp || "",
          role: data.role || null,
        });
        
        // Set logo preview if exists
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
        
        // Look up market name from market_id
        if (data.market_id) {
          const marketObj = marketLocations.find(m => m.id === data.market_id);
          if (marketObj) {
            setMarketName(marketObj.name);
          }
        }
        
        // Set business type from services data if available
        if (data.services && data.services.category) {
          setBusinessType(data.services.category);
        }
        
        // Set selected services if available
        if (data.services && Array.isArray(data.services.service_list)) {
          setSelectedServices(data.services.service_list);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error("Unexpected error fetching business data:", err);
        setError(`An unexpected error occurred: ${err?.message || "Unknown error"}`);
        setIsLoading(false);
      }
    };
    
    // Only fetch business data once markets are loaded
    if (marketLocations.length > 0) {
      fetchBusinessData();
    }
  }, [businessId, user, marketLocations]);

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

  const handleRemoveLogo = async () => {
    setLogoPreview("");
    setLogo(null);
    // Also update the business data to ensure the logo is removed in the database
    updateBusinessData('logo_url', "");
    
    // Directly update the logo in the database
    await updateLogoInDatabase("");
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
        // Directly update the logo URL in the database
        await updateLogoInDatabase(publicUrl);
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
    setIsUpdatingBusiness(true);

    // Show auth status for debugging
    console.log("Auth state:", { user, loading, authChecked });
    
    if (loading) {
      setError("Authentication is still loading. Please try again in a moment.");
      setIsUpdatingBusiness(false);
      return;
    }

    if (!user) {
      setError("You must be logged in to update a listing");
      setIsUpdatingBusiness(false);
      return;
    }

    if (!businessData.name) {
      setError("Business name is required");
      setIsUpdatingBusiness(false);
      return;
    }

    if (!businessType) {
      setError("Business type is required");
      setIsUpdatingBusiness(false);
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
          setIsUpdatingBusiness(false);
          return;
        }
        
        if (!agentData) {
          setError("Your agent profile was not found. Please contact support.");
          setIsUpdatingBusiness(false);
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
      
      console.log("Logo data before update:", {
        logoPreview,
        businessDataLogoUrl: businessData.logo_url,
        finalLogoUrl: logoPreview || businessData.logo_url || null
      });
      
      // Update business with direct logo URL reference for clarity
      const businessUpdateData = {
        name: businessData.name,
        description: businessData.description || null,
        market_id: marketId,
        category_id: categoryId,
        contact_phone: businessData.contact_phone || null,
        contact_email: businessData.contact_email || null,
        address: businessData.address || null,
        logo_url: businessData.logo_url, // Use directly from businessData which is now synchronized
        website: businessData.website || null,
        facebook: businessData.facebook || null,
        instagram: businessData.instagram || null,
        services: servicesJson, // Update services as JSONB data
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating business with ID:", businessId, businessUpdateData);
      
      const { data: updatedBusiness, error: businessError } = await supabase
        .from('businesses')
        .update(businessUpdateData)
        .eq('id', businessId)
        .select()
        .single();
        
      if (businessError) {
        console.error("Error updating business:", businessError);
        throw new Error(`Failed to update business: ${businessError.message}`);
      }
      
      console.log("Business updated successfully:", updatedBusiness);

      setSuccess("Business listing updated successfully!");
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push('/agent/manage-listing');
      }, 2000);
      
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

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

  // Directly update business data when setting logoPreview
  useEffect(() => {
    // Ensure logo_url in businessData stays synchronized with logoPreview
    updateBusinessData('logo_url', logoPreview);
    console.log("Logo state synchronized:", { logoPreview, businessDataLogoUrl: businessData.logo_url });
  }, [logoPreview]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      {showSuccessModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Updated!</h3>
              <p className="text-gray-600 mb-6">Your business listing has been successfully updated.</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                <div className="bg-green-500 h-2 rounded-full animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/agent/manage-listing')}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-medium"
                >
                  Manage Listings
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors shadow-md font-medium"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Edit Business Listing</h1>
              <p className="mt-2 text-indigo-100 max-w-2xl">
                Update your business information, services, and contact details below.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${loading ? 'bg-yellow-200 text-yellow-800' : user ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-500 animate-pulse' : user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {loading ? 'Verifying...' : user ? 'Authenticated' : 'Not Authenticated'}
                  </div>
                  {user && (
                    <div className="text-xs text-indigo-100 mt-1 truncate max-w-[200px]">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="inline-block p-8 bg-indigo-50 rounded-full mb-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Loading Your Business</h3>
              <p className="text-gray-500 mt-2">Please wait while we fetch your business information...</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { 
                  staggerChildren: 0.1
                }
              }
            }}
            className="space-y-6"
          >
            <motion.form 
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              className="space-y-8" 
              onSubmit={handleSubmit}
            >
              {/* Logo Upload Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Business Logo</h2>
                </div>
                
                <div
                  ref={dropRef}
                  onDrop={handleLogoDrop}
                  onDragOver={handleLogoDragOver}
                  className="flex gap-6 mt-2 flex-wrap min-h-[140px] p-6 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  <div className="flex-grow flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                    <svg className="w-10 h-10 text-indigo-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-indigo-700 mb-1">Drop your logo image here, or click to browse</p>
                    <p className="text-xs text-indigo-500">JPG, PNG, or WEBP (max 5MB)</p>
                    <input type="file" onChange={handleLogoInputChange} className="hidden" accept="image/*" />
                  </div>
                  
                  {logoPreview && (
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md">
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
                        className="absolute -top-2 -right-2 bg-white hover:bg-rose-500 hover:text-white text-rose-600 rounded-full p-1.5 shadow-md transition-colors border border-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Business Info Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Business Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.name} 
                      onChange={e => updateBusinessData('name', e.target.value)} 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Services Offering</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Category</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.category_id !== null ? businessData.category_id.toString() : ""}
                      onChange={(e) => {
                        const categoryId = e.target.value ? parseInt(e.target.value) : null;
                        updateBusinessData('category_id', categoryId);
                      }}
                    >
                      <option value="">Select Category</option>
                      {businessCategories.map(category => (
                        <option key={category.id} value={category.id}>{category.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Market Location Field */}
                  {marketLocations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Market Location</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                        value={marketName}
                        onChange={(e) => {
                          setMarketName(e.target.value);
                          // Find the market ID based on the selected market name
                          const marketObj = marketLocations.find(m => m.name === e.target.value);
                          if (marketObj) {
                            updateBusinessData('market_id', marketObj.id);
                          }
                        }}
                      >
                        <option value="">Select Market Location</option>
                        {marketLocations.map((market) => (
                          <option key={market.id} value={market.name}>{market.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Services Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Services Offered</h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {businessType ? `Select the services you provide as a ${businessType.toLowerCase()}` : 'Select your business type to see relevant services'}
                </p>
                
                <div className="space-y-5">
                  {/* Dropdown for sub-service selection */}
                  {businessType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Options</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
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
                      className="flex-1 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleAddCustomService}
                      className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md"
                    >
                      Add
                    </motion.button>
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="mt-5">
                      <p className="text-sm font-medium mb-3 text-gray-800">Selected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((service) => (
                          <motion.span
                            key={service}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-full text-sm font-medium border border-indigo-200"
                          >
                            {service}
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => handleRemoveService(service)}
                              className="text-indigo-500 hover:text-indigo-700 bg-white rounded-full p-0.5 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </motion.button>
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Description Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Business Description</h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Describe your business, what makes it unique, and what customers can expect. 
                  You can use our AI to help generate a description or auto-fill based on your information.
                </p>
                
                <div className="space-y-5">
                  <textarea
                    className="w-full p-3.5 border border-gray-300 rounded-xl shadow-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    rows={5}
                    value={businessData.description}
                    onChange={(e) => updateBusinessData('description', e.target.value)}
                    placeholder="Tell customers about your business..."
                  />
                  <div className="flex gap-3 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleAutoFillDescription}
                      className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-fill
                    </motion.button>

                  </div>
                </div>
              </motion.div>
              
              {/* Contact Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.contact_phone} 
                      onChange={e => updateBusinessData('contact_phone', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.contact_email} 
                      onChange={e => updateBusinessData('contact_email', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.website} 
                      onChange={e => updateBusinessData('website', e.target.value)} 
                      placeholder="https://your-website.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Location Address</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                      value={businessData.address} 
                      onChange={e => updateBusinessData('address', e.target.value)} 
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Social Media Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Social Media</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                        value={businessData.facebook} 
                        onChange={e => updateBusinessData('facebook', e.target.value)} 
                        placeholder="Username or URL" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428.247-.667.642-1.272 1.153-1.772a4.91 4.91 0 011.772-1.153c.637-.247 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.8c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882.344 1.857-.048 1.055-.059 1.37-.059 4.041 0 2.67.01 2.986.059 4.04.045.976.207 1.505.344 1.858.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.059 4.04.059 2.67 0 2.987-.01 4.04-.059.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.059-1.37.059-4.041 0-2.67-.01-2.986-.059-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.059-4.041-.059zm0 3.064A5.136 5.136 0 1 1 12 17.136 5.136 5.136 0 0 1 12 6.864zm0 8.476a3.34 3.34 0 1 0 0-6.68 3.34 3.34 0 0 0 0 6.68zm6.538-8.722a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                        value={businessData.instagram} 
                        onChange={e => updateBusinessData('instagram', e.target.value)} 
                        placeholder="Username or URL" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900" 
                        value={businessData.whatsapp} 
                        onChange={e => updateBusinessData('whatsapp', e.target.value)} 
                        placeholder="Phone number with country code" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Status and Submit Section */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                {success && (
                  <div className="mb-5">
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3" role="alert">
                      <div className="shrink-0 bg-green-100 p-2 rounded-full">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{success}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-5">
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3" role="alert">
                      <div className="shrink-0 bg-red-100 p-2 rounded-full">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => router.push('/agent/manage-listing')}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors shadow-md font-medium"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={isUpdatingBusiness}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md font-medium disabled:opacity-70"
                  >
                    {isUpdatingBusiness ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
        
        {/* Image Cropper Modal */}
        <AnimatePresence>
          {showCrop && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center relative max-w-md w-full mx-4"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">Crop Your Logo</h3>
                <p className="text-gray-600 mb-5 text-center text-sm">Drag to position and use the slider to zoom. A square crop works best for your business logo.</p>
                
                <div className="relative w-72 h-72 bg-gray-100 rounded-xl overflow-hidden border-2 border-indigo-300 shadow-inner mb-5">
                  <Cropper
                    image={croppingImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    rotation={0}
                    minZoom={1}
                    maxZoom={3}
                    zoomSpeed={0.1}
                    showGrid={true}
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
                  />
                </div>
                
                <div className="w-full mb-6">
                  <label className="block text-sm text-gray-600 mb-2">Zoom: {zoom.toFixed(1)}x</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-md"
                    onClick={handleCropConfirm}
                  >
                    Crop & Save
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium shadow-md"
                    onClick={() => setShowCrop(false)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}