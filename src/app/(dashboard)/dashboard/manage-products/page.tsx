"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { FaSearch, FaPlus, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

interface Product {
  id: string;
  user_id: string;
  created_at: string;
  image_urls: string;
  tags: string[];
}

export default function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User not logged in", userError);
        return;
      }

      // Get total count
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setTotal(count || 0);

      // Fetch paginated data
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("products")
        .select("id, user_id, created_at, image_urls")
        .eq("user_id", user.id)
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Refresh the products list
      await fetchProducts();
      // Update total count
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Filter products by search (client-side)
  const filteredProducts = products.filter((product) => {
    const searchLower = search.toLowerCase();
    return (
      product.user_id?.toLowerCase().includes(searchLower) ||
      product.image_urls?.toLowerCase().includes(searchLower) ||
      product.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-rose-50">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500 flex items-center gap-2">
            <a href="/dashboard" className="hover:text-rose-600 transition-colors">Dashboard</a>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Manage Products</span>
          </nav>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="p-2 bg-rose-100 rounded-xl">🗂️</span>
                Manage Products
              </h1>
              <p className="mt-1 text-gray-600">Manage and organize your product listings</p>
            </div>
            <a 
              href="/dashboard/upload-products" 
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <FaPlus className="text-sm" />
              Add New Product
            </a>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products by tags or URL..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Total Products: <span className="font-medium text-gray-900">{total}</span>
              </p>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-100" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex border-t border-gray-200 p-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/logo.svg" alt="No products" className="w-12 h-12 opacity-30" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-6">
                {search ? "Try adjusting your search terms" : "Start by adding your first product"}
              </p>
              {!search && (
                <a 
                  href="/dashboard/upload-products"
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <FaPlus className="text-sm" />
                  Add Your First Product
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Image</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Tags</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Created At</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="relative w-16 h-16">
                            <img 
                              src={product.image_urls} 
                              alt="Product" 
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.tags?.map((tag: string, i: number) => (
                              <span 
                                key={i}
                                className="px-2 py-1 text-xs bg-rose-50 text-rose-600 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={product.image_urls}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                              title="View Image"
                            >
                              <FaExternalLinkAlt size={14} />
                            </a>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleting === product.id}
                              className="p-2 text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50"
                              title="Delete Product"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          p === page
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
