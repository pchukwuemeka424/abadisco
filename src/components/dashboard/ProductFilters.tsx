import React from 'react';

interface Category {
  id: number;
  title: string;
}

interface Market {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  markets: Market[];
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  marketFilter: string;
  setMarketFilter: (val: string) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  markets,
  categoryFilter,
  setCategoryFilter,
  marketFilter,
  setMarketFilter,
}) => (
  <div className="flex flex-wrap gap-4 mb-6 items-center">
    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 border rounded">
      <option value="all">All Categories</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.title}</option>
      ))}
    </select>
    <select value={marketFilter} onChange={e => setMarketFilter(e.target.value)} className="p-2 border rounded">
      <option value="all">All Markets</option>
      {markets.map(mkt => (
        <option key={mkt.id} value={mkt.id}>{mkt.name}</option>
      ))}
    </select>
    <a href="/dashboard/upload-products" className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium">Add Product</a>
  </div>
);

export default ProductFilters; 