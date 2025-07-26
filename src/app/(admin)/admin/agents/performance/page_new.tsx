'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { 
  FiUsers, FiTrendingUp, FiTrendingDown, FiCalendar, FiFilter, FiSearch,
  FiDownload, FiRefreshCw, FiEye, FiStar, FiClock, FiCheckCircle,
  FiTarget, FiDollarSign, FiAward, FiActivity, FiBarChart, FiPieChart
} from 'react-icons/fi';

// Enhanced Types
interface Agent {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: 'active' | 'inactive' | 'suspended';
  weekly_target?: number;
  department?: string;
  hire_date?: string;
  avatar?: string;
}

interface PerformanceMetrics {
  agent_id: string;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
  
  // Core Performance
  tasks_completed: number;
  tasks_pending: number;
  tasks_failed: number;
  completion_rate: number;
  
  // Registrations
  business_registrations: number;
  user_registrations: number;
  
  // Quality Metrics
  avg_response_time: number;
  customer_satisfaction: number;
  quality_score: number;
  
  // Financial
  revenue_generated: number;
  commission_earned: number;
  
  // Targets
  weekly_target: number;
  monthly_target: number;
  target_achievement: number;
  
  // Trends
  weekly_change: number;
  monthly_change: number;
  performance_trend: 'up' | 'down' | 'stable';
  
  // Activity Timeline
  daily_activity: Array<{
    date: string;
    tasks: number;
    revenue: number;
  }>;
  
  // Rankings
  rank_overall: number;
  rank_department: number;
}

interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_tasks_completed: number;
  total_revenue: number;
  avg_completion_rate: number;
  top_performer: string;
  improvement_rate: number;
}

export default function AgentPerformanceDashboard() {
  // State Management
  const [agents, setAgents] = useState<Agent[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedAgent, setSelectedAgent] = useState<PerformanceMetrics | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'analytics'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'completion_rate' | 'revenue' | 'tasks'>('completion_rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Color scheme for charts
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6',
    indigo: '#6366F1',
    pink: '#EC4899'
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAgentsData();
  }, [selectedTimeframe]);

  // Generate mock data for demonstration
  const generateMockData = (): { agents: Agent[], metrics: PerformanceMetrics[] } => {
    const departments = ['Sales', 'Support', 'Business Development', 'Customer Success'];
    const statuses: Array<'active' | 'inactive' | 'suspended'> = ['active', 'inactive', 'suspended'];
    
    const mockAgents: Agent[] = Array.from({ length: 12 }, (_, i) => ({
      id: `agent-${i + 1}`,
      user_id: `user-${i + 1}`,
      email: `agent${i + 1}@abadisco.com`,
      full_name: `Agent ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      weekly_target: 20 + Math.floor(Math.random() * 30),
      department: departments[Math.floor(Math.random() * departments.length)],
      hire_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Agent${i + 1}`
    }));

    const mockMetrics: PerformanceMetrics[] = mockAgents.map((agent, i) => {
      const tasks_completed = Math.floor(Math.random() * 50) + 10;
      const tasks_pending = Math.floor(Math.random() * 20) + 5;
      const tasks_failed = Math.floor(Math.random() * 5);
      const total_tasks = tasks_completed + tasks_pending + tasks_failed;
      
      return {
        agent_id: agent.id,
        name: agent.full_name,
        email: agent.email,
        avatar: agent.avatar,
        department: agent.department,
        tasks_completed,
        tasks_pending,
        tasks_failed,
        completion_rate: (tasks_completed / total_tasks) * 100,
        business_registrations: Math.floor(Math.random() * 15) + 2,
        user_registrations: Math.floor(Math.random() * 30) + 5,
        avg_response_time: Math.random() * 2 + 0.5,
        customer_satisfaction: Math.random() * 2 + 3,
        quality_score: Math.random() * 2 + 3,
        revenue_generated: Math.floor(Math.random() * 50000) + 10000,
        commission_earned: Math.floor(Math.random() * 5000) + 1000,
        weekly_target: agent.weekly_target || 25,
        monthly_target: (agent.weekly_target || 25) * 4,
        target_achievement: ((tasks_completed / (agent.weekly_target || 25)) * 100),
        weekly_change: (Math.random() - 0.5) * 40,
        monthly_change: (Math.random() - 0.5) * 60,
        performance_trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        daily_activity: Array.from({ length: 7 }, (_, day) => ({
          date: new Date(Date.now() - (6 - day) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tasks: Math.floor(Math.random() * 8) + 2,
          revenue: Math.floor(Math.random() * 2000) + 500
        })),
        rank_overall: i + 1,
        rank_department: Math.floor(Math.random() * 5) + 1
      };
    });

    return { agents: mockAgents, metrics: mockMetrics };
  };

  // Fetch agents and performance data
  const fetchAgentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data first
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('full_name');

      if (agentsError || !agentsData || agentsData.length === 0) {
        console.warn('Using mock data for demonstration');
        const mockData = generateMockData();
        setAgents(mockData.agents);
        setPerformanceData(mockData.metrics);
        calculateDashboardStats(mockData.metrics);
      } else {
        setAgents(agentsData);
        // Fetch performance metrics for real agents
        await fetchPerformanceMetrics(agentsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Using demo data instead.');
      const mockData = generateMockData();
      setAgents(mockData.agents);
      setPerformanceData(mockData.metrics);
      calculateDashboardStats(mockData.metrics);
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance metrics for agents
  const fetchPerformanceMetrics = async (agentsList: Agent[]) => {
    // In a real app, this would fetch from performance tables
    // For now, generate realistic metrics
    const metrics = agentsList.map((agent, index) => {
      const tasks_completed = Math.floor(Math.random() * 50) + 10;
      const tasks_pending = Math.floor(Math.random() * 20) + 5;
      const tasks_failed = Math.floor(Math.random() * 5);
      const total_tasks = tasks_completed + tasks_pending + tasks_failed;
      
      return {
        agent_id: agent.id,
        name: agent.full_name,
        email: agent.email,
        avatar: agent.avatar,
        department: agent.department,
        tasks_completed,
        tasks_pending,
        tasks_failed,
        completion_rate: (tasks_completed / total_tasks) * 100,
        business_registrations: Math.floor(Math.random() * 15) + 2,
        user_registrations: Math.floor(Math.random() * 30) + 5,
        avg_response_time: Math.random() * 2 + 0.5,
        customer_satisfaction: Math.random() * 2 + 3,
        quality_score: Math.random() * 2 + 3,
        revenue_generated: Math.floor(Math.random() * 50000) + 10000,
        commission_earned: Math.floor(Math.random() * 5000) + 1000,
        weekly_target: agent.weekly_target || 25,
        monthly_target: (agent.weekly_target || 25) * 4,
        target_achievement: ((tasks_completed / (agent.weekly_target || 25)) * 100),
        weekly_change: (Math.random() - 0.5) * 40,
        monthly_change: (Math.random() - 0.5) * 60,
        performance_trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        daily_activity: Array.from({ length: 7 }, (_, day) => ({
          date: new Date(Date.now() - (6 - day) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tasks: Math.floor(Math.random() * 8) + 2,
          revenue: Math.floor(Math.random() * 2000) + 500
        })),
        rank_overall: index + 1,
        rank_department: Math.floor(Math.random() * 5) + 1
      } as PerformanceMetrics;
    });

    setPerformanceData(metrics);
    calculateDashboardStats(metrics);
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (metrics: PerformanceMetrics[]) => {
    const stats: DashboardStats = {
      total_agents: metrics.length,
      active_agents: metrics.filter(m => m.completion_rate > 60).length,
      total_tasks_completed: metrics.reduce((sum, m) => sum + m.tasks_completed, 0),
      total_revenue: metrics.reduce((sum, m) => sum + m.revenue_generated, 0),
      avg_completion_rate: metrics.reduce((sum, m) => sum + m.completion_rate, 0) / metrics.length,
      top_performer: metrics.sort((a, b) => b.completion_rate - a.completion_rate)[0]?.name || 'N/A',
      improvement_rate: metrics.filter(m => m.performance_trend === 'up').length / metrics.length * 100
    };

    setDashboardStats(stats);
  };

  // Filter and sort performance data
  const filteredAndSortedData = useMemo(() => {
    let filtered = performanceData.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           metric.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || metric.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && metric.completion_rate > 60) ||
                           (statusFilter === 'inactive' && metric.completion_rate <= 60);

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'completion_rate':
          aValue = a.completion_rate;
          bValue = b.completion_rate;
          break;
        case 'revenue':
          aValue = a.revenue_generated;
          bValue = b.revenue_generated;
          break;
        case 'tasks':
          aValue = a.tasks_completed;
          bValue = b.tasks_completed;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [performanceData, searchQuery, departmentFilter, statusFilter, sortBy, sortOrder]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deps = new Set(performanceData.map(p => p.department).filter(Boolean));
    return Array.from(deps);
  }, [performanceData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Render dashboard stats cards
  const renderStatsCards = () => {
    if (!dashboardStats) return null;

    const cards = [
      {
        title: 'Total Agents',
        value: dashboardStats.total_agents,
        icon: FiUsers,
        color: colors.primary,
        change: '+12%'
      },
      {
        title: 'Active Agents',
        value: dashboardStats.active_agents,
        icon: FiCheckCircle,
        color: colors.success,
        change: '+8%'
      },
      {
        title: 'Tasks Completed',
        value: dashboardStats.total_tasks_completed,
        icon: FiTarget,
        color: colors.purple,
        change: '+15%'
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(dashboardStats.total_revenue),
        icon: FiDollarSign,
        color: colors.warning,
        change: '+23%'
      },
      {
        title: 'Avg Completion Rate',
        value: formatPercentage(dashboardStats.avg_completion_rate),
        icon: FiBarChart3,
        color: colors.teal,
        change: '+5%'
      },
      {
        title: 'Top Performer',
        value: dashboardStats.top_performer,
        icon: FiAward,
        color: colors.indigo,
        change: 'New'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="flex items-center mt-2">
                  <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{card.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${card.color}20` }}>
                <card.icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render performance chart
  const renderPerformanceChart = () => {
    const chartData = filteredAndSortedData.slice(0, 10).map(agent => ({
      name: agent.name.split(' ')[0],
      completed: agent.tasks_completed,
      pending: agent.tasks_pending,
      revenue: agent.revenue_generated / 1000
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <div className="flex space-x-2">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === period
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="completed" fill={colors.success} name="Completed Tasks" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill={colors.warning} name="Pending Tasks" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render revenue chart
  const renderRevenueChart = () => {
    const revenueData = filteredAndSortedData.slice(0, 8).map(agent => ({
      name: agent.name.split(' ')[0],
      revenue: agent.revenue_generated / 1000,
      commission: agent.commission_earned / 1000
    }));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Performance</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [`₦${value}K`, '']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1"
              stroke={colors.primary} 
              fill={colors.primary}
              fillOpacity={0.6}
              name="Revenue Generated"
            />
            <Area 
              type="monotone" 
              dataKey="commission" 
              stackId="1"
              stroke={colors.success} 
              fill={colors.success}
              fillOpacity={0.6}
              name="Commission Earned"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render completion rate distribution
  const renderCompletionRateChart = () => {
    const completionData = [
      { name: 'Excellent (90-100%)', value: filteredAndSortedData.filter(a => a.completion_rate >= 90).length },
      { name: 'Good (70-89%)', value: filteredAndSortedData.filter(a => a.completion_rate >= 70 && a.completion_rate < 90).length },
      { name: 'Average (50-69%)', value: filteredAndSortedData.filter(a => a.completion_rate >= 50 && a.completion_rate < 70).length },
      { name: 'Below Average (<50%)', value: filteredAndSortedData.filter(a => a.completion_rate < 50).length }
    ];

    const COLORS = [colors.success, colors.primary, colors.warning, colors.danger];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Completion Rate Distribution</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={completionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {completionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render agent grid view
  const renderAgentGrid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedData.map((agent) => (
          <div key={agent.agent_id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
               onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); }}>
            <div className="p-6">
              {/* Agent Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{agent.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{agent.department}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    agent.completion_rate >= 80 
                      ? 'bg-green-100 text-green-800'
                      : agent.completion_rate >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formatPercentage(agent.completion_rate)}
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Tasks Completed</span>
                  <span className="text-sm font-medium text-gray-900">{agent.tasks_completed}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Revenue Generated</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(agent.revenue_generated)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Quality Score</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar 
                        key={i} 
                        className={`h-3 w-3 ${i < agent.quality_score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Performance Trend */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Trend</span>
                  <div className="flex items-center space-x-1">
                    {agent.performance_trend === 'up' && <FiTrendingUp className="h-4 w-4 text-green-500" />}
                    {agent.performance_trend === 'down' && <FiTrendingDown className="h-4 w-4 text-red-500" />}
                    {agent.performance_trend === 'stable' && <FiActivity className="h-4 w-4 text-blue-500" />}
                    <span className={`text-xs font-medium ${
                      agent.performance_trend === 'up' ? 'text-green-600' :
                      agent.performance_trend === 'down' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {agent.performance_trend === 'up' ? `+${agent.weekly_change.toFixed(1)}%` :
                       agent.performance_trend === 'down' ? `${agent.weekly_change.toFixed(1)}%` : 'Stable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Target Progress</span>
                  <span>{formatPercentage(agent.target_achievement)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      agent.target_achievement >= 100 ? 'bg-green-500' :
                      agent.target_achievement >= 80 ? 'bg-blue-500' :
                      agent.target_achievement >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(agent.target_achievement, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render agent table view
  const renderAgentTable = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((agent) => (
                <tr key={agent.agent_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{agent.department}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              agent.completion_rate >= 80 ? 'bg-green-500' :
                              agent.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${agent.completion_rate}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercentage(agent.completion_rate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agent.tasks_completed}</div>
                    <div className="text-sm text-gray-500">{agent.tasks_pending} pending</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(agent.revenue_generated)}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(agent.commission_earned)} commission</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar 
                          key={i} 
                          className={`h-4 w-4 ${i < agent.quality_score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{agent.quality_score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {agent.performance_trend === 'up' && <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />}
                      {agent.performance_trend === 'down' && <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />}
                      {agent.performance_trend === 'stable' && <FiActivity className="h-4 w-4 text-blue-500 mr-1" />}
                      <span className={`text-sm ${
                        agent.performance_trend === 'up' ? 'text-green-600' :
                        agent.performance_trend === 'down' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {agent.performance_trend === 'up' ? `+${agent.weekly_change.toFixed(1)}%` :
                         agent.performance_trend === 'down' ? `${agent.weekly_change.toFixed(1)}%` : 'Stable'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => { setSelectedAgent(agent); setShowAgentModal(true); }}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <FiEye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render agent detail modal
  const renderAgentModal = () => {
    if (!selectedAgent || !showAgentModal) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAgentModal(false)}></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h3>
                    <p className="text-gray-600">{selectedAgent.department} • {selectedAgent.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAgentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Performance Metrics</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <FiTarget className="h-8 w-8 text-blue-600" />
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">{selectedAgent.tasks_completed}</div>
                          <div className="text-sm text-blue-600">Tasks Completed</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <FiClock className="h-8 w-8 text-yellow-600" />
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-900">{selectedAgent.tasks_pending}</div>
                          <div className="text-sm text-yellow-600">Tasks Pending</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <FiDollarSign className="h-8 w-8 text-green-600" />
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-900">{formatCurrency(selectedAgent.revenue_generated)}</div>
                          <div className="text-sm text-green-600">Revenue Generated</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <FiStar className="h-8 w-8 text-purple-600" />
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-900">{selectedAgent.quality_score.toFixed(1)}</div>
                          <div className="text-sm text-purple-600">Quality Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress towards target */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Target Achievement</span>
                      <span className="text-sm font-bold text-gray-900">{formatPercentage(selectedAgent.target_achievement)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          selectedAgent.target_achievement >= 100 ? 'bg-green-500' :
                          selectedAgent.target_achievement >= 80 ? 'bg-blue-500' :
                          selectedAgent.target_achievement >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(selectedAgent.target_achievement, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Daily Activity (Last 7 Days)</h4>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedAgent.daily_activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke={colors.primary} 
                        strokeWidth={3}
                        dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                        name="Tasks Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Additional metrics */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedAgent.avg_response_time.toFixed(1)}h</div>
                      <div className="text-sm text-gray-600">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedAgent.customer_satisfaction.toFixed(1)}/5</div>
                      <div className="text-sm text-gray-600">Customer Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowAgentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Performance Dashboard</h1>
            <p className="mt-2 text-gray-600">Track and analyze agent performance across all metrics</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiUsers className="mr-2 h-4 w-4" />
              Grid View
            </button>
            
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiBarChart3 className="mr-2 h-4 w-4" />
              Table View
            </button>
            
            <button
              onClick={() => setViewMode('analytics')}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'analytics' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiPieChart className="mr-2 h-4 w-4" />
              Analytics
            </button>
            
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <FiDownload className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Agents</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active (>60%)</option>
                <option value="inactive">Needs Improvement (≤60%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Name</option>
                  <option value="completion_rate">Completion Rate</option>
                  <option value="revenue">Revenue</option>
                  <option value="tasks">Tasks</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'analytics' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {renderPerformanceChart()}
              {renderRevenueChart()}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {renderCompletionRateChart()}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
                <div className="space-y-4">
                  {filteredAndSortedData.slice(0, 5).map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-yellow-600' : 'bg-blue-500'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.department}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatPercentage(agent.completion_rate)}</div>
                        <div className="text-sm text-gray-500">{agent.tasks_completed} tasks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          renderAgentTable()
        ) : (
          renderAgentGrid()
        )}

        {/* Agent Detail Modal */}
        {renderAgentModal()}
      </div>
    </div>
  );
}
