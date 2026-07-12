import React from 'react';
import './RecentActivity.css';

const activities = [
  {
    id: 1,
    name: 'Laptop AF-0114',
    detail: 'Allocated to Priya Shah · IT Dept',
    time: '2 min ago',
    icon: '💻',
    iconBg: '#1A2A4A',
  },
  {
    id: 2,
    name: 'Room B2',
    detail: 'Booking confirmed · 2:00 to 3:00 PM',
    time: '16 min ago',
    icon: '📅',
    iconBg: '#1A2A3A',
  },
  {
    id: 3,
    name: 'Projector AF-0062',
    detail: 'Maintenance required',
    time: '1 hr ago',
    icon: '🔧',
    iconBg: '#2A1A2A',
  },
];

const RecentActivity = () => (
  <div className="ra-card">
    <div className="ra-header">
      <h2 className="ra-title">Recent Activity</h2>
      <a href="#" className="ra-view-all">View all →</a>
    </div>
    <div className="ra-list">
      {activities.map((a) => (
        <div className="ra-item" key={a.id}>
          <div className="ra-icon" style={{ backgroundColor: a.iconBg }}>{a.icon}</div>
          <div className="ra-info">
            <p className="ra-name">{a.name}</p>
            <p className="ra-detail">{a.detail}</p>
          </div>
          <span className="ra-time">{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RecentActivity;
