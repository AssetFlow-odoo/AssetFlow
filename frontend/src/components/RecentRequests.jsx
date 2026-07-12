import React from 'react';
import './RecentRequests.css';

const requests = [
  { id: 1, name: 'Logitech MX Master 3S', category: 'Mouse',       time: '2 days ago',  status: 'Pending'  },
  { id: 2, name: 'USB-C Hub',             category: 'Accessories', time: '1 week ago',  status: 'Approved' },
];

const RecentRequests = () => (
  <div className="rr-card">
    <div className="rr-header">
      <h2 className="rr-title">Recent Requests</h2>
    </div>

    <div className="rr-list">
      {requests.map((r) => (
        <div className="rr-item" key={r.id}>
          <div className="rr-item-left">
            <div className="rr-item-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="rr-item-info">
              <span className="rr-item-name">{r.name}</span>
              <span className="rr-item-meta">{r.category} · {r.time}</span>
            </div>
          </div>
          <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RecentRequests;
