'use client';

import { useState, useEffect } from 'react';
import { supabase, checkEnvironmentSetup } from '@/supabaseClient';

export default function DebugPage() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  useEffect(() => {
    // Check environment setup
    const envCheck = checkEnvironmentSetup();
    setEnvStatus(envCheck);

    // Test connection
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('Testing connection from browser...');
      
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .limit(1);

      setConnectionTest({
        success: !error,
        data: data,
        error: error,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      setConnectionTest({
        success: false,
        error: err,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Debug: Environment & Connection</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(envStatus, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Connection Test</h2>
          <button 
            onClick={testConnection}
            className="mb-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Connection Again
          </button>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(connectionTest, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Browser Environment Check</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
            <p><strong>URL Preview:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
