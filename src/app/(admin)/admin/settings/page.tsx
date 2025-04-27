'use client';

import { useState, useEffect } from 'react';
import { FaCog, FaUserShield, FaDatabase, FaCloudUploadAlt, FaBell, FaGlobe, FaCheck } from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import { 
  fetchAllSettings, 
  updateSetting, 
  batchUpdateSettings, 
  exportUsersToCSV,
  exportUsersToJSON,
  fetchNotificationPreferences
} from './settingsService';

export default function SettingsPage() {
  // State for settings categories
  const [activeCategory, setActiveCategory] = useState('general');
  
  // States for general settings
  const [platformName, setPlatformName] = useState('Aba Markets');
  const [platformDescription, setPlatformDescription] = useState('Your gateway to Aba\'s vibrant markets and businesses.');
  const [contactEmail, setContactEmail] = useState('contact@abamarkets.com');
  
  // States for user registration settings
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [requireAdminApproval, setRequireAdminApproval] = useState(false);
  const [defaultUserRole, setDefaultUserRole] = useState('1');
  
  // State for data retention setting
  const [dataRetention, setDataRetention] = useState('never');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  // Success notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Error state
  const [error, setError] = useState('');

  // Fetch all settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await fetchAllSettings();
        
        // Update state with settings from database
        settings.forEach(setting => {
          switch(setting.key) {
            case 'platform_name':
              setPlatformName(setting.value);
              break;
            case 'platform_description':
              setPlatformDescription(setting.value);
              break;
            case 'contact_email':
              setContactEmail(setting.value);
              break;
            case 'allow_registration':
              setAllowRegistration(setting.value === 'true');
              break;
            case 'require_email_verification':
              setRequireEmailVerification(setting.value === 'true');
              break;
            case 'require_admin_approval':
              setRequireAdminApproval(setting.value === 'true');
              break;
            case 'default_user_role':
              setDefaultUserRole(setting.value);
              break;
            case 'data_retention':
              setDataRetention(setting.value);
              break;
          }
        });
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle settings category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };
  
  // Handle form field updates
  const handlePlatformNameUpdate = async () => {
    try {
      setLoading(true);
      await updateSetting('platform_name', platformName);
      showSuccessNotification('Platform name updated successfully');
    } catch (error) {
      console.error('Error updating platform name:', error);
      setError('Failed to update platform name.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlatformDescriptionUpdate = async () => {
    try {
      setLoading(true);
      await updateSetting('platform_description', platformDescription);
      showSuccessNotification('Platform description updated successfully');
    } catch (error) {
      console.error('Error updating platform description:', error);
      setError('Failed to update platform description.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContactEmailUpdate = async () => {
    try {
      setLoading(true);
      await updateSetting('contact_email', contactEmail);
      showSuccessNotification('Contact email updated successfully');
    } catch (error) {
      console.error('Error updating contact email:', error);
      setError('Failed to update contact email.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegistrationPreferencesUpdate = async () => {
    try {
      setLoading(true);
      await batchUpdateSettings([
        { key: 'allow_registration', value: allowRegistration.toString() },
        { key: 'require_email_verification', value: requireEmailVerification.toString() },
        { key: 'require_admin_approval', value: requireAdminApproval.toString() }
      ]);
      showSuccessNotification('Registration preferences updated successfully');
    } catch (error) {
      console.error('Error updating registration preferences:', error);
      setError('Failed to update registration preferences.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDefaultRoleUpdate = async () => {
    try {
      setLoading(true);
      await updateSetting('default_user_role', defaultUserRole);
      showSuccessNotification('Default user role updated successfully');
    } catch (error) {
      console.error('Error updating default user role:', error);
      setError('Failed to update default user role.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDataRetentionUpdate = async () => {
    try {
      setLoading(true);
      await updateSetting('data_retention', dataRetention);
      showSuccessNotification('Data retention setting updated successfully');
    } catch (error) {
      console.error('Error updating data retention:', error);
      setError('Failed to update data retention setting.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle data export
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const csv = await exportUsersToCSV();
      
      // Create and download CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aba_markets_users.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccessNotification('User data exported as CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export user data as CSV.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportJSON = async () => {
    try {
      setLoading(true);
      const data = await exportUsersToJSON();
      
      // Create and download JSON file
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'aba_markets_users.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccessNotification('User data exported as JSON successfully');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      setError('Failed to export user data as JSON.');
    } finally {
      setLoading(false);
    }
  };
  
  // Success notification helper
  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div>
      {/* Success notification */}
      {showNotification && (
        <div className="fixed top-5 right-5 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50 transition-opacity duration-300">
          <div className="flex items-center">
            <div className="py-1 mr-3">
              <FaCheck className="text-green-500" />
            </div>
            <div>
              <p className="font-bold">Success</p>
              <p className="text-sm">{notificationMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error notification */}
      {error && (
        <div className="fixed top-5 right-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md z-50">
          <div className="flex items-center">
            <div className="py-1 mr-3">
              <FaCheck className="text-red-500" />
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
              <button 
                className="text-xs text-red-700 underline mt-1" 
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2">Updating settings...</p>
          </div>
        </div>
      )}
      
      {/* Settings sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50">
              <h2 className="text-lg font-medium text-blue-700">Settings Categories</h2>
            </div>
            <div className="p-1">
              <nav className="space-y-1">
                {[
                  { id: 'general', name: 'General Settings', icon: <FaCog /> },
                  { id: 'permissions', name: 'User Permissions', icon: <FaUserShield /> },
                  { id: 'database', name: 'Database Management', icon: <FaDatabase /> },
                  { id: 'storage', name: 'Storage Settings', icon: <FaCloudUploadAlt /> },
                  { id: 'notifications', name: 'Notification Settings', icon: <FaBell /> },
                  { id: 'site', name: 'Site Configuration', icon: <FaGlobe /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryChange(item.id)}
                    className={`w-full flex items-center px-5 py-3 transition-colors hover:bg-blue-50 ${
                      activeCategory === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {/* General Settings Section */}
          {activeCategory === 'general' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h2 className="text-lg font-medium text-blue-700">General Settings</h2>
                <p className="text-sm text-blue-600">Basic platform configuration</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Platform Name Setting */}
                <div>
                  <h3 className="text-md font-medium mb-2">Platform Name</h3>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={handlePlatformNameUpdate}
                      disabled={loading}
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                {/* Platform Description Setting */}
                <div>
                  <h3 className="text-md font-medium mb-2">Platform Description</h3>
                  <div>
                    <textarea
                      rows={3}
                      value={platformDescription}
                      onChange={(e) => setPlatformDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={handlePlatformDescriptionUpdate}
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                {/* Contact Email Setting */}
                <div>
                  <h3 className="text-md font-medium mb-2">Contact Email</h3>
                  <div className="flex items-center">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={handleContactEmailUpdate}
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                {/* User Registration */}
                <div className="pt-4 border-t">
                  <h3 className="text-md font-medium mb-3">User Registration</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allow_registration"
                        checked={allowRegistration}
                        onChange={(e) => setAllowRegistration(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="allow_registration" className="ml-2 text-gray-700">
                        Allow new user registrations
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email_verification"
                        checked={requireEmailVerification}
                        onChange={(e) => setRequireEmailVerification(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="email_verification" className="ml-2 text-gray-700">
                        Require email verification
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="admin_approval"
                        checked={requireAdminApproval}
                        onChange={(e) => setRequireAdminApproval(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="admin_approval" className="ml-2 text-gray-700">
                        Require admin approval for new accounts
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={handleRegistrationPreferencesUpdate}
                  >
                    Save Preferences
                  </button>
                </div>
                
                {/* Default User Role */}
                <div className="pt-4 border-t">
                  <h3 className="text-md font-medium mb-2">Default User Role</h3>
                  <div className="flex items-center">
                    <select 
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      value={defaultUserRole}
                      onChange={(e) => setDefaultUserRole(e.target.value)}
                    >
                      <option value="1">Regular User (role 1)</option>
                      <option value="2">Business Owner (role 2)</option>
                      <option value="0">Administrator (role 0)</option>
                    </select>
                    <button 
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={handleDefaultRoleUpdate}
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Role assigned to new user registrations
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Only show the User Data Management section for database category or general category */}
          {(activeCategory === 'general' || activeCategory === 'database') && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h2 className="text-lg font-medium text-blue-700">User Data Management</h2>
                <p className="text-sm text-blue-600">Configure user table and data settings</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Database Backup */}
                <div>
                  <h3 className="text-md font-medium mb-2">User Table Backup</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Export and backup user data from the users table
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </button>
                    <button 
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      onClick={handleExportJSON}
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
                
                {/* Data Retention */}
                <div className="pt-4 border-t">
                  <h3 className="text-md font-medium mb-2">Data Retention</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delete inactive users after:
                    </label>
                    <div className="flex items-center">
                      <select 
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={dataRetention}
                        onChange={(e) => setDataRetention(e.target.value)}
                      >
                        <option value="never">Never</option>
                        <option value="6">6 months</option>
                        <option value="12">1 year</option>
                        <option value="24">2 years</option>
                      </select>
                      <button 
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={handleDataRetentionUpdate}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for other settings categories */}
          {activeCategory !== 'general' && activeCategory !== 'database' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <FaCog className="text-gray-300 text-5xl mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Settings
                </h3>
                <p className="text-gray-500 text-center">
                  This settings category is under development. Please check back later.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}