import React from 'react';

export interface Activity {
  id: string;
  description: string;
  created_at: string;
  type: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  getActivityIcon: (type: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, getActivityIcon, formatDate }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
      <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">Last 5 events</div>
    </div>
    <div className="p-1 overflow-hidden">
      {activities.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  {getActivityIcon(activity.type || 'default')}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                  <time className="text-xs text-slate-500 mt-1">{formatDate(activity.created_at)}</time>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            {/* Empty state icon */}
            <svg className="text-slate-400 w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">No Recent Activity</h3>
          <p className="text-center text-slate-500 mb-6">Your recent activities will appear here as you interact with the marketplace.</p>
        </div>
      )}
    </div>
  </div>
);

export default ActivityFeed; 