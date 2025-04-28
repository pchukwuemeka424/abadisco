'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaSpinner, FaChartBar, FaUsers, FaBullseye, FaCheckCircle } from 'react-icons/fa';

interface AgentAnalytics {
  id: string;
  full_name: string;
  email: string;
  status: string;
  weekly_target: number;
  current_week_registrations: number;
  total_registrations: number;
  total_businesses: number; // Assuming you might track businesses listed by agents
  weekly_target_met: boolean;
  created_at: string;
}

export default function AgentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AgentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalAgents: 0,
    activeAgents: 0,
    pendingAgents: 0,
    suspendedAgents: 0,
    totalRegistrationsThisWeek: 0,
    totalRegistrationsOverall: 0,
    averageWeeklyTarget: 0,
    agentsMeetingTarget: 0,
  });

  useEffect(() => {
    fetchAgentAnalytics();
  }, []);

  async function fetchAgentAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agents')
        .select('*') // Select all columns needed for analytics
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const agentData = data || [];
      setAnalytics(agentData);
      calculateSummary(agentData);

    } catch (err: any) {
      console.error('Error fetching agent analytics:', err);
      setError('Failed to load agent analytics. ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateSummary(data: AgentAnalytics[]) {
    const totalAgents = data.length;
    const activeAgents = data.filter(a => a.status === 'active').length;
    const pendingAgents = data.filter(a => a.status === 'pending').length;
    const suspendedAgents = data.filter(a => a.status === 'suspended').length;
    const totalRegistrationsThisWeek = data.reduce((sum, a) => sum + (a.current_week_registrations || 0), 0);
    const totalRegistrationsOverall = data.reduce((sum, a) => sum + (a.total_registrations || 0), 0);
    const totalWeeklyTarget = data.reduce((sum, a) => sum + (a.weekly_target || 0), 0);
    const averageWeeklyTarget = totalAgents > 0 ? Math.round(totalWeeklyTarget / totalAgents) : 0;
    const agentsMeetingTarget = data.filter(a => a.weekly_target_met).length;

    setSummary({
      totalAgents,
      activeAgents,
      pendingAgents,
      suspendedAgents,
      totalRegistrationsThisWeek,
      totalRegistrationsOverall,
      averageWeeklyTarget,
      agentsMeetingTarget,
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'suspended': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <FaChartBar className="mr-3 text-blue-600" /> Agent Analytics & Progress
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Total Agents" value={summary.totalAgents} icon={<FaUsers />} />
        <SummaryCard title="Active Agents" value={summary.activeAgents} icon={<FaUsers className="text-green-500" />} />
        <SummaryCard title="Weekly Registrations" value={summary.totalRegistrationsThisWeek} icon={<FaUsers />} />
        <SummaryCard title="Total Registrations" value={summary.totalRegistrationsOverall} icon={<FaUsers />} />
        <SummaryCard title="Avg. Weekly Target" value={summary.averageWeeklyTarget} icon={<FaBullseye />} />
        <SummaryCard title="Agents Meeting Target" value={`${summary.agentsMeetingTarget} / ${summary.activeAgents}`} icon={<FaCheckCircle className="text-green-500" />} />
        <SummaryCard title="Pending Agents" value={summary.pendingAgents} icon={<FaUsers className="text-yellow-500" />} />
        <SummaryCard title="Suspended Agents" value={summary.suspendedAgents} icon={<FaUsers className="text-red-500" />} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin h-10 w-10 mx-auto text-blue-600" />
          <p className="mt-3 text-gray-600">Loading analytics data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Registrations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Businesses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.length > 0 ? (
                  analytics.map((agent) => (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.full_name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          agent.status === 'active' ? 'bg-green-100 text-green-800' :
                          agent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.current_week_registrations} / {agent.weekly_target}
                        {agent.weekly_target_met && <FaCheckCircle className="inline ml-1 text-green-500" title="Target Met" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.total_registrations}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.total_businesses || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No agent data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple component for summary cards
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
      <div className="text-3xl text-blue-500">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
