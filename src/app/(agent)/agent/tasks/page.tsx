'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTasks, FaCheck, FaTimes, FaCalendar, FaSpinner, FaChartBar, FaHistory, FaRegClock } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AgentTasks() {
  type WeekStats = {
    weekNumber: string;
    startDate: string;
    endDate: string;
    registered: number;
    target: number;
    completed: boolean;
  };
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeekStats[]>([]);
  const [currentWeekStats, setCurrentWeekStats] = useState<WeekStats>({
    weekNumber: 'Current Week',
    startDate: '',
    endDate: '',
    registered: 0,
    target: 40, // Default value until we fetch the actual target
    completed: false
  });
  const [weeklyTarget, setWeeklyTarget] = useState(40); // Default value until we fetch the actual target

  useEffect(() => {
    fetchTasksData();
  }, []);

  async function fetchTasksData() {
    try {
      setLoading(true);
      
      // Get agent ID from the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      const agentId = user?.id;
      
      if (!agentId) return;
      
      // Fetch agent details including weekly_target
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('weekly_target')
        .eq('user_id  ', agentId)
        .single();
      
      if (agentError) {
        console.error('Error fetching agent data:', agentError);
        // Continue with default value if there's an error
      }
      
      // Get the weekly target from agent data or use default
      const target = agentData?.weekly_target || 40;
      setWeeklyTarget(target);
      
      // Get current date info for weekly ranges
      const now = new Date();
      const currentDay = now.getDay(); // 0-6, 0 is Sunday
      
      // Calculate dates for recent weeks (current and past 7 weeks)
      const weekData = [];
      
      for (let i = 0; i < 8; i++) {
        const weekStartDate = new Date(now);
        // Get to Monday of the current week
        weekStartDate.setDate(now.getDate() - currentDay - (7 * i) + (currentDay === 0 ? -6 : 1));
        weekStartDate.setHours(0, 0, 0, 0);
        
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999);
        
        // Fetch business count for this week
        const { data: weekBusinesses, error } = await supabase
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId)
          .gte('created_at', weekStartDate.toISOString())
          .lte('created_at', weekEndDate.toISOString());
        
        if (error) throw error;
        
        const registeredCount = weekBusinesses?.length || 0;
        const targetMet = registeredCount >= target;
        
        weekData.push({
          weekNumber: i === 0 ? 'Current Week' : `Week ${i}`,
          startDate: weekStartDate.toLocaleDateString(),
          endDate: weekEndDate.toLocaleDateString(),
          registered: registeredCount,
          target: target,
          completed: targetMet
        });
        
        // Store current week stats separately
        if (i === 0) {
          setCurrentWeekStats({
            weekNumber: 'Current Week',
            startDate: weekStartDate.toLocaleDateString(),
            endDate: weekEndDate.toLocaleDateString(),
            registered: registeredCount,
            target: target,
            completed: targetMet
          });
        }
      }
      
      setWeeklyData(weekData);
      
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate progress percentage
  const progressPercentage = Math.min((currentWeekStats.registered / currentWeekStats.target) * 100, 100);

  // --- Monthly Progress Calculation (last 4 weeks) ---
  const last4Weeks = weeklyData.slice(0, 4); // Most recent 4 weeks
  const monthlyRegistered = last4Weeks.reduce((sum, week) => sum + week.registered, 0);
  const monthlyTarget = weeklyTarget * 4;
  const monthlyProgress = Math.min((monthlyRegistered / monthlyTarget) * 100, 100);
  const monthlyCompleted = monthlyRegistered >= monthlyTarget;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Task Dashboard</h1>
              <p className="mt-2 text-indigo-100 max-w-2xl">
                Monitor your business registration tasks and progress towards weekly and monthly targets.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{currentWeekStats.registered}</div>
                    <div className="text-xs text-indigo-100">Week Total</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {monthlyRegistered}
                    </div>
                    <div className="text-xs text-indigo-100">Month Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- Monthly Progress Card --- */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-full mr-4 shadow-md">
                <FaChartBar className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                Monthly Performance
              </h2>
            </div>
            
            <div className="mb-6 flex justify-between items-center">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {last4Weeks.length > 0 ? `${last4Weeks[last4Weeks.length-1].startDate} to ${last4Weeks[0].endDate}` : ''}
              </span>
              <span className="text-sm font-medium bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                {monthlyRegistered} of {monthlyTarget} businesses
              </span>
            </div>
            
            <div className="relative mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-4 rounded-full ${
                    monthlyCompleted
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-purple-400 to-indigo-600'
                  }`}
                  style={{ width: `${monthlyProgress}%`, transition: 'width 1s ease-in-out' }}
                ></div>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
                <div className={`rounded-full flex items-center justify-center h-6 w-6 font-bold text-xs ${
                  monthlyCompleted ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {monthlyProgress.toFixed(0)}%
                </div>
              </div>
            </div>
            
            {monthlyCompleted ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <FaCheck className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Monthly target achieved!</p>
                  <p className="text-sm text-green-600">You've registered {monthlyRegistered} businesses in the last 4 weeks.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <FaRegClock className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="font-medium">Target in progress</p>
                  <p className="text-sm text-indigo-600">Need {monthlyTarget - monthlyRegistered} more businesses to reach monthly target</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Current Week Progress Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-3 rounded-full mr-4 shadow-md">
                <FaTasks className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-amber-600">
                This Week's Target
              </h2>
            </div>
            
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-rose-100 rounded-full p-1.5 mr-2">
                  <FaCalendar className="h-4 w-4 text-rose-500" />
                </div>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {currentWeekStats.startDate} to {currentWeekStats.endDate}
                </span>
              </div>
              <span className="text-sm font-medium bg-rose-50 text-rose-700 px-3 py-1 rounded-full">
                {currentWeekStats.registered} of {currentWeekStats.target} businesses
              </span>
            </div>
            
            <div className="relative mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-4 rounded-full ${
                    currentWeekStats.completed
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-rose-400 to-amber-500'
                  }`}
                  style={{ width: `${progressPercentage}%`, transition: 'width 1s ease-in-out' }}
                ></div>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
                <div className={`rounded-full flex items-center justify-center h-6 w-6 font-bold text-xs ${
                  currentWeekStats.completed ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {progressPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
            
            {currentWeekStats.completed ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <FaCheck className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Weekly target achieved!</p>
                  <p className="text-sm text-green-600">You've registered {currentWeekStats.registered} businesses this week.</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center">
                <div className="bg-rose-100 rounded-full p-2 mr-3">
                  <FaRegClock className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium">Target in progress</p>
                  <p className="text-sm text-rose-600">Need {currentWeekStats.target - currentWeekStats.registered} more businesses to reach weekly target</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Weekly Performance History Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-3 rounded-full mr-4 shadow-md">
              <FaHistory className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
              Registration History
            </h2>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-blue-50 rounded-full mb-4">
                <FaSpinner className="animate-spin h-10 w-10 text-blue-500" />
              </div>
              <p className="text-gray-600 font-medium">Loading your performance data...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date Range
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Businesses Registered
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyData.slice(0, 4).map((week, index) => {
                      const weekProgress = Math.min((week.registered / week.target) * 100, 100);
                      return (
                        <tr key={index} className={`transition-colors ${index === 0 ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className={`font-medium ${index === 0 ? 'text-blue-700' : 'text-gray-900'}`}>
                              {week.weekNumber}
                              {index === 0 && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-800">Current</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">
                            {week.startDate} - {week.endDate}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                              {week.registered}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                              {week.target}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-center">
                            {week.completed ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <FaCheck className="mr-1.5" /> Target Achieved
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <FaRegClock className="mr-1.5" /> In Progress
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap w-48">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                              <div
                                className={`h-2.5 rounded-full ${
                                  week.completed 
                                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                    : 'bg-gradient-to-r from-amber-400 to-amber-600'
                                }`}
                                style={{ width: `${weekProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-medium text-gray-600">{weekProgress.toFixed(0)}%</span>
                              <span className="text-xs text-gray-500">{week.registered}/{week.target}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}