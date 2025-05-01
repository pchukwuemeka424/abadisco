'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTasks, FaCheck, FaTimes, FaCalendar, FaSpinner } from 'react-icons/fa';

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
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Weekly Tasks</h1>

      {/* --- Monthly Progress Card --- */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full mr-4">
            <FaCalendar className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold">Monthly Progress (Last 4 Weeks)</h2>
        </div>
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {last4Weeks.length > 0 ? `${last4Weeks[last4Weeks.length-1].startDate} to ${last4Weeks[0].endDate}` : ''}
          </span>
          <span className="text-sm font-medium">
            {monthlyRegistered} of {monthlyTarget} businesses
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${monthlyCompleted ? 'bg-green-600' : 'bg-purple-600'}`}
            style={{ width: `${monthlyProgress}%` }}
          ></div>
        </div>
        {monthlyCompleted ? (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
            <FaCheck className="mr-2" />
            <span>Monthly target achieved! You've registered {monthlyRegistered} businesses in the last 4 weeks.</span>
          </div>
        ) : (
          <div className="mt-4 flex justify-between">
            <span className="text-sm text-gray-600">
              {monthlyTarget - monthlyRegistered} more businesses needed to reach monthly target
            </span>
            <span className="text-sm font-medium">
              {monthlyProgress.toFixed(0)}% complete
            </span>
          </div>
        )}
      </div>

      {/* Current Week Progress Card */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <FaTasks className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">Current Week Registration Target</h2>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FaCalendar className="mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">
                {currentWeekStats.startDate} to {currentWeekStats.endDate}
              </span>
            </div>
            <div className="text-sm font-medium">
              {currentWeekStats.registered} of {currentWeekStats.target} businesses
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                currentWeekStats.completed ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {currentWeekStats.completed ? (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
              <FaCheck className="mr-2" />
              <span>Target achieved! You've registered {currentWeekStats.registered} businesses this week.</span>
            </div>
          ) : (
            <div className="mt-4 flex justify-between">
              <span className="text-sm text-gray-600">
                {currentWeekStats.target - currentWeekStats.registered} more businesses needed to reach target
              </span>
              <span className="text-sm font-medium">
                {progressPercentage.toFixed(0)}% complete
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Weekly Performance History Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Registration History</h2>
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin h-8 w-8 mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Businesses Registered
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weeklyData.slice(0, 4).map((week, index) => {
                  const weekProgress = Math.min((week.registered / week.target) * 100, 100);
                  return (
                    <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium">{week.weekNumber}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {week.startDate} - {week.endDate}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {week.registered}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {week.target}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {week.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheck className="mr-1" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FaTimes className="mr-1" /> Target Not Met
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap w-48">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${week.completed ? 'bg-green-600' : 'bg-blue-600'}`}
                            style={{ width: `${weekProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 ml-1">{weekProgress.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}