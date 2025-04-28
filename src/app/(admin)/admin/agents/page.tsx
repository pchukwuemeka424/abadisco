'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { FaUserPlus, FaCheck, FaTimes, FaSpinner, FaBan, FaUser, FaEdit, FaUniversity } from 'react-icons/fa';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showModal, setShowModal] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    status: '',
    weekly_target: 40,
    weekly_target_met: false,
    current_week_registrations: 0,
    total_registrations: 0,
    total_businesses: 0,
    Bank_name: '',
    Bank_acno: '',
  });

  // Nigerian banks including OPay
  const nigerianBanks = [
    "Access Bank",
    "Citibank",
    "Ecobank Nigeria",
    "Fidelity Bank",
    "First Bank of Nigeria",
    "First City Monument Bank",
    "Guaranty Trust Bank",
    "Heritage Bank",
    "Jaiz Bank",
    "Keystone Bank",
    "OPay",
    "Palmpay",
    "Polaris Bank",
    "Providus Bank",
    "Stanbic IBTC Bank",
    "Standard Chartered Bank",
    "Sterling Bank",
    "SunTrust Bank",
    "Union Bank of Nigeria",
    "United Bank for Africa",
    "Unity Bank",
    "Wema Bank",
    "Zenith Bank"
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      setLoading(true);
      setMessage({ type: '', content: '' });
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAgents(data || []);
      
    } catch (error) {
      console.error('Error fetching agents:', error);
      setMessage({ type: 'error', content: 'Failed to load agents.' });
    } finally {
      setLoading(false);
    }
  }
  
  const openEditModal = (agent) => {
    setCurrentAgent(agent);
    setFormData({
      id: agent.id,
      email: agent.email,
      full_name: agent.full_name,
      phone: agent.phone || '',
      status: agent.status,
      weekly_target: agent.weekly_target || 40,
      weekly_target_met: agent.weekly_target_met || false,
      current_week_registrations: agent.current_week_registrations || 0,
      total_registrations: agent.total_registrations || 0,
      total_businesses: agent.total_businesses || 0,
      Bank_name: agent.Bank_name || '',
      Bank_acno: agent.Bank_acno || '',
    });
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setCurrentAgent(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'weekly_target' || name === 'current_week_registrations' || 
              name === 'total_registrations' || name === 'total_businesses' 
                ? parseInt(value) 
                : value,
    }));
  };
  
  const updateAgentStatus = async (agentId, newStatus) => {
    try {
      setLoading(true);
      setMessage({ type: '', content: '' });
      
      const { data, error } = await supabase
        .from('agents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', agentId)
        .select();
      
      if (error) throw error;
      
      // Update the local state with the updated agent
      setAgents((prevAgents) =>
        prevAgents.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent))
      );
      
      setMessage({ 
        type: 'success', 
        content: `Agent status updated to ${newStatus} successfully.` 
      });
      
    } catch (error) {
      console.error('Error updating agent status:', error);
      setMessage({ 
        type: 'error', 
        content: `Failed to update agent status: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveAgentChanges = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage({ type: '', content: '' });
      
      const { data, error } = await supabase
        .from('agents')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          status: formData.status,
          weekly_target: formData.weekly_target,
          weekly_target_met: formData.weekly_target_met,
          current_week_registrations: formData.current_week_registrations,
          total_registrations: formData.total_registrations,
          total_businesses: formData.total_businesses,
          Bank_name: formData.Bank_name,
          Bank_acno: formData.Bank_acno,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id)
        .select();
      
      if (error) throw error;
      
      // Update the local state with the updated agent
      setAgents((prevAgents) =>
        prevAgents.map((agent) => (agent.id === formData.id ? data[0] : agent))
      );
      
      setMessage({ 
        type: 'success', 
        content: 'Agent information updated successfully.' 
      });
      
      closeModal();
      
    } catch (error) {
      console.error('Error updating agent:', error);
      setMessage({ 
        type: 'error', 
        content: `Failed to update agent: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createNewAgent = async () => {
    // This would open a modal to create agent from admin side
    // For now, we'll just redirect to the agent signup page
    window.open('/auth/agent-signup', '_blank');
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Agents</h1>
        
        <button 
          onClick={createNewAgent}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <FaUserPlus className="mr-2" />
          Add New Agent
        </button>
      </div>
      
      {message.content && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message.content}
        </div>
      )}
      
      {loading && agents.length === 0 ? (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin h-8 w-8 mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading agents...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banking Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {agent.avatar_url ? (
                              <img
                                src={agent.avatar_url}
                                alt={agent.full_name}
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <FaUser className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.full_name}</div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{agent.phone || 'N/A'}</div>
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
                          <div>Weekly: {agent.current_week_registrations}/{agent.weekly_target}</div>
                          <div>Target Met: {agent.weekly_target_met ? 'Yes' : 'No'}</div>
                          <div>Total: {agent.total_registrations} users</div>
                          <div>Businesses: {agent.total_businesses}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {agent.Bank_name ? (
                            <>
                              <div>{agent.Bank_name}</div>
                              <div className="text-xs text-gray-500">{agent.Bank_acno || 'No account number'}</div>
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit agent"
                        >
                          <FaEdit className="inline" />
                        </button>
                        
                        {agent.status === 'pending' && (
                          <button
                            onClick={() => updateAgentStatus(agent.id, 'active')}
                            className="text-green-600 hover:text-green-900 ml-2"
                            title="Approve agent"
                          >
                            <FaCheck className="inline" />
                          </button>
                        )}
                        
                        {agent.status === 'active' && (
                          <button
                            onClick={() => updateAgentStatus(agent.id, 'suspended')}
                            className="text-red-600 hover:text-red-900 ml-2"
                            title="Suspend agent"
                          >
                            <FaBan className="inline" />
                          </button>
                        )}
                        
                        {agent.status === 'suspended' && (
                          <button
                            onClick={() => updateAgentStatus(agent.id, 'active')}
                            className="text-green-600 hover:text-green-900 ml-2"
                            title="Reactivate agent"
                          >
                            <FaCheck className="inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No agents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Edit Agent Modal */}
      {showModal && currentAgent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Edit Agent</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={saveAgentChanges} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weekly_target" className="block text-sm font-medium text-gray-700">
                      Weekly Target
                    </label>
                    <input
                      type="number"
                      id="weekly_target"
                      name="weekly_target"
                      value={formData.weekly_target}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="current_week_registrations" className="block text-sm font-medium text-gray-700">
                      Current Week Regs
                    </label>
                    <input
                      type="number"
                      id="current_week_registrations"
                      name="current_week_registrations"
                      value={formData.current_week_registrations}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="total_registrations" className="block text-sm font-medium text-gray-700">
                      Total Registrations
                    </label>
                    <input
                      type="number"
                      id="total_registrations"
                      name="total_registrations"
                      value={formData.total_registrations}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="total_businesses" className="block text-sm font-medium text-gray-700">
                      Total Businesses
                    </label>
                    <input
                      type="number"
                      id="total_businesses"
                      name="total_businesses"
                      value={formData.total_businesses}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 flex items-center mb-2">
                    <FaUniversity className="mr-1" /> Banking Information
                  </h4>
                  
                  <div className="mb-3">
                    <label htmlFor="Bank_name" className="block text-sm font-medium text-gray-700">
                      Bank Name
                    </label>
                    <select
                      id="Bank_name"
                      name="Bank_name"
                      value={formData.Bank_name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    >
                      <option value="">Select a bank</option>
                      {nigerianBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="Bank_acno" className="block text-sm font-medium text-gray-700">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      id="Bank_acno"
                      name="Bank_acno"
                      value={formData.Bank_acno}
                      onChange={handleChange}
                      maxLength={10}
                      minLength={10}
                      pattern="[0-9]{10}"
                      placeholder="10-digit account number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    id="weekly_target_met"
                    name="weekly_target_met"
                    type="checkbox"
                    checked={formData.weekly_target_met}
                    onChange={(e) => 
                      setFormData((prev) => ({ ...prev, weekly_target_met: e.target.checked }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weekly_target_met" className="ml-2 block text-sm text-gray-700">
                    Weekly Target Met
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}