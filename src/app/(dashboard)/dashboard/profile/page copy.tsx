"use client";
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/auth-context";
import axios from "axios";

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

const MARKET_LOCATIONS = [
  "Ariaria Market",
  "Ahia Ohuru (New Market)",
  "Cemetery Market",
  "Eziukwu Market",
  "Uratta Market",
  "Railway Market"
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
  const { user, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [market, setMarket] = useState(""); // Add market state
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

  const [customService, setCustomService] = useState("");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  const [croppingImage, setCroppingImage] = useState<string>("");

  const dropRef = useRef<HTMLDivElement>(null);

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

    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone,
        email,
        website,
        address: location,
        market, // Add market to update
        services: selectedServices,
        business_name: businessName,
        business_type: businessType,
        registration_number: registrationNumber,
        description,
        facebook,
        instagram,
        whatsapp,
        logo_url: logoPreview || null
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to update profile");
    } else {
      setSuccess("Profile updated!");
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
  }, [user, loading]);

  const getServiceOptions = useCallback(() => {
    if (!businessType) return SERVICE_CATEGORIES.default;
    return SERVICE_CATEGORIES[businessType as keyof typeof SERVICE_CATEGORIES] || SERVICE_CATEGORIES.default;
  }, [businessType]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <main className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-6 text-rose-600 flex items-center gap-2"><span>👤</span> Profile</h1>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Logo upload section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Logo</h2>
              <div
                ref={dropRef}
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                className="flex gap-3 mt-2 flex-wrap min-h-[104px] p-2 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
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
              <div className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP. Max 5MB.</div>
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
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Business Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name</label>
                  <input type="text" className="w-full p-2 border rounded" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select className="w-full p-2 border rounded" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              {businessType === "Market" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Market Location</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                  >
                    <option value="">Select market location</option>
                    {MARKET_LOCATIONS.map((marketName) => (
                      <option key={marketName} value={marketName}>{marketName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 mb-6">
                <div className="mb-2">
                  <h3 className="text-sm font-medium">Services Offered</h3>
                  <p className="text-sm text-gray-600">
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
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      className="flex-1 p-2 border rounded-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomService}
                      className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Selected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((service) => (
                          <span
                            key={service}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-sm"
                          >
                            {service}
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service)}
                              className="text-rose-500 hover:text-rose-700"
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
                  <label className="block text-sm font-medium mb-1">Business Description</label>
                  <p className="text-sm text-gray-600 mb-2">
                    Describe your business, what makes it unique, and what customers can expect. 
                    You can use our AI to help generate a description or auto-fill based on your information.
                  </p>
                </div>
                <div className="space-y-3">
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell customers about your business..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillDescription}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Contact Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="text" className="w-full p-2 border rounded" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input type="text" className="w-full p-2 border rounded" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input type="text" className="w-full p-2 border rounded" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>
            </div>
        
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Social Connects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook</label>
                  <input type="text" className="w-full p-2 border rounded" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL or username" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram</label>
                  <input type="text" className="w-full p-2 border rounded" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram URL or username" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp</label>
                  <input type="text" className="w-full p-2 border rounded" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp number or link" />
                </div>
              </div>
            </div>
           
            {success && (
  <div className="mb-4">
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="block">{success}</span>
    </div>
  </div>
)}
{error && <p className="text-red-600 mb-4">{error}</p>}
            <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded shadow transition-colors">Save</button>
          </form>
        </div>
      </main>
    </div>
  );
}
