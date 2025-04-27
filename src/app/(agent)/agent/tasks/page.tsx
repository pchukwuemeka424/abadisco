'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaTasks, FaCheck, FaTimes, FaCalendar, FaSpinner } from 'react-icons/fa';

export default function AgentTasks() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [currentWeekStats, setCurrentWeekStats] = useState({
    startDate: '',
    endDate: '',
    registered: 0,
    target: 40,
    completed: false
  });

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
        
        // Fetch user count for this week
        const { data: weekUsers, error } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('created_by', agentId)
          .gte('created_at', weekStartDate.toISOString())
          .lte('created_at', weekEndDate.toISOString());
        
        if (error) throw error;
        
        const registeredCount = weekUsers?.length || 0;
        const targetMet = registeredCount >= 40;
        
        weekData.push({
          weekNumber: i === 0 ? 'Current Week' : `Week ${i}`,
          startDate: weekStartDate.toLocaleDateString(),
          endDate: weekEndDate.toLocaleDateString(),
          registered: registeredCount,
          target: 40,
          completed: targetMet
        });
        
        // Store current week stats separately
        if (i === 0) {
          setCurrentWeekStats({
            startDate: weekStartDate.toLocaleDateString(),
            endDate: weekEndDate.toLocaleDateString(),
            registered: registeredCount,
            target: 40,
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

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Weekly Tasks</h1>
      
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
              {currentWeekStats.registered} of {currentWeekStats.target} users
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
              <span>Target achieved! You've registered {currentWeekStats.registered} users this week.</span>
            </div>
          ) : (
            <div className="mt-4 flex justify-between">
              <span className="text-sm text-gray-600">
                {currentWeekStats.target - currentWeekStats.registered} more users needed to reach target
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
                    Users Registered
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {weeklyData.map((week, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}