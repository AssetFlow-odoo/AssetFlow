import React from 'react';
import './RecentActivity.css';

// Simple time formatter
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

const RecentActivity = ({ activities = [] }) => (
  <div className="ra-card">
    <div className="ra-header">
      <h2 className="ra-title">Recent Activity</h2>
      <a href="#" className="ra-view-all">View all →</a>
    </div>
    <div className="ra-list">
      {activities.length === 0 ? (
        <p className="ra-detail" style={{ padding: '1rem', textAlign: 'center' }}>No recent activity.</p>
      ) : (
        activities.map((a) => (
          <div className="ra-item" key={a.id}>
            <div className="ra-icon" style={{ backgroundColor: a.iconBg }}>{a.icon}</div>
            <div className="ra-info">
              <p className="ra-name">{a.name}</p>
              <p className="ra-detail">{a.detail}</p>
            </div>
            <span className="ra-time">{formatTimeAgo(a.time)}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default RecentActivity;
