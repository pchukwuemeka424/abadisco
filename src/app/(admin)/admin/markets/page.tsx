'use client';

import { useState, useEffect } from 'react';
import { supabase, checkEnvironmentSetup } from '@/supabaseClient';
import MarketTable from '../components/MarketTable';
import MarketModal from '../components/MarketModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';

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
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  // Modal states
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch markets on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Function to check Supabase connection and configuration
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      setError(null);

      console.log('Starting connection check...');

      // Test connection directly - simplest possible approach
      const { data, error: testError } = await supabase
        .from('markets')
        .select('*')
        .limit(1);

      console.log('Database query result:', { data, error: testError });

      if (testError) {
        console.error('Database error details:', testError);
        
        // Handle specific error cases
        if (testError.message?.includes('relation "public.markets" does not exist')) {
          throw new Error('Markets table not found. Please run the markets_table.sql script first.');
        } else if (testError.message?.includes('Failed to fetch')) {
          throw new Error('Database connection failed. Please check your Supabase configuration and internet connection.');
        } else if (testError.message?.includes('permission')) {
          throw new Error('Permission denied. Please run the fix-markets-permissions.sql script.');
        } else {
          const errorMessage = testError.message || 'Unknown database error';
          const errorCode = testError.code || 'UNKNOWN';
          throw new Error(`Database error: ${errorMessage} (Code: ${errorCode})`);
        }
      }

      console.log('Database connection successful, found', data?.length || 0, 'markets');
      setConnectionStatus('connected');
      fetchMarkets();
    } catch (err: any) {
      console.error('Connection check failed:', err);
      setConnectionStatus('error');
      setError(err.message || 'Unknown connection error occurred');
      setIsLoading(false);
    }
  };

  // Function to fetch markets from the database
  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all markets with error handling
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('name');

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Markets table not found in database. Please run the markets_table.sql script first.');
        } else if (error.code === 'PGRST301') {
          throw new Error('Permission denied. Please check your database permissions or run the fix-markets-permissions.sql script.');
        } else {
          throw error;
        }
      }
      
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
      setError(null);
      
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', currentMarket.id);
        
      if (error) {
        if (error.code === 'PGRST301') {
          throw new Error('Permission denied. Please check your database permissions or contact your administrator.');
        } else if (error.code === '42501') {
          throw new Error('Insufficient permissions to delete markets. Please run the fix-markets-permissions.sql script.');
        } else if (error.code === '23503') {
          throw new Error('Cannot delete this market because it has associated businesses. Please remove all businesses from this market first.');
        }
        throw error;
      }
      
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
          {connectionStatus === 'checking' && (
            <div className="flex items-center mt-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">Checking connection...</span>
            </div>
          )}
          {connectionStatus === 'connected' && (
            <div className="flex items-center mt-2 text-green-600">
              <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm">Connected to database</span>
            </div>
          )}
        </div>
        <button
          onClick={handleAddMarket}
          disabled={connectionStatus !== 'connected'}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FaPlus size={14} /> Add Market
        </button>
      </div>

      {connectionStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="font-medium mb-2">Database Connection Error</p>
              <p className="mb-4">{error}</p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root</li>
                  <li>Add your Supabase credentials (see <code className="bg-red-100 px-1 rounded">.env.local.example</code>)</li>
                  <li>Run the <code className="bg-red-100 px-1 rounded">fix-markets-permissions.sql</code> script in your Supabase dashboard</li>
                  <li>Restart your development server</li>
                </ol>
              </div>
              <button
                onClick={checkConnection}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {error && connectionStatus === 'connected' && (
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