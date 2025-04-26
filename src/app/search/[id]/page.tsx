import Image from 'next/image';
import { supabase } from '@/supabaseClient';

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  // Fetch business/user from Supabase users table
  const { data: business, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  // Fetch gallery images from products table
  const { data: products } = await supabase
    .from('products')
    .select('image_urls')
    .eq('user_id', params.id);

  if (error || !business) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-red-600">Business not found.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <div className="w-full relative h-64 md:h-96">
        <Image
          src={products && products.length > 0 ? products[0].image_urls : '/images/logo.png'}
          alt={business.business_name || 'Business banner'}
          fill
          className="object-cover w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        <div className="absolute bottom-0 left-0 w-full px-4 py-6 md:py-10">
          <div className="max-w-5xl mx-auto text-white">
            {business.logo_url && (
              <div className="mb-4 relative w-24 h-24">
                <Image
                  src={business.logo_url}
                  alt={`${business.business_name} logo`}
                  fill
                  className="object-contain bg-white/10 backdrop-blur-sm rounded-lg p-1"
                  sizes="96px"
                />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{business.business_name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm drop-shadow">
              <span className="bg-white/20 px-3 py-1 rounded-full">{business.business_type}</span>
              <span className={`px-3 py-1 rounded-full ${business.status === 'Now Open' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>{business.status || 'Status'}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">{business.price || '$$'}</span>
              <span className="flex items-center gap-1">
                {/* Rating stars if available */}
                <span className="ml-2">({business.reviews || 0} Reviews)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 px-4">
        {/* Left/Main column */}
        <div className="md:col-span-2">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Description</h2>
            <p className="text-gray-600 text-sm">{business.description}</p>
          </div>
          {/* Gallery */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products && products.length > 0 ? (
                products.map((product, i) => (
                  <div key={i} className="relative h-32 w-full rounded overflow-hidden bg-gray-100">
                    <Image src={product.image_urls} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                  </div>
                ))
              ) : (
                <div className="text-gray-400 col-span-2 md:col-span-3">No gallery images available.</div>
              )}
            </div>
          </div>
          {/* Services */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Services</h2>
            <ul className="flex flex-wrap gap-2">
              {(() => {
                let servicesList: string[] = [];
                if (business.services) {
                  if (Array.isArray(business.services)) {
                    servicesList = business.services;
                  } else if (typeof business.services === 'string') {
                    try {
                      // Try parsing as JSON first
                      const parsed = JSON.parse(business.services);
                      servicesList = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                      // If not JSON, treat as comma-separated string
                      servicesList = business.services.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                  }
                }
                return servicesList.length > 0 ? (
                  servicesList.map((service, i) => (
                    <li key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                      {service}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No services listed</li>
                );
              })()}
            </ul>
          </div>
          {/* Reviews/Comments */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Leave a Comment</h2>
            <form className="space-y-3">
              <input type="text" placeholder="Your name" className="w-full border rounded p-2" />
              <input type="email" placeholder="Email address" className="w-full border rounded p-2" />
              <textarea placeholder="Comment" className="w-full border rounded p-2" rows={3}></textarea>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Send Message</button>
            </form>
          </div>
        </div>
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {business.address}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {business.phone}
              </div>
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Website
              </a>
            </div>
          </div>
          {/* Social Links */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Contact & Social</h2>
            <div className="flex gap-4">
              <a href={business.facebook || '#'} className="text-blue-600 hover:text-blue-800" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 5 3.657 9.127 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.127 22 17 22 12z" /></svg>
              </a>
              <a href={business.instagram || '#'} className="text-pink-500 hover:text-pink-700" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a5.25 5.25 0 1 1 0 10.5a5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5zm5.25 1.25a1 1 0 1 1-2 0a1 1 0 0 1 2 0z" /></svg>
              </a>
              <a href={business.linkedin || '#'} className="text-blue-700 hover:text-blue-900" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.844-1.563 3.043 0 3.604 2.004 3.604 4.609v5.587z" /></svg>
              </a>
              <a href={business.youtube || '#'} className="text-red-600 hover:text-red-800" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.545 3.5 12 3.5 12 3.5s-7.545 0-9.386.574a2.994 2.994 0 0 0-2.112 2.112C0.5 8.027 0.5 12 0.5 12s0 3.973.574 5.814a2.994 2.994 0 0 0 2.112 2.112C4.455 20.5 12 20.5 12 20.5s7.545 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C23.5 15.973 23.5 12 23.5 12s0-3.973-.002-5.814zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" /></svg>
              </a>
            </div>
          </div>
          {/* Newsletter */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-1">Subscribe newsletter</h3>
            <p className="text-gray-600 text-sm mb-2">Subscribe our newsletter to get updates about our services and offers.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Enter your email" className="border rounded p-2 flex-1" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Subscribe</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}