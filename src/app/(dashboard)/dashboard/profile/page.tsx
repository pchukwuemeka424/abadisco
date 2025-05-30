"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/auth-context";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";

// Dynamic import for Cropper component to avoid SSR issues
const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <div className="w-64 h-64 bg-slate-200 animate-pulse rounded-lg"></div>
});

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

  // Function to fetch business data by owner_id
  const fetchBusinessByOwnerId = async (ownerId: string) => {
    try {
      if (!ownerId) return null;
      
      console.log("Fetching business data for owner ID:", ownerId);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle(); // This returns null if no business found
        
      if (error) {
        console.error("Error fetching business by owner_id:", error.message);
        return null;
      }
      
      console.log("Business data for owner:", data);
      return data;
    } catch (err) {
      console.error("Unexpected error in fetchBusinessByOwnerId:", err);
      return null;
    }
  };

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
  const [generating, setGenerating] = useState(false);
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
      if (!user) {
        console.error("Cannot update logo: User not authenticated");
        setError("You must be logged in to update a logo");
        return false;
      }
      
      // First try to use businessId from URL if it exists
      if (businessId) {
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
      } 
      // If no businessId in URL, use owner_id instead
      else {
        console.log(`Updating logo_url for business owned by user ${user.id} to: ${logoUrl}`);
        
        // Get the business ID for the current user's business
        const { data: businessData, error: findError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
          
        if (findError) {
          console.error("Failed to find business by owner_id:", findError);
          setError(`Logo update failed: ${findError.message}`);
          return false;
        }
        
        if (!businessData) {
          console.log("No existing business found, will create one in the form submission");
          // Just update the local state, actual database update will happen on form submit
          return true;
        }
        
        // Now update the business with the found ID
        const { data, error } = await supabase
          .from('businesses')
          .update({ logo_url: logoUrl })
          .eq('id', businessData.id)
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
      }
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

  // Add useEffect to use the fetchBusinessByOwnerId function when component mounts
  useEffect(() => {
    const loadBusinessData = async () => {
      if (!user || loading) return;
      
      try {
        // If we're not viewing a specific business, check if the user has their own business
        if (!businessId) {
          const businessData = await fetchBusinessByOwnerId(user.id);
          
          if (businessData) {
            console.log("Found business owned by user:", businessData);
            
            // Set all business data from the found business
            setBusinessData({
              name: businessData.name || "",
              description: businessData.description || "",
              market_id: businessData.market_id || "",
              category_id: businessData.category_id || null,
              owner_id: businessData.owner_id || "",
              contact_phone: businessData.contact_phone || "",
              contact_email: businessData.contact_email || "",
              address: businessData.address || "",
              logo_url: businessData.logo_url || "",
              website: businessData.website || "",
              facebook: businessData.facebook || "",
              instagram: businessData.instagram || "",
              created_by: businessData.created_by || "",
              status: businessData.status || "active",
              business_type: businessData.business_type || "",
              whatsapp: businessData.whatsapp || "",
              role: businessData.role || null,
            });
            
            // Set logo preview if exists
            if (businessData.logo_url) {
              setLogoPreview(businessData.logo_url);
            }
            
            // Look up market name from market_id
            if (businessData.market_id && marketLocations.length > 0) {
              const marketObj = marketLocations.find(m => m.id === businessData.market_id);
              if (marketObj) {
                setMarketName(marketObj.name);
              }
            }
            
            // Set business type from services data if available
            if (businessData.services && businessData.services.category) {
              setBusinessType(businessData.services.category);
            }
            
            // Set selected services if available
            if (businessData.services && Array.isArray(businessData.services.service_list)) {
              setSelectedServices(businessData.services.service_list);
            }
            
            // Set whatsapp if available
            if (businessData.whatsapp) {
              setWhatsapp(businessData.whatsapp);
            }
          } else {
            console.log("No business found for user ID:", user.id);
          }
        }
      } catch (err) {
        console.error("Error loading business data by owner:", err);
      }
    };
    
    // Only load business data once markets are loaded
    if (marketLocations.length > 0) {
      loadBusinessData();
    }
  }, [user, loading, businessId, marketLocations]);

  // Add a useEffect to fetch user details from the users table
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        console.log("No user available, skipping user data fetch");
        return;
      }
      
      console.log("Fetching user details for user ID:", user.id);
      
      try {
        // Fetch user data from the users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user data:", error.message);
          return;
        }
        
        if (!userData) {
          console.log("No detailed user profile found in users table");
          return;
        }
        
        console.log("Successfully retrieved user data:", userData);
        
        // Populate business data with user details if not already filled
        if (userData.phone && !businessData.contact_phone) {
          updateBusinessData('contact_phone', userData.phone);
        }
        
        // Pre-fill other fields from user data if available
        if (userData.full_name && !businessData.name) {
          // Only use the user's name for business name if it's empty
          updateBusinessData('name', userData.full_name + "'s Business");
        }
        
      } catch (err: any) {
        console.error("Unexpected error in fetchUserDetails:", err);
      }
    };
    
    if (user && !loading) {
      fetchUserDetails();
    }
  }, [user, loading, businessData.contact_phone, businessData.name]);

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
      // No need to check for agent data, this is a user dashboard
      console.log("Submitting business profile for user:", user.id);

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
              .ilike('title', `%${businessType}%`)
              .limit(1); // Limit to 1 result instead of using single()
              
            if (categoryError) {
              console.error("Error fetching category:", categoryError.message);
              // Continue with null category ID instead of stopping execution
            } else if (categoryData && categoryData.length > 0) {
              categoryId = categoryData[0].id;
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
      
      // Prepare common data for insert or update
      const businessDataToSave = {
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
        updated_at: new Date().toISOString(),
        whatsapp: whatsapp || null,
        owner_id: user.id
      };
      
      // First, check if this user already has a business in the database
      const { data: existingBusiness, error: checkError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to get null if no rows are found
      
      if (checkError) {
        console.error("Error checking for existing business:", checkError);
        throw new Error(`Failed to check for existing business: ${checkError.message}`);
      }
      
      // If user already has a business, update it
      if (existingBusiness) {
        console.log("Updating existing business with ID:", existingBusiness.id);
        
        const { data: updatedBusiness, error: updateError } = await supabase
          .from('businesses')
          .update(businessDataToSave)
          .eq('id', existingBusiness.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating business:", updateError);
          throw new Error(`Failed to update business: ${updateError.message}`);
        }
        
        console.log("Business updated successfully:", updatedBusiness);
        setSuccess("Business listing updated successfully!");
      } 
      // If user doesn't have a business yet, create a new one
      else {
        console.log("Creating new business for user:", user.id);
        
        // Add created_by and created_at for new records
        const newBusinessData = {
          ...businessDataToSave,
          created_by: user.id,
          created_at: new Date().toISOString(),
          status: 'active'
        };
        
        const { data: newBusiness, error: insertError } = await supabase
          .from('businesses')
          .insert(newBusinessData)
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating business:", insertError);
          throw new Error(`Failed to create business: ${insertError.message}`);
        }
        
        console.log("Business created successfully:", newBusiness);
        setSuccess("Business listing created successfully!");
      }
      
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUpdatingBusiness(false);
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

  const handleGenerateDescription = async () => {
    setGenerating(true);
    setError("");
    try {
      // Create a default prompt if description is empty to prevent 400 errors
      const promptToSend = businessData.description.trim() || `Generate a compelling description for ${businessData.name || 'a business'} that offers ${selectedServices.length > 0 ? selectedServices.join(", ") : businessType || 'various services'} in Aba, Nigeria.`;
      
      console.log("Calling /api/generate-description with prompt:", promptToSend);
      const response = await axios.post("/api/generate-description", {
        prompt: promptToSend
      });
      console.log("API response:", response.data);
      if (response.data.generatedText) {
        updateBusinessData('description', response.data.generatedText);
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setError("No text generated and no error message returned.");
      }
    } catch (err: any) {
      console.error("Error calling AI generate API:", err);
      setError(err?.response?.data?.error || err.message || "Failed to generate description");
    } finally {
      setGenerating(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Business Updated!</h3>
              <p className="text-slate-600 mb-6">Your business listing has been successfully updated. Redirecting to listings page...</p>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
                <div className="bg-emerald-500 h-2 rounded-full w-full animate-pulse"></div>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Business Profile</h1>
          <p className="text-slate-500">Manage your business details and services</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar with Authentication Status and User Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Account Status</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Authentication status indicator */}
                <div className={`p-4 rounded-xl ${loading ? 'bg-amber-50 border border-amber-200' : user ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loading ? 'bg-amber-500 animate-pulse' : user ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-slate-700">
                        {loading ? 'Authentication in progress...' : 
                        user ? 'Authenticated' : 
                        'Not authenticated'}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {loading ? 'Please wait...' : 
                        user ? user.email : 
                        'Please log in to continue'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* User ID display */}
                {user && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="text-sm font-medium text-slate-700">User Information</h3>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">User ID:</span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono text-slate-800">{user.id.slice(0, 12)}...</code>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(user.id)}}
                            title="Copy to clipboard"
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Logo upload section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-700">Business Logo</h3>
                  </div>
                  <div className="p-6">
                    <div
                      ref={dropRef}
                      onDrop={handleLogoDrop}
                      onDragOver={handleLogoDragOver}
                      className="w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      {!logoPreview ? (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-slate-500 mt-2">Upload Logo</p>
                          <p className="text-xs text-slate-400 mt-1">Drag & drop or click</p>
                          <input type="file" onChange={handleLogoInputChange} className="hidden" accept="image/*" />
                        </label>
                      ) : (
                        <div className="relative w-full h-full group">
                          <Image 
                            src={logoPreview} 
                            alt="Business Logo" 
                            fill
                            sizes="200px"
                            className="object-contain" 
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button 
                              type="button" 
                              onClick={handleRemoveLogo}
                              className="bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-all"
                            >
                              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-3">
                      Upload a square logo in JPG, PNG or WEBP format (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - Business Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Business Information</h2>
              </div>
              
              <form className="p-6" onSubmit={handleSubmit}>
                {/* Status messages */}
                {success && (
                  <div className="mb-6">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{success}</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-6">
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800 pb-2 border-b border-slate-200">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Name*</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.name} 
                          onChange={e => updateBusinessData('name', e.target.value)} 
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Type*</label>
                        <select 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessType} 
                          onChange={e => setBusinessType(e.target.value)}
                          required
                        >
                          <option value="">Select Business Type</option>
                          {serviceCategories.map(category => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Category</label>
                        <select 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.category_id !== null ? businessData.category_id.toString() : ""}
                          onChange={(e) => {
                            const categoryId = e.target.value ? parseInt(e.target.value) : null;
                            updateBusinessData('category_id', categoryId);
                            
                            // If Markets is selected, find the corresponding category title
                            if (categoryId) {
                              const selectedCategory = businessCategories.find(cat => cat.id === categoryId);
                              if (selectedCategory && selectedCategory.title === "Markets") {
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
                      </div>
                      
                      {(businessType === "Market" || businessCategories.find(cat => cat.id === (businessData.category_id || 0))?.title === "Markets") && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Market Location</label>
                          <select 
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            value={marketName}
                            onChange={(e) => {
                              const selectedMarket = e.target.value;
                              setMarketName(selectedMarket);
                              const marketObj = marketLocations.find(m => m.name === selectedMarket);
                              if (marketObj) {
                                updateBusinessData('market_id', marketObj.id);
                              }
                            }}
                            required={businessType === "Market" || businessCategories.find(cat => cat.id === (businessData.category_id || 0))?.title === "Markets"}
                          >
                            <option value="">Select Market</option>
                            {marketLocations.map((marketLocation) => (
                              <option key={marketLocation.id} value={marketLocation.name}>{marketLocation.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Services Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800 pb-2 border-b border-slate-200">Services</h3>
                    
                    {businessType ? (
                      <div className="space-y-4">
                        {/* Service selection dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Add Services</label>
                          <select
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                {service}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Custom service input */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Add Custom Service</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customService}
                              onChange={(e) => setCustomService(e.target.value)}
                              placeholder="Enter custom service name"
                              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomService())}
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomService}
                              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        
                        {/* Selected services display */}
                        {selectedServices.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Selected Services</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedServices.map((service) => (
                                <span
                                  key={service}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-sm border border-indigo-100"
                                >
                                  {service}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveService(service)}
                                    className="text-indigo-400 hover:text-indigo-700"
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
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                        <p className="text-sm">Please select a business type to see available services</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Description Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800 pb-2 border-b border-slate-200">Description</h3>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">Business Description</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAutoFillDescription}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                          >
                            Auto-fill
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={generating}
                            className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors disabled:opacity-50"
                          >
                            {generating ? 'Generating...' : 'Generate with AI'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
                        value={businessData.description}
                        onChange={(e) => updateBusinessData('description', e.target.value)}
                        placeholder="Describe your business, what makes it unique, and what customers can expect..."
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        A good description improves visibility in search results
                      </p>
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800 pb-2 border-b border-slate-200">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.contact_phone} 
                          onChange={e => updateBusinessData('contact_phone', e.target.value)} 
                          placeholder="e.g. +234 8012345678"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.contact_email} 
                          onChange={e => updateBusinessData('contact_email', e.target.value)} 
                          placeholder="e.g. business@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.website} 
                          onChange={e => updateBusinessData('website', e.target.value)} 
                          placeholder="e.g. https://yourbusiness.com" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Physical Address</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.address} 
                          onChange={e => updateBusinessData('address', e.target.value)} 
                          placeholder="e.g. 123 Main Street, Aba"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Social Media */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800 pb-2 border-b border-slate-200">Social Media</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </span>
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.facebook} 
                          onChange={e => updateBusinessData('facebook', e.target.value)} 
                          placeholder="Username or URL" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.558-2.913-.306-.789-.717-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                            </svg>
                            Instagram
                          </span>
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={businessData.instagram} 
                          onChange={e => updateBusinessData('instagram', e.target.value)} 
                          placeholder="Username or URL" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <span className="inline-flex items-center">
                            <svg className="w-4 h-4 mr-1 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </span>
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          value={whatsapp} 
                          onChange={e => setWhatsapp(e.target.value)} 
                          placeholder="Phone number with country code" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isUpdatingBusiness}
                      className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-200 font-medium transition-all focus:ring-4 focus:ring-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUpdatingBusiness ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image cropping modal */}
      {showCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Crop Logo</h3>
            <div className="relative w-full h-80 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-6">
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleCropConfirm} 
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Apply
              </button>
              <button 
                onClick={() => setShowCrop(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}