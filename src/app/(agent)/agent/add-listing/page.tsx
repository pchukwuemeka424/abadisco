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

const SERVICES = [
  "Dine-in",
  "Takeaway",
  "Delivery",
  "Outdoor Seating",
  "Reservations",
  "Catering"
];
const BUSINESS_TYPES = [
  "Restaurant",
  "Bar",
  "Cafe",
  "Bakery",
  "Market",
  "Pharmacy",
  "Salon",
  "Hotel",
  "Boutique",
  "Spa",
  "Gym",
  "Laundry",
  "Auto Repair",
  "Electronics",
  "Other"
];

const SERVICE_CATEGORIES = {
  Restaurant: [
    "Local Dishes",
    "   - Nkwobi",
    "   - Isiewu",
    "   - Suya",
    "   - Restaurant Pepper Soup",  // Qualified with category
    "   - Egusi Soup",
    "   - Ogbono Soup",
    "   - Okra Soup",
    "   - Afang Soup",
    "   - Edikaikong",
    "   - Oha Soup",
    "   - Banga Soup",
    "   - Jollof Rice",
    "   - Native Rice",
    "   - Ofada Rice & Sauce",
    "   - Moi Moi",
    "   - Akara",
    "   - Tuwo Shinkafa",
    "   - Amala & Ewedu",
    "   - Eba & Soup",
    "   - Fufu & Soup",
    "   - Pounded Yam",
    "Continental Dishes",
    "Chinese Cuisine",
    "Fast Food",
    "Grills & BBQ",
    "Seafood",
    "Small Chops",
    "Vegetarian Options",
    "Desserts",
    "Beverages",
    "Catering",
    "Takeaway",
    "Delivery",
    "Dine-in",
    "Outdoor Seating",
    "Private Dining",
    "Event Catering"
  ],
  Bar: [
    "Local Drinks",
    "   - Palm Wine",
    "   - Bar Pepper Soup",  // Qualified with category
    "   - Bar Nkwobi",      // Qualified with category
    "   - Isi Ewu",
    "   - Point & Kill (Fresh Fish)",
    "   - Bar Suya",        // Qualified with category
    "Beverages",
    "   - Local Beer",
    "   - Imported Beer",
    "   - Wine & Spirits",
    "   - Cocktails",
    "   - Soft Drinks",
    "   - Fresh Juices",
    "Bar Food",
    "   - Small Chops",
    "   - Grilled Fish",
    "   - Grilled Meat",
    "   - Shawarma",
    "Services",
    "   - Live Music",
    "   - Sports Screening",
    "   - Pool Table",
    "   - Outdoor Seating",
    "   - Private Events",
    "   - Weekend Special",
    "   - Happy Hour"
  ],
  Market: [
    "Clothing & Textiles",
    "Senator Wears",
    "Ankara Fabrics",
    "Aso Oke",
    "Lace Materials",
    "   - French Lace",
    "   - Indian Lace",
    "   - Swiss Lace",
    "   - Voile Lace",
    "   - Tulle Lace",
    "   - Cord Lace",
    "Adire (Tie & Dye)",
    "George Fabrics",
    "Electronics & Gadgets",
    "Home Appliances",
    "Footwear",
    "Bags & Accessories",
    "Cosmetics",
    "Food & Groceries",
    "Hardware & Tools",
    "Auto Parts",
    "Building Materials",
    "Wholesale",
    "Retail",
    "Import/Export"
  ],
  Pharmacy: [
    "Prescription Medications",
    "Over-the-Counter Drugs",
    "Health Supplements",
    "Medical Supplies",
    "Personal Care Products",
    "Baby Care",
    "Health Consultation",
    "Home Delivery",
    "24/7 Service"
  ],
  Electronics: [
    "Phones & Accessories",
    "Computers & Laptops",
    "Audio Equipment",
    "TVs & Home Theater",
    "Gaming Devices",
    "Electronic Components",
    "Repair Services",
    "Custom Builds",
    "Installation Services"
  ],
  Hotel: [
    "Room Service",
    "Restaurant",
    "Bar & Lounge",
    "Conference Facilities",
    "Swimming Pool",
    "Gym",
    "Spa Services",
    "Airport Shuttle",
    "Laundry Service",
    "24/7 Reception",
    "Wi-Fi"
  ],
  Salon: [
    "Haircuts & Styling",
    "Hair Coloring",
    "Manicure & Pedicure",
    "Facial Treatments",
    "Makeup Services",
    "Waxing",
    "Braiding",
    "Hair Extensions",
    "Wedding Services"
  ],
  "Auto Repair": [
    "General Repairs",
    "Engine Service",
    "Electrical Systems",
    "AC Service",
    "Brake Service",
    "Tire Service",
    "Body Work",
    "Paint Jobs",
    "Diagnostics",
    "Emergency Service"
  ],
  default: [
    "Standard Service",
    "Premium Service",
    "Express Service",
    "Consultation",
    "Custom Solutions",
    "Delivery",
    "Installation",
    "Maintenance",
    "Repair"
  ]
};

export default function ProfilePage() {
  const { user, loading } = useAuth(); // Use auth context
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agentId, setAgentId] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [market, setMarket] = useState(""); // Add market state
  const [marketLocations, setMarketLocations] = useState<{id: string, name: string}[]>([]); // Add state for market locations
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [customService, setCustomService] = useState("");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const [croppingImage, setCroppingImage] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);

  // Add state to track authentication status 
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check authentication status at the beginning
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      // Pre-fill email from user auth if available
      if (user?.email && !email) {
        setEmail(user.email);
      }
    }
  }, [user, loading, email]); // These dependencies are consistent

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
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
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
        // Update users table with new logo URL
        await supabase
          .from('users')
          .update({ logo_url: publicUrl })
          .eq('id', user.id);
        
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

    if (!businessName) {
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

      // Process selected services to match the users table schema
      const servicesText = selectedServices.length > 0 ? selectedServices.join(", ") : null;
      const customServicesArray = selectedServices.length > 0 ? selectedServices : null;

      // First, try a direct query to see what's going on with the database schema
      const { data: usersTableSchema, error: schemaError } = await supabase
        .from('users')
        .select('created_by, agent_user_id')
        .limit(1);
        
      console.log("Users table schema example:", usersTableSchema);
      console.log("Schema error:", schemaError);
      
      // The fix: Convert UUID types to exact format expected by the database
      // For agent_user_id field which is text in the users table
      const agentIdString = String(currentAgentId);
      
      // For created_by field which is text in the users table
      const userIdString = String(user.id);
      
      console.log(`Agent ID (${typeof currentAgentId}):`, currentAgentId);
      console.log(`Agent ID as string:`, agentIdString);
      console.log(`User ID (${typeof user.id}):`, user.id);
      console.log(`User ID as string:`, userIdString);
      
      // Prepare the data based on the actual users table schema
      const userData = {
        // Let database handle ID generation
        business_name: businessName,
        business_type: businessType,
        registration_number: registrationNumber || null,
        description: description || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        address: location || null,
        logo_url: logoPreview || null,
        facebook: facebook || null,
        instagram: instagram || null,
        whatsapp: whatsapp || null,
        custom_services: customServicesArray,
        full_name: businessName,
        status: 'Now Open',
        services: servicesText,
        market: market || null,
        role: 'business',
        // Use agent's user_id for created_by field, not the agent's id
        created_by: userIdString,
      };

      console.log("Inserting business data:", userData);
      
      // Insert the data into the users table
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
        
      if (insertError) {
        console.error("Error inserting business:", insertError);
        throw new Error(`Failed to add business: ${insertError.message}`);
      }
      
      // If a market is selected, also insert into businesses table
      if (market) {
        // Find the market ID based on the selected market name
        let marketId: string | null = null;
        const selectedMarketObj = marketLocations.find(m => m.name === market);
        
        if (selectedMarketObj) {
          marketId = selectedMarketObj.id;
          
          // Prepare data for businesses table
          const businessData = {
            name: businessName,
            description: description || null,
            market_id: marketId,
            owner_id: insertData.id, // Use the newly created user record as the owner
            contact_phone: phone || null,
            contact_email: email || null,
            address: location || null,
            logo_url: logoPreview || null,
            status: 'active',
          };
          
          console.log("Inserting into businesses table:", businessData);
          
          // Insert into businesses table
          const { data: businessInsertData, error: businessInsertError } = await supabase
            .from('businesses')
            .insert(businessData)
            .select()
            .single();
            
          if (businessInsertError) {
            console.error("Error inserting into businesses table:", businessInsertError);
            // We won't throw here since the user record was created successfully
            // Just log the error for reference
          } else {
            console.log("Business record created successfully:", businessInsertData);
          }
        } else {
          console.warn("Selected market not found in marketLocations array:", market);
        }
      }

      // update the agent's profile increment create const num = +1 current_week_registrations total_registrations 
      
      // First, get the current agent's registration counts
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('total_registrations, current_week_registrations')
        .eq('id', currentAgentId)
        .single();

      if (agentError) {
        console.error('Error fetching agent data:', agentError);
        return;
      }

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

      console.log("Business added successfully:", insertData);
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

  const handleGenerateDescription = async () => {
    setGenerating(true);
    setError("");
    try {
      console.log("Calling /api/generate-description with prompt:", description);
      const response = await axios.post("/api/generate-description", {
        prompt: description
      });
      console.log("API response:", response.data);
      if (response.data.generatedText) {
        setDescription(response.data.generatedText);
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
    const name = businessName.trim();
    const type = businessType.trim();
    const services = selectedServices.length > 0 ? selectedServices.join(", ") : "various services";
    if (name && type) {
      setDescription(`${name} is a ${type.toLowerCase()} offering ${services}.`);
    } else if (name) {
      setDescription(`${name} offers ${services}.`);
    } else {
      setDescription(`We offer ${services}.`);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setPhone(profile.phone ?? "");
        setEmail(profile.email ?? "");
        setWebsite(profile.website ?? "");
        setLocation(profile.address ?? "");
        setMarket(profile.market ?? ""); // Load market from profile
        // Clean up services array when loading from database
        let servicesArr = [];
        if (Array.isArray(profile.services)) {
          servicesArr = profile.services.map((service: any) => 
            typeof service === 'string' ? service : JSON.stringify(service)
          ).filter(Boolean);
        } else if (typeof profile.services === 'string') {
          try {
            const parsed = JSON.parse(profile.services);
            servicesArr = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            servicesArr = profile.services.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        setSelectedServices(servicesArr);
        setBusinessName(profile.business_name ?? "");
        setBusinessType(profile.business_type ?? "");
        setRegistrationNumber(profile.registration_number ?? "");
        setDescription(profile.description ?? "");
        setFacebook(profile.facebook ?? "");
        setInstagram(profile.instagram ?? "");
        setWhatsapp(profile.whatsapp ?? "");
        if (profile.logo_url) setLogoPreview(profile.logo_url);
      }
    };
    loadProfile();
  }, [user, loading, authChecked]); // Added authChecked to keep size consistent

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
    if (!businessType) return SERVICE_CATEGORIES.default;
    return SERVICE_CATEGORIES[businessType as keyof typeof SERVICE_CATEGORIES] || SERVICE_CATEGORIES.default;
  }, [businessType]);

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
                    <img src={logoPreview} alt="Logo Preview" className="w-24 h-24 object-cover rounded border shadow-sm" />
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
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                  >
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              {businessType === "Market" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Location</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
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
                  <div className="flex flex-wrap gap-2">
                    {getServiceOptions().map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleServiceChange(service)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedServices.includes(service)
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generating}
                      className="px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {generating ? 'Generating...' : 'Generate with AI'}
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
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={website} 
                    onChange={e => setWebsite(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
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
                    value={facebook} 
                    onChange={e => setFacebook(e.target.value)} 
                    placeholder="Facebook URL or username" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-gray-900" 
                    value={instagram} 
                    onChange={e => setInstagram(e.target.value)} 
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