'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/supabaseClient';

export default function CategoryViewTracker({ categoryId }: { categoryId: number }) {
  const pathname = usePathname();

  useEffect(() => {
    const trackCategoryView = async () => {
      if (!categoryId) return;
      
      try {
        // Call the RPC function to increment the view count
        const { error } = await supabase.rpc('increment_category_view', {
          p_category_id: categoryId
        });
        
        if (error) {
          console.error('Error tracking category view:', error);
        }
      } catch (err) {
        console.error('Failed to track category view:', err);
      }
    };
    
    // Track the view when the component mounts
    trackCategoryView();
    
    // We won't track again on unmount to avoid duplicate counts
  }, [categoryId, pathname]); // Re-run when category ID or path changes

  // This is an invisible tracking component
  return null;
}