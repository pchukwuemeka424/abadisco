'use client';

import { useState, useEffect } from 'react';
import { FaBoxes, FaChartLine, FaClock, FaFireAlt } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import { format } from 'date-fns';

interface CategoryStats {
  total_categories: number;
  active_categories: number;
  most_popular_category: string;
  most_popular_category_count: number;
  newest_category: string;
  newest_category_date: string;
}

export default function CategoryStats() {
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to call the stored function first
      const { data: functionData, error: functionError } = await supabase.rpc('get_business_categories_stats');

      if (functionError) {
        console.warn('Function call failed, calculating stats manually:', functionError);
        
        // Fallback: Calculate stats manually
        const { data: categories, error: categoriesError } = await supabase
          .from('business_categories')
          .select(`
            *,
            business_categories_stats (
              total_businesses
            )
          `);

        if (categoriesError) {
          throw new Error(categoriesError.message);
        }

        if (categories && categories.length > 0) {
          const totalCategories = categories.length;
          const activeCategories = categories.filter(cat => 
            cat.business_categories_stats?.[0]?.total_businesses > 0 || cat.count > 0
          ).length;

          // Find most popular category
          const mostPopular = categories.reduce((max, cat) => {
            const count = cat.business_categories_stats?.[0]?.total_businesses || cat.count || 0;
            const maxCount = max.business_categories_stats?.[0]?.total_businesses || max.count || 0;
            return count > maxCount ? cat : max;
          });

          // Find newest category
          const newest = categories.reduce((latest, cat) => {
            return new Date(cat.created_at) > new Date(latest.created_at) ? cat : latest;
          });

          const manualStats: CategoryStats = {
            total_categories: totalCategories,
            active_categories: activeCategories,
            most_popular_category: mostPopular.title,
            most_popular_category_count: mostPopular.business_categories_stats?.[0]?.total_businesses || mostPopular.count || 0,
            newest_category: newest.title,
            newest_category_date: newest.created_at
          };

          setStats(manualStats);
        } else {
          // No categories found
          setStats({
            total_categories: 0,
            active_categories: 0,
            most_popular_category: 'None',
            most_popular_category_count: 0,
            newest_category: 'None',
            newest_category_date: ''
          });
        }
      } else {
        // Use the function data if available
        if (functionData) {
          // Handle both object and array responses
          const statsData = Array.isArray(functionData) ? functionData[0] : functionData;
          setStats(statsData as CategoryStats);
        }
      }
    } catch (err) {
      console.error('Error fetching category stats:', err);
      setError('Failed to load category statistics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-md h-32">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaFireAlt className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchCategoryStats}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Categories",
      value: stats.total_categories,
      icon: <FaBoxes className="text-blue-500 text-3xl" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Active Categories",
      value: stats.active_categories,
      icon: <FaChartLine className="text-green-500 text-3xl" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Most Popular",
      value: stats.most_popular_category,
      subvalue: `${stats.most_popular_category_count} businesses`,
      icon: <FaFireAlt className="text-orange-500 text-3xl" />,
      color: "bg-orange-50 border-orange-200",
    },
    {
      title: "Newest Category",
      value: stats.newest_category,
      subvalue: stats.newest_category_date ? format(new Date(stats.newest_category_date), "MMM dd, yyyy") : "N/A",
      icon: <FaClock className="text-purple-500 text-3xl" />,
      color: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((card, index) => (
        <div 
          key={index}
          className={`${card.color} p-4 rounded-lg shadow-sm border`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
              <p className="mt-2 text-2xl font-semibold text-gray-900 truncate">{card.value}</p>
              {card.subvalue && (
                <p className="text-xs text-gray-500">{card.subvalue}</p>
              )}
            </div>
            <div className="p-3 rounded-full">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}