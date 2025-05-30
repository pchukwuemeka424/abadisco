"use client";

import React from 'react';
import { format } from 'date-fns';
import { FaUser, FaShoppingCart } from 'react-icons/fa';

// Define proper activity type
interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  [key: string]: unknown; // For any additional properties
}

interface ActivityTableProps {
  activities: Activity[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({ activities }) => {
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <FaUser className="text-blue-500" />;
      case 'purchase':
        return <FaShoppingCart className="text-green-500" />;
      default:
        return null;
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="mr-2">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <span className="capitalize">{activity.activity_type}</span>
                </div>
              </td>
              <td className="px-6 py-4">{activity.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTimestamp(activity.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;