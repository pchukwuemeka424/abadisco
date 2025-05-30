'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import MarketTable from '../components/MarketTable';
import MarketModal from '../components/MarketModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { FaPlus } from 'react-icons/fa';

interface Market {
  id: string;
  name: string;
  location: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch markets on component mount
  useEffect(() => {
    fetchMarkets();
  }, []);

  // Function to fetch markets from the database
  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('markets')
        .select('id')
        .limit(1);
        
      if (tableError) {
        if (tableError.code === '42P01') { // Table doesn't exist
          setError('Markets table not found in database. Please run the markets_table.sql script first.');
          return;
        }
        throw tableError;
      }

      // Get all markets
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setMarkets(data || []);
    } catch (err: any) {
      console.error('Error fetching markets:', err);
      setError(`Failed to fetch markets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle editing a market
  const handleEditMarket = (market: Market) => {
    setCurrentMarket(market);
    setIsMarketModalOpen(true);
  };

  // Function to handle adding a new market
  const handleAddMarket = () => {
    setCurrentMarket(null);
    setIsMarketModalOpen(true);
  };

  // Function to handle deleting a market
  const handleDeleteMarket = (market: Market) => {
    setCurrentMarket(market);
    setIsDeleteModalOpen(true);
  };

  // Function to confirm and process market deletion
  const confirmDeleteMarket = async () => {
    if (!currentMarket) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', currentMarket.id);
        
      if (error) throw error;
      
      // Remove the deleted market from the state
      setMarkets(markets.filter(m => m.id !== currentMarket.id));
      
      // Close the delete confirmation modal
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error('Error deleting market:', err);
      // Improved error handling to ensure we always have a meaningful message
      const errorMessage = err.message || (err.details ? err.details : 'Unknown error occurred');
      setError(`Failed to delete market: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Markets</h1>
          <p className="text-gray-600 mt-1">
            Manage the markets available in Aba
          </p>
        </div>
        <button
          onClick={handleAddMarket}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FaPlus size={14} /> Add Market
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <MarketTable
        markets={markets}
        isLoading={isLoading}
        onEdit={handleEditMarket}
        onDelete={handleDeleteMarket}
        refreshData={fetchMarkets}
      />

      {/* Market Add/Edit Modal */}
      <MarketModal
        market={currentMarket}
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        onSave={fetchMarkets}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMarket}
        title="Delete Market"
        message={`Are you sure you want to delete ${currentMarket?.name || 'this market'}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}