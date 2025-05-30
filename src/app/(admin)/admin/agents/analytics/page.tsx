"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../../../supabaseClient';
import { FaUserCheck, FaUserTimes, FaCalendarAlt } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

// Define proper types for agents analytics
interface AgentAnalytics {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  registrationsByMonth: {
    [key: string]: number;
  };
}

export default function AgentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AgentAnalytics>({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    registrationsByMonth: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchAgentAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch agents data
      const { data, error } = await supabase
        .from('agents')
        .select('*');
      
      if (error) throw error;
      
      // Process data for analytics
      if (data) {
        const active = data.filter(agent => agent.status === 'active').length;
        const inactive = data.length - active;
        
        // Process registration by month
        const registrationsByMonth: Record<string, number> = {};
        data.forEach(agent => {
          const date = new Date(agent.created_at);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          registrationsByMonth[monthYear] = (registrationsByMonth[monthYear] || 0) + 1;
        });
        
        setAnalytics({
          totalAgents: data.length,
          activeAgents: active,
          inactiveAgents: inactive,
          registrationsByMonth,
        });
      }
    } catch (error) {
      console.error('Error fetching agent analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentAnalytics();
  }, []);

  // Prepare chart data
  const statusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [analytics.activeAgents, analytics.inactiveAgents],
        backgroundColor: ['#4CAF50', '#FF5252'],
        borderWidth: 1,
      },
    ],
  };

  // Monthly registrations chart data
  const monthlyData = {
    labels: Object.keys(analytics.registrationsByMonth),
    datasets: [
      {
        label: 'Agent Registrations',
        data: Object.values(analytics.registrationsByMonth),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Analytics</h1>
      
      {loading ? (
        <div className="text-center py-10">Loading analytics...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaUserCheck className="text-blue-500 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Agents</h3>
                  <h2 className="text-2xl font-bold">{analytics.totalAgents}</h2>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <FaUserCheck className="text-green-500 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Active Agents</h3>
                  <h2 className="text-2xl font-bold">{analytics.activeAgents}</h2>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <FaUserTimes className="text-red-500 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Inactive Agents</h3>
                  <h2 className="text-2xl font-bold">{analytics.inactiveAgents}</h2>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Agent Status</h3>
              <div className="flex justify-center" style={{ height: '300px' }}>
                <Doughnut data={statusData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Monthly Registrations</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={monthlyData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0 } // Only show integer values
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
