import React from 'react';
import Image from 'next/image';
import { FaExclamationTriangle, FaCheck, FaUser, FaUserSecret, FaShoppingBag, FaIdCard, FaEdit, FaTrash, FaSignInAlt, FaSignOutAlt, FaCog, FaQuestionCircle } from 'react-icons/fa';

interface ActivityTableProps {
  activities: any[];
  loading: boolean;
}

export default function ActivityTable({ activities, loading }: ActivityTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto h-24 w-24 text-gray-400">
          <FaExclamationTriangle size={50} className="mx-auto" />
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No activities found</h3>
        <p className="mt-1 text-sm text-gray-500">Try changing your search criteria or filters.</p>
      </div>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType?.toLowerCase()) {
      case 'login':
        return <FaSignInAlt className="text-blue-500" />;
      case 'logout':
        return <FaSignOutAlt className="text-gray-500" />;
      case 'create':
        return <FaEdit className="text-green-500" />;
      case 'update':
        return <FaEdit className="text-blue-500" />;
      case 'delete':
        return <FaTrash className="text-red-500" />;
      case 'settings':
        return <FaCog className="text-purple-500" />;
      case 'kyc':
        return <FaIdCard className="text-yellow-500" />;
      case 'user':
        return <FaUser className="text-blue-500" />;
      case 'agent':
        return <FaUserSecret className="text-green-500" />;
      case 'product':
        return <FaShoppingBag className="text-orange-500" />;
      default:
        return <FaQuestionCircle className="text-gray-500" />;
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType?.toLowerCase()) {
      case 'admin':
        return <div className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Admin</div>;
      case 'agent':
        return <div className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Agent</div>;
      case 'user':
        return <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">User</div>;
      default:
        return <div className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</div>;
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <div className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</div>;
      case 'medium':
        return <div className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium</div>;
      case 'low':
        return <div className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</div>;
      default:
        return <div className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Info</div>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Severity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{activity.action_type}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    {activity.users?.avatar_url ? (
                      <Image
                        src={activity.users.avatar_url}
                        alt={activity.users?.full_name || "User"}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {activity.users?.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{activity.users?.full_name || "Unknown"}</div>
                    <div className="text-sm text-gray-500">{activity.users?.email || "No email"}</div>
                  </div>
                  <div className="ml-2">
                    {getUserTypeIcon(activity.user_type)}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md">{activity.description}</div>
                {activity.metadata && (
                  <details className="mt-1 text-xs text-gray-500 cursor-pointer">
                    <summary>View Details</summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(activity.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getSeverityBadge(activity.severity)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.ip_address || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}