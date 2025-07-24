import React from 'react';

interface ProfileCardProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    created_at: string;
    last_login?: string;
    role?: string;
  } | null;
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, loading, error, onRefresh }) => {
  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">Loading...</div>;
  if (error) return <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-red-600">{error}</div>;
  if (!user) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Your Profile</h2>
        <a href="/dashboard/profile" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">Edit</a>
      </div>
      <div className="p-6 flex items-center">
        <div className="relative w-16 h-16 mr-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{user.full_name || 'Unnamed User'}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 