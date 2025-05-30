'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  FaSpinner, FaCheck, FaClock, FaCalendarAlt, FaCalendarWeek, 
  FaUser, FaChartBar, FaChevronLeft, FaChevronRight, FaSearch, 
  FaFilter, FaTrophy, FaStore, FaExchangeAlt, FaArrowUp, 
  FaArrowDown, FaEquals, FaChartLine, FaTasks, FaStar
} from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AgentPerformancePage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week'); // 'week', 'month', or 'trend'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [performanceData, setPerformanceData] = useState({
    weekly: [],
    monthly: []
  });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage, setAgentsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc, name_desc, completion_asc, completion_desc, etc.
  
  useEffect(() => {
    fetchAgents();
  }, []);
  
  useEffect(() => {
    if (agents.length > 0) {
      generatePerformanceData();
    }
  }, [agents, view, currentDate]);
  
  async function fetchAgents() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      
      setAgents(data || []);
      
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // This function would normally fetch real data from a tasks or activities table
  // For now, we'll generate mock data based on the agents we have
  function generatePerformanceData() {
    const weeks = [];
    const months = [];
    
    // Generate weekly performance data for the last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekData = {
        weekStart,
        weekEnd,
        agents: agents.map(agent => {
          // Generate random task data for demonstration
          const totalTasks = Math.floor(Math.random() * 50) + 10;
          const completedTasks = Math.floor(Math.random() * totalTasks);
          const pendingTasks = totalTasks - completedTasks;
          const businessRegistrations = Math.floor(Math.random() * 20);
          const userRegistrations = Math.floor(Math.random() * 30) + 5;
          
          // Generate task types
          const taskTypes = {
            registrations: Math.floor(Math.random() * 15) + 5,
            verifications: Math.floor(Math.random() * 10) + 2,
            support: Math.floor(Math.random() * 8) + 1,
            outreach: Math.floor(Math.random() * 12) + 3
          };
          
          // Calculate quality metrics (1-5 scale)
          const qualityMetrics = {
            responseTime: Math.random() * 2 + 3, // 3-5 scale
            accuracy: Math.random() * 2 + 3, // 3-5 scale
            customerFeedback: Math.random() * 2 + 3, // 3-5 scale
            overallQuality: Math.random() * 2 + 3, // 3-5 scale
          };
          
          // Generate daily completions for the week
          const dailyCompletions = Array.from({ length: 7 }, () => 
            Math.floor(Math.random() * 10)
          );
          
          // Previous week for comparison
          const previousWeekCompletions = completedTasks - Math.floor(Math.random() * 11) - 5; // -5 to +5 difference
          const weeklyChange = previousWeekCompletions > 0 
            ? ((completedTasks - previousWeekCompletions) / previousWeekCompletions) * 100 
            : 100;
          
          return {
            id: agent.id,
            name: agent.full_name,
            email: agent.email,
            status: agent.status,
            totalTasks,
            completedTasks,
            pendingTasks,
            businessRegistrations,
            userRegistrations,
            totalRegistrations: businessRegistrations + userRegistrations,
            taskTypes,
            qualityMetrics,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            targetMet: completedTasks >= (agent.weekly_target || 40),
            dailyCompletions,
            previousWeekCompletions,
            weeklyChange,
            weeklyTarget: agent.weekly_target || 40
          };
        })
      };
      
      weeks.push(weekData);
    }
    
    // Generate monthly performance data for the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleString('default', { month: 'long' });
      
      const monthData = {
        monthStart,
        monthEnd,
        month: monthName,
        year: monthStart.getFullYear(),
        agents: agents.map(agent => {
          // Generate random task data for demonstration
          const totalTasks = Math.floor(Math.random() * 200) + 40;
          const completedTasks = Math.floor(Math.random() * totalTasks);
          const pendingTasks = totalTasks - completedTasks;
          const businessRegistrations = Math.floor(Math.random() * 80);
          const userRegistrations = Math.floor(Math.random() * 120) + 20;
          
          // Generate task types
          const taskTypes = {
            registrations: Math.floor(Math.random() * 60) + 20,
            verifications: Math.floor(Math.random() * 40) + 10,
            support: Math.floor(Math.random() * 30) + 5,
            outreach: Math.floor(Math.random() * 50) + 15
          };
          
          // Calculate quality metrics (1-5 scale)
          const qualityMetrics = {
            responseTime: Math.random() * 2 + 3, // 3-5 scale
            accuracy: Math.random() * 2 + 3, // 3-5 scale
            customerFeedback: Math.random() * 2 + 3, // 3-5 scale
            overallQuality: Math.random() * 2 + 3, // 3-5 scale
          };
          
          // Generate weekly completions for the month (assuming 4 weeks per month)
          const weeklyCompletions = Array.from({ length: 4 }, () => 
            Math.floor(Math.random() * 40) + 10
          );
          
          // Previous month for comparison
          const previousMonthCompletions = completedTasks - Math.floor(Math.random() * 41) - 20; // -20 to +20 difference
          const monthlyChange = previousMonthCompletions > 0 
            ? ((completedTasks - previousMonthCompletions) / previousMonthCompletions) * 100 
            : 100;
            
          // Monthly earnings (based on completed tasks)
          const monthlyEarnings = completedTasks * (Math.random() * 500 + 1000) / 100; // N1000-1500 per completed task
          
          return {
            id: agent.id,
            name: agent.full_name,
            email: agent.email,
            status: agent.status,
            totalTasks,
            completedTasks,
            pendingTasks,
            businessRegistrations,
            userRegistrations,
            totalRegistrations: businessRegistrations + userRegistrations,
            taskTypes,
            qualityMetrics,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            targetMet: completedTasks >= (agent.weekly_target || 40) * 4, // Assuming 4 weeks per month
            weeklyCompletions,
            previousMonthCompletions,
            monthlyChange,
            monthlyTarget: (agent.weekly_target || 40) * 4,
            monthlyEarnings
          };
        })
      };
      
      months.push(monthData);
    }
    
    setPerformanceData({
      weekly: weeks,
      monthly: months
    });
  }
  
  // Function to format date to a readable string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };
  
  // Calculate total performance stats across all agents
  const calculateTotalStats = (data) => {
    if (!data || !data.length) return { 
      total: 0, 
      completed: 0, 
      pending: 0, 
      rate: 0,
      businessRegistrations: 0,
      userRegistrations: 0,
      totalRegistrations: 0
    };
    
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let businessRegistrations = 0;
    let userRegistrations = 0;
    
    data.forEach(period => {
      period.agents.forEach(agent => {
        totalTasks += agent.totalTasks;
        completedTasks += agent.completedTasks;
        pendingTasks += agent.pendingTasks;
        businessRegistrations += agent.businessRegistrations || 0;
        userRegistrations += agent.userRegistrations || 0;
      });
    });
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      businessRegistrations,
      userRegistrations,
      totalRegistrations: businessRegistrations + userRegistrations
    };
  };
  
  // Get top performing agents
  const getTopPerformingAgents = (period, metric = 'completedTasks', limit = 5) => {
    if (!period || !period.agents || !period.agents.length) return [];
    
    const sortedAgents = [...period.agents].sort((a, b) => b[metric] - a[metric]);
    return sortedAgents.slice(0, limit);
  };
  
  // Sort agents by selected criteria
  const sortAgents = (agents) => {
    if (!agents) return [];
    
    const sorted = [...agents];
    
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'completion_asc':
        return sorted.sort((a, b) => a.completionRate - b.completionRate);
      case 'completion_desc':
        return sorted.sort((a, b) => b.completionRate - a.completionRate);
      case 'tasks_asc':
        return sorted.sort((a, b) => a.completedTasks - b.completedTasks);
      case 'tasks_desc':
        return sorted.sort((a, b) => b.completedTasks - a.completedTasks);
      case 'businesses_desc':
        return sorted.sort((a, b) => b.businessRegistrations - a.businessRegistrations);
      case 'quality_desc':
        return sorted.sort((a, b) => b.qualityMetrics.overallQuality - a.qualityMetrics.overallQuality);
      default:
        return sorted;
    }
  };
  
  // Filter and paginate agents
  const getFilteredAgents = (agentsList) => {
    if (!agentsList) return [];
    
    return agentsList.filter(agent => {
      const nameMatch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       agent.email.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || agent.status === statusFilter;
      
      return nameMatch && statusMatch;
    });
  };
  
  // Apply sorting to filtered agents
  const getSortedFilteredAgents = (agentsList) => {
    const filtered = getFilteredAgents(agentsList);
    return sortAgents(filtered);
  };
  
  const getPaginatedAgents = (period) => {
    if (!period) return [];
    
    const sortedFilteredAgents = getSortedFilteredAgents(period.agents);
    const indexOfLastAgent = currentPage * agentsPerPage;
    const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
    
    return sortedFilteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);
  };
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);
  
  const totalWeeklyStats = calculateTotalStats(performanceData.weekly);
  const totalMonthlyStats = calculateTotalStats(performanceData.monthly);
  
  // Create graph data for trends
  const createTrendGraphData = () => {
    if (view === 'week' && performanceData.weekly.length > 0) {
      // Weekly trend data (comparing the last 4 weeks)
      const labels = performanceData.weekly.map((week, index) => 
        `Week ${performanceData.weekly.length - index}`
      ).reverse();
      
      const completedTasksData = performanceData.weekly.map(week => 
        week.agents.reduce((sum, agent) => sum + agent.completedTasks, 0)
      ).reverse();
      
      const pendingTasksData = performanceData.weekly.map(week => 
        week.agents.reduce((sum, agent) => sum + agent.pendingTasks, 0)
      ).reverse();
      
      const businessRegistrationsData = performanceData.weekly.map(week => 
        week.agents.reduce((sum, agent) => sum + agent.businessRegistrations, 0)
      ).reverse();
      
      return {
        labels,
        datasets: [
          {
            label: 'Completed Tasks',
            data: completedTasksData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.2
          },
          {
            label: 'Pending Tasks',
            data: pendingTasksData,
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            tension: 0.2
          },
          {
            label: 'Business Registrations',
            data: businessRegistrationsData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.2
          }
        ]
      };
    } else if (view === 'month' && performanceData.monthly.length > 0) {
      // Monthly trend data (comparing the last 6 months)
      const labels = performanceData.monthly.map(month => 
        `${month.month.slice(0, 3)} ${month.year}`
      ).reverse();
      
      const completedTasksData = performanceData.monthly.map(month => 
        month.agents.reduce((sum, agent) => sum + agent.completedTasks, 0)
      ).reverse();
      
      const pendingTasksData = performanceData.monthly.map(month => 
        month.agents.reduce((sum, agent) => sum + agent.pendingTasks, 0)
      ).reverse();
      
      const businessRegistrationsData = performanceData.monthly.map(month => 
        month.agents.reduce((sum, agent) => sum + agent.businessRegistrations, 0)
      ).reverse();
      
      return {
        labels,
        datasets: [
          {
            label: 'Completed Tasks',
            data: completedTasksData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.2
          },
          {
            label: 'Pending Tasks',
            data: pendingTasksData,
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            tension: 0.2
          },
          {
            label: 'Business Registrations',
            data: businessRegistrationsData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.2
          }
        ]
      };
    }
    
    return {
      labels: [],
      datasets: []
    };
  };
  
  // Agent comparison chart data
  const createAgentComparisonData = (period) => {
    if (!period || !period.agents || period.agents.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Get top 5 agents by completed tasks
    const topAgents = getTopPerformingAgents(period, 'completedTasks', 5);
    
    return {
      labels: topAgents.map(agent => agent.name.split(' ')[0]), // Use first name for better readability
      datasets: [
        {
          label: 'Completed Tasks',
          data: topAgents.map(agent => agent.completedTasks),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
        },
        {
          label: 'Business Registrations',
          data: topAgents.map(agent => agent.businessRegistrations),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        },
        {
          label: 'User Registrations',
          data: topAgents.map(agent => agent.userRegistrations),
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
        }
      ]
    };
  };
  
  // Task type breakdown chart data
  const createTaskTypeData = (period) => {
    if (!period || !period.agents || period.agents.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Aggregate task types across all agents
    const taskTypeTotals = period.agents.reduce((totals, agent) => {
      if (!agent.taskTypes) return totals;
      
      Object.entries(agent.taskTypes).forEach(([type, count]) => {
        totals[type] = (totals[type] || 0) + count;
      });
      
      return totals;
    }, {});
    
    return {
      labels: Object.keys(taskTypeTotals).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          data: Object.values(taskTypeTotals),
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(234, 179, 8, 0.6)',
            'rgba(139, 92, 246, 0.6)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(234, 179, 8)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Pagination controls
  const getCurrentPeriod = () => {
    if (view === 'week' && performanceData.weekly.length > 0) {
      return performanceData.weekly[0]; // Show the current week
    } else if (view === 'month' && performanceData.monthly.length > 0) {
      return performanceData.monthly[0]; // Show the current month
    }
    return null;
  };
  
  const currentPeriod = getCurrentPeriod();
  const filteredAgents = currentPeriod ? getSortedFilteredAgents(currentPeriod.agents) : [];
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-6 space-x-2">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
        >
          <FaChevronLeft />
        </button>
        
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageToShow = currentPage;
            if (currentPage <= 3) {
              pageToShow = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + i;
            } else {
              pageToShow = currentPage - 2 + i;
            }
            
            if (pageToShow > 0 && pageToShow <= totalPages) {
              return (
                <button
                  key={pageToShow}
                  onClick={() => handlePageChange(pageToShow)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    currentPage === pageToShow
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageToShow}
                </button>
              );
            }
            return null;
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-2 self-end">...</span>
              <button
                onClick={() => handlePageChange(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-200"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'}`}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };
  
  // Open agent detail modal
  const openAgentDetail = (agent) => {
    setSelectedAgent(agent);
    setShowDetailModal(true);
  };
  
  // Agent detail modal
  const renderAgentDetailModal = () => {
    if (!showDetailModal || !selectedAgent) return null;
    
    // Create daily/weekly completion data for the chart
    const timeLabels = view === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      
    const completionData = view === 'week'
      ? selectedAgent.dailyCompletions
      : selectedAgent.weeklyCompletions;
      
    const lineChartData = {
      labels: timeLabels,
      datasets: [
        {
          label: 'Tasks Completed',
          data: completionData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2
        }
      ]
    };
    
    // Task type breakdown for the agent
    const taskTypePieData = {
      labels: Object.keys(selectedAgent.taskTypes).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          data: Object.values(selectedAgent.taskTypes),
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(234, 179, 8, 0.6)',
            'rgba(139, 92, 246, 0.6)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(234, 179, 8)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 1,
        }
      ]
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Agent Performance Detail: {selectedAgent.name}
            </h2>
            <button 
              onClick={() => setShowDetailModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {/* Agent Basic Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-blue-800">Agent Information</h3>
                  <p className="text-sm text-gray-600">{selectedAgent.email}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${selectedAgent.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedAgent.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedAgent.status.charAt(0).toUpperCase() + selectedAgent.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-blue-800">Performance Summary</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="font-medium">{view === 'week' ? selectedAgent.weeklyTarget : selectedAgent.monthlyTarget} tasks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-medium">{selectedAgent.completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Met:</span>
                      <span className={`font-medium ${selectedAgent.targetMet ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedAgent.targetMet ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {view === 'month' && (
                      <div className="flex justify-between">
                        <span>Monthly Earnings:</span>
                        <span className="font-medium">{formatCurrency(selectedAgent.monthlyEarnings)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-gray-500">Total Tasks</div>
                  <div className="mt-1 flex items-center">
                    <FaTasks className="text-blue-500 mr-2" />
                    <span className="text-2xl font-bold">{selectedAgent.totalTasks}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                  <div className="text-sm font-medium text-gray-500">Completed</div>
                  <div className="mt-1 flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span className="text-2xl font-bold">{selectedAgent.completedTasks}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                  <div className="text-sm font-medium text-gray-500">Pending</div>
                  <div className="mt-1 flex items-center">
                    <FaClock className="text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold">{selectedAgent.pendingTasks}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                  <div className="text-sm font-medium text-gray-500">Businesses</div>
                  <div className="mt-1 flex items-center">
                    <FaStore className="text-purple-500 mr-2" />
                    <span className="text-2xl font-bold">{selectedAgent.businessRegistrations}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Change */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Performance Change</h3>
              <div className="flex items-center">
                <div className="flex-1 flex items-center">
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">Previous {view === 'week' ? 'Week' : 'Month'}</div>
                    <div className="text-2xl font-bold">{view === 'week' ? selectedAgent.previousWeekCompletions : selectedAgent.previousMonthCompletions}</div>
                    <div className="text-xs text-gray-500">Completed Tasks</div>
                  </div>
                </div>
                
                <div className="flex-1 flex justify-center">
                  {(view === 'week' ? selectedAgent.weeklyChange : selectedAgent.monthlyChange) > 5 ? (
                    <div className="flex flex-col items-center text-green-500">
                      <FaArrowUp className="text-3xl" />
                      <div className="text-sm font-medium mt-1">
                        {Math.abs((view === 'week' ? selectedAgent.weeklyChange : selectedAgent.monthlyChange)).toFixed(1)}% Increase
                      </div>
                    </div>
                  ) : (view === 'week' ? selectedAgent.weeklyChange : selectedAgent.monthlyChange) < -5 ? (
                    <div className="flex flex-col items-center text-red-500">
                      <FaArrowDown className="text-3xl" />
                      <div className="text-sm font-medium mt-1">
                        {Math.abs((view === 'week' ? selectedAgent.weeklyChange : selectedAgent.monthlyChange)).toFixed(1)}% Decrease
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <FaEquals className="text-3xl" />
                      <div className="text-sm font-medium mt-1">No Significant Change</div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex items-center justify-end">
                  <div className="text-sm text-right">
                    <div className="font-medium text-gray-800">Current {view === 'week' ? 'Week' : 'Month'}</div>
                    <div className="text-2xl font-bold">{selectedAgent.completedTasks}</div>
                    <div className="text-xs text-gray-500">Completed Tasks</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  {view === 'week' ? 'Daily' : 'Weekly'} Completion Trend
                </h3>
                <div className="h-60">
                  <Line 
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Task Type Breakdown</h3>
                <div className="h-60 flex justify-center">
                  <Pie 
                    data={taskTypePieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Quality Metrics */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Quality Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(selectedAgent.qualityMetrics).map(([metric, score]) => (
                  <div key={metric} className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm font-medium text-gray-500">
                      {metric.split(/(?=[A-Z])/).join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(score)
                                  ? 'text-yellow-500'
                                  : i < score
                                  ? 'text-yellow-300'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{score.toFixed(1)} / 5.0</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agent Performance Tracking</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-md flex items-center ${
              view === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaCalendarWeek className="mr-2" />
            Weekly View
          </button>
          
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-md flex items-center ${
              view === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaCalendarAlt className="mr-2" />
            Monthly View
          </button>
          
          <button
            onClick={() => setView('trend')}
            className={`px-4 py-2 rounded-md flex items-center ${
              view === 'trend' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaChartLine className="mr-2" />
            Trend Analysis
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin h-8 w-8 mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading performance data...</p>
        </div>
      ) : (
        <>
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Agents</h3>
              <div className="flex items-center">
                <FaUser className="text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{agents.length}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {view === 'week' ? 'Weekly Tasks' : 'Monthly Tasks'}
              </h3>
              <div className="flex items-center">
                <FaTasks className="text-purple-500 mr-2" />
                <span className="text-2xl font-bold">
                  {view === 'week' ? totalWeeklyStats.total : totalMonthlyStats.total}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {view === 'week' ? 'Weekly Completed' : 'Monthly Completed'}
              </h3>
              <div className="flex items-center">
                <FaCheck className="text-green-500 mr-2" />
                <span className="text-2xl font-bold">
                  {view === 'week' ? totalWeeklyStats.completed : totalMonthlyStats.completed}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {view === 'week' ? 'Weekly Pending' : 'Monthly Pending'}
              </h3>
              <div className="flex items-center">
                <FaClock className="text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">
                  {view === 'week' ? totalWeeklyStats.pending : totalMonthlyStats.pending}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Business Registrations
              </h3>
              <div className="flex items-center">
                <FaStore className="text-indigo-500 mr-2" />
                <span className="text-2xl font-bold">
                  {view === 'week' ? totalWeeklyStats.businessRegistrations : totalMonthlyStats.businessRegistrations}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                User Registrations
              </h3>
              <div className="flex items-center">
                <FaUser className="text-cyan-500 mr-2" />
                <span className="text-2xl font-bold">
                  {view === 'week' ? totalWeeklyStats.userRegistrations : totalMonthlyStats.userRegistrations}
                </span>
              </div>
            </div>
          </div>
          
          {view === 'trend' ? (
            /* Trend Analysis View */
            <div className="space-y-6">
              {/* Trend Charts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Performance Trends ({view === 'week' ? 'Last 4 Weeks' : 'Last 6 Months'})
                </h2>
                <div className="h-80">
                  <Line 
                    data={createTrendGraphData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Top Performers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">
                    <span className="flex items-center">
                      <FaTrophy className="text-yellow-500 mr-2" />
                      Top Performing Agents
                    </span>
                  </h2>
                  <div className="h-80">
                    <Bar 
                      data={createAgentComparisonData(getCurrentPeriod())}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">
                    <span className="flex items-center">
                      <FaTasks className="text-blue-500 mr-2" />
                      Task Type Distribution
                    </span>
                  </h2>
                  <div className="h-80 flex justify-center">
                    <Pie 
                      data={createTaskTypeData(getCurrentPeriod())}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filter Controls */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 max-w-md relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center">
                    <label htmlFor="statusFilter" className="flex items-center text-sm font-medium text-gray-700 whitespace-nowrap">
                      <FaFilter className="mr-1" /> Status:
                    </label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="ml-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <label htmlFor="sortBy" className="flex items-center text-sm font-medium text-gray-700 whitespace-nowrap">
                      <FaExchangeAlt className="mr-1" /> Sort by:
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="ml-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="completion_desc">Completion Rate (High-Low)</option>
                      <option value="completion_asc">Completion Rate (Low-High)</option>
                      <option value="tasks_desc">Tasks Completed (High-Low)</option>
                      <option value="tasks_asc">Tasks Completed (Low-High)</option>
                      <option value="businesses_desc">Business Registrations (High-Low)</option>
                      <option value="quality_desc">Quality Score (High-Low)</option>
                    </select>
                  </div>
                  
                  <select
                    value={agentsPerPage}
                    onChange={(e) => {
                      setAgentsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>
              
              {/* Performance Data Tables */}
              {currentPeriod && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-800">
                      {view === 'week' 
                        ? `Week of ${formatDate(currentPeriod.weekStart)} - ${formatDate(currentPeriod.weekEnd)}`
                        : `${currentPeriod.month} ${currentPeriod.year}`
                      }
                    </h2>
                    <div className="text-sm text-gray-500">
                      Showing {filteredAgents.length > 0 ? (currentPage - 1) * agentsPerPage + 1 : 0}-
                      {Math.min(currentPage * agentsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Businesses
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completion
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quality
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {view === 'week' ? 'Weekly Change' : 'Monthly Change'}
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedAgents(currentPeriod).map((agent) => (
                          <tr 
                            key={agent.id}
                            className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                  <div className="text-sm text-gray-500">{agent.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${agent.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : agent.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {agent.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center">
                                  <FaCheck className="text-green-500 mr-1" />
                                  <span>{agent.completedTasks}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <FaClock className="text-yellow-500 mr-1" />
                                  <span>{agent.pendingTasks}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FaStore className="text-blue-500 mr-2" />
                                <span className="text-sm text-gray-900">{agent.businessRegistrations}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {agent.userRegistrations} users
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    agent.completionRate >= 75 ? 'bg-green-600' :
                                    agent.completionRate >= 50 ? 'bg-blue-600' :
                                    agent.completionRate >= 25 ? 'bg-yellow-500' : 
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${agent.completionRate}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                  {agent.completionRate.toFixed(1)}%
                                </span>
                                <span className={`text-xs ${agent.targetMet ? 'text-green-600' : 'text-red-600'}`}>
                                  {agent.targetMet ? 'Target Met' : 'Target Missed'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(agent.qualityMetrics.overallQuality)
                                        ? 'text-yellow-500'
                                        : i < agent.qualityMetrics.overallQuality
                                        ? 'text-yellow-300'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {agent.qualityMetrics.overallQuality.toFixed(1)} / 5.0
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center ${
                                (view === 'week' ? agent.weeklyChange : agent.monthlyChange) > 5 
                                  ? 'text-green-600'
                                  : (view === 'week' ? agent.weeklyChange : agent.monthlyChange) < -5
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                              }`}>
                                {(view === 'week' ? agent.weeklyChange : agent.monthlyChange) > 5 ? (
                                  <FaArrowUp className="mr-1" />
                                ) : (view === 'week' ? agent.weeklyChange : agent.monthlyChange) < -5 ? (
                                  <FaArrowDown className="mr-1" />
                                ) : (
                                  <FaEquals className="mr-1" />
                                )}
                                <span>
                                  {Math.abs((view === 'week' ? agent.weeklyChange : agent.monthlyChange)).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => openAgentDetail(agent)}
                                className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                        
                        {filteredAgents.length === 0 && (
                          <tr>
                            <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                              {searchTerm || statusFilter !== 'all' 
                                ? "No agents found matching your search criteria."
                                : "No agents data available."
                              }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Agent Detail Modal */}
      {renderAgentDetailModal()}
    </div>
  );
}