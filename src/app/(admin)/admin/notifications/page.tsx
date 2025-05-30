'use client';

import { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaFilter, FaTrash, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaBullhorn } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';

export default function NotificationsPage() {
  // Form states for creating new notifications
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [notificationType, setNotificationType] = useState('info');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  
  // Notifications list state
  const [notifications, setNotifications] = useState([]);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // User notification preferences
  const [adminPrefs, setAdminPrefs] = useState({
    systemUpdates: true,
    marketing: true,
    securityAlerts: true,
    newFeatures: true
  });
  
  const [regularUserPrefs, setRegularUserPrefs] = useState({
    systemUpdates: true,
    marketing: false,
    securityAlerts: true,
    newFeatures: true
  });
  
  const [businessOwnerPrefs, setBusinessOwnerPrefs] = useState({
    systemUpdates: true,
    marketing: true,
    securityAlerts: true,
    newFeatures: true
  });

  // Load notifications on component mount
  useEffect(() => {
    // Fetch notifications - in a real app this would come from Supabase
    // const fetchNotifications = async () => {
    //   const { data, error } = await supabase
    //     .from('notifications')
    //     .select('*')
    //     .order('created_at', { ascending: false });
    //     
    //   if (error) {
    //     console.error('Error fetching notifications:', error);
    //   } else {
    //     setNotifications(data);
    //   }
    // };
    // 
    // fetchNotifications();
    
    // For now, let's use mock data
    setNotifications([
      {
        id: 1,
        type: 'system',
        title: 'System Maintenance Scheduled',
        recipients: 'All Users',
        date: 'April 26, 2025',
        status: 'sent'
      },
      {
        id: 2,
        type: 'info',
        title: 'New Feature: Product Reviews',
        recipients: 'Business Owners (Role 2)',
        date: 'April 24, 2025',
        status: 'sent'
      },
      {
        id: 3,
        type: 'warning',
        title: 'Complete Your KYC Verification',
        recipients: 'Regular Users (Role 1)',
        date: 'April 20, 2025',
        status: 'sent'
      },
      {
        id: 4,
        type: 'success',
        title: 'New Market Added: Uratta Market',
        recipients: 'All Users',
        date: 'April 18, 2025',
        status: 'sent'
      },
      {
        id: 5,
        type: 'error',
        title: 'Important Security Update',
        recipients: 'Administrators (Role 0)',
        date: 'April 15, 2025',
        status: 'draft'
      }
    ]);
  }, []);
  
  // Handle creating a new notification
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      alert('Please fill in the title and content for the notification.');
      return;
    }
    
    try {
      const newNotification = {
        id: notifications.length + 1,
        type: notificationType,
        title: title,
        recipients: getRecipientLabel(recipientType),
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        status: 'sent'
      };
      
      // In a real app, we would save to Supabase
      // const { data, error } = await supabase.from('notifications').insert({
      //   title,
      //   content,
      //   recipient_type: recipientType,
      //   notification_type: notificationType,
      //   status: 'sent',
      //   created_at: new Date()
      // });
      
      // if (error) throw error;
      
      // Update the UI with the new notification
      setNotifications([newNotification, ...notifications]);
      
      // Reset the form
      setTitle('');
      setContent('');
      setRecipientType('all');
      setNotificationType('info');
      
      // Show success message
      showSuccessMessage('Notification sent successfully!');
      
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };
  
  // Handle notification deletion
  const handleDeleteNotification = async (id) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        // In a real app, we would delete from Supabase
        // await supabase.from('notifications').delete().eq('id', id);
        
        // Update the UI by removing the deleted notification
        setNotifications(notifications.filter(note => note.id !== id));
        showSuccessMessage('Notification deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting notification:', error);
        // Improved error handling
        const errorMessage = error.message || (error.details ? error.details : 'Unknown error occurred');
        alert(`Failed to delete notification: ${errorMessage}`);
      }
    }
  };
  
  // Handle search and filter
  const filteredNotifications = notifications.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === '' || note.type === filter;
    return matchesSearch && matchesFilter;
  });
  
  // Handle saving user notification preferences
  const handleSavePreferences = async () => {
    try {
      // In a real app, we would save to Supabase
      // await supabase.from('notification_preferences').upsert([
      //   { role: 0, system_updates: adminPrefs.systemUpdates, marketing: adminPrefs.marketing, security_alerts: adminPrefs.securityAlerts, new_features: adminPrefs.newFeatures },
      //   { role: 1, system_updates: regularUserPrefs.systemUpdates, marketing: regularUserPrefs.marketing, security_alerts: regularUserPrefs.securityAlerts, new_features: regularUserPrefs.newFeatures },
      //   { role: 2, system_updates: businessOwnerPrefs.systemUpdates, marketing: businessOwnerPrefs.marketing, security_alerts: businessOwnerPrefs.securityAlerts, new_features: businessOwnerPrefs.newFeatures }
      // ]);
      
      showSuccessMessage('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save notification preferences. Please try again.');
    }
  };
  
  // Helper to get recipient label for display
  const getRecipientLabel = (type) => {
    switch (type) {
      case 'all': return 'All Users';
      case 'role_0': return 'Administrators (Role 0)';
      case 'role_1': return 'Regular Users (Role 1)';
      case 'role_2': return 'Business Owners (Role 2)';
      case 'specific': return 'Specific Users';
      default: return type;
    }
  };
  
  // Show success message for 3 seconds
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div>
      {/* Success message toast */}
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50">
          <div className="flex">
            <div className="py-1 mr-3">
              <FaCheckCircle className="text-green-500" />
            </div>
            <div>
              <p className="font-bold">Success</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with page title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications Management</h1>
          <p className="text-gray-600 mt-1">Send and manage system notifications to users</p>
        </div>
      </div>
      
      {/* Create notification section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Notification</h2>
        
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Content
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter notification content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Type
              </label>
              <select 
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="role_0">Administrators (Role 0)</option>
                <option value="role_1">Regular Users (Role 1)</option>
                <option value="role_2">Business Owners (Role 2)</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Type
              </label>
              <select 
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="system">System Update</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FaPaperPlane className="mr-2" />
              <span>Send Notification</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Filter and search bar */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications by title or content..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">All Notification Types</option>
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="system">System Update</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDelete={() => handleDeleteNotification(notification.id)}
                  />
                ))}
                {filteredNotifications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No notifications found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredNotifications.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredNotifications.length}</span> of <span className="font-medium">{notifications.length}</span> notifications
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* User Notification Preferences */}
      <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-lg font-semibold">User Notification Preferences</h3>
          <p className="text-gray-500 text-sm">Default notification settings for user groups</p>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Group</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Updates</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security Alerts</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Features</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Administrators (Role 0)</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={adminPrefs.systemUpdates} 
                      onChange={(e) => setAdminPrefs({...adminPrefs, systemUpdates: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={adminPrefs.marketing} 
                      onChange={(e) => setAdminPrefs({...adminPrefs, marketing: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={adminPrefs.securityAlerts} 
                      onChange={(e) => setAdminPrefs({...adminPrefs, securityAlerts: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={adminPrefs.newFeatures} 
                      onChange={(e) => setAdminPrefs({...adminPrefs, newFeatures: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Regular Users (Role 1)</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={regularUserPrefs.systemUpdates} 
                      onChange={(e) => setRegularUserPrefs({...regularUserPrefs, systemUpdates: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={regularUserPrefs.marketing} 
                      onChange={(e) => setRegularUserPrefs({...regularUserPrefs, marketing: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={regularUserPrefs.securityAlerts} 
                      onChange={(e) => setRegularUserPrefs({...regularUserPrefs, securityAlerts: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={regularUserPrefs.newFeatures} 
                      onChange={(e) => setRegularUserPrefs({...regularUserPrefs, newFeatures: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Business Owners (Role 2)</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={businessOwnerPrefs.systemUpdates} 
                      onChange={(e) => setBusinessOwnerPrefs({...businessOwnerPrefs, systemUpdates: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={businessOwnerPrefs.marketing} 
                      onChange={(e) => setBusinessOwnerPrefs({...businessOwnerPrefs, marketing: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={businessOwnerPrefs.securityAlerts} 
                      onChange={(e) => setBusinessOwnerPrefs({...businessOwnerPrefs, securityAlerts: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={businessOwnerPrefs.newFeatures} 
                      onChange={(e) => setBusinessOwnerPrefs({...businessOwnerPrefs, newFeatures: e.target.checked})} 
                      className="h-4 w-4 text-blue-600 rounded" 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={handleSavePreferences}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for notification items
function NotificationItem({ notification, onDelete }) {
  // Determine icon and color based on notification type
  const getTypeInfo = () => {
    switch (notification.type) {
      case 'info':
        return { icon: <FaBell className="text-blue-500" />, bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'success':
        return { icon: <FaCheckCircle className="text-green-500" />, bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'warning':
        return { icon: <FaBell className="text-yellow-500" />, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'error':
        return { icon: <FaTimesCircle className="text-red-500" />, bgColor: 'bg-red-100', textColor: 'text-red-800' };
      case 'system':
        return { icon: <FaBullhorn className="text-purple-500" />, bgColor: 'bg-purple-100', textColor: 'text-purple-800' };
      default:
        return { icon: <FaBell className="text-gray-500" />, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };
  
  const { icon, bgColor, textColor } = getTypeInfo();
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
          {icon}
          <span className="ml-1 capitalize">{notification.type}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {notification.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {notification.recipients}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {notification.date}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          notification.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {notification.status === 'sent' ? <FaCheckCircle className="mr-1" /> : null}
          <span className="capitalize">{notification.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button 
          className="text-gray-400 hover:text-red-600"
          onClick={onDelete}
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
}