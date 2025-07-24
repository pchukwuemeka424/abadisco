import React from 'react';

interface Product {
  id: string;
  title: string;
  image_urls: string | null;
  owner_id: string;
  created_at: string;
  category_id: number | null;
  market_id: string | null;
  category_name?: string;
  market_name?: string;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  error?: string | null;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, loading, error }) => {
  if (loading) return <div className="py-10 text-center text-lg">Loading...</div>;
  if (error) return <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>;
  if (!products.length) return <div className="py-10 text-center text-gray-500">No products found.</div>;
  return (
    <div className="overflow-x-auto rounded-xl shadow border border-slate-100 bg-white">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3 text-left text-xs font-semibold text-slate-500">Image</th>
            <th className="p-3 text-left text-xs font-semibold text-slate-500">Title</th>
            <th className="p-3 text-left text-xs font-semibold text-slate-500">Category</th>
            <th className="p-3 text-left text-xs font-semibold text-slate-500">Market</th>
            <th className="p-3 text-left text-xs font-semibold text-slate-500">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-3">
                {product.image_urls ? (
                  <img src={product.image_urls.split(',')[0]} alt={product.title} className="w-14 h-14 object-cover rounded-lg border" />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </td>
              <td className="p-3 font-medium text-slate-800">{product.title}</td>
              <td className="p-3">{product.category_name}</td>
              <td className="p-3">{product.market_name}</td>
              <td className="p-3 text-xs text-slate-500">{new Date(product.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable; 