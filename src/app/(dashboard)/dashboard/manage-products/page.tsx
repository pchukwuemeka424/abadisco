"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductTable from '@/components/dashboard/ProductTable';
import ProductFilters from '@/components/dashboard/ProductFilters';

interface Product {
  id: string;
  title: string;
  image_urls: string | null;
  owner_id: string;
  created_at: string;
  category_id: number | null;
  market_id: string | null;
  // Add more fields as needed from your products table
  category_name?: string;
  market_name?: string;
}

interface Category {
  id: number;
  title: string;
}

interface Market {
  id: string;
  name: string;
}

export default function ManageProducts() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const fetchAll = async () => {
      try {
        // Fetch categories
        const { data: catData, error: catErr } = await supabase
          .from('business_categories')
          .select('id, title')
          .order('title');
        if (catErr) throw new Error('Error fetching categories: ' + catErr.message);
        setCategories(catData || []);

        // Fetch markets
        const { data: marketData, error: marketErr } = await supabase
          .from('markets')
          .select('id, name')
          .order('name');
        if (marketErr) throw new Error('Error fetching markets: ' + marketErr.message);
        setMarkets(marketData || []);

        // Fetch products
        let query = supabase
          .from('products')
          .select('*')
          .eq('owner_id', user.id);
        if (categoryFilter !== 'all') {
          query = query.eq('category_id', categoryFilter);
        }
        if (marketFilter !== 'all') {
          query = query.eq('market_id', marketFilter);
        }
        const { data: prodData, error: prodErr } = await query;
        if (prodErr) throw new Error('Error fetching products: ' + prodErr.message);
        // Attach category and market names
        const productsWithNames = (prodData || []).map((prod: Product) => ({
          ...prod,
          category_name: catData?.find((c) => c.id === prod.category_id)?.title || 'Uncategorized',
          market_name: marketData?.find((m) => m.id === prod.market_id)?.name || 'No Market',
        }));
        setProducts(productsWithNames);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, categoryFilter, marketFilter]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>
      <ProductFilters
        categories={categories}
        markets={markets}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        marketFilter={marketFilter}
        setMarketFilter={setMarketFilter}
      />
      <ProductTable
        products={products}
        loading={loading}
        error={error}
      />
    </div>
  );
}