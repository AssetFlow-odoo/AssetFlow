import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ alerts }) => {
  if (!alerts) return null;
  
  const { overdueReturns, pendingMaintenance } = alerts;
  
  if (overdueReturns === 0 && pendingMaintenance === 0) {
    return null; // Don't show banner if no alerts
  }
  
  const messages = [];
  if (overdueReturns > 0) messages.push(`${overdueReturns} assets overdue for return`);
  if (pendingMaintenance > 0) messages.push(`${pendingMaintenance} pending maintenance tickets`);
  
  return (
    <div className="alert-banner">
      <div className="alert-left">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="alert-text">
          {messages.join(' and ')} —{' '}
          <span className="alert-highlight">flagged for follow-up</span>
        </span>
      </div>
      <button className="alert-view-btn">View All</button>
    </div>
  );
};

export default AlertBanner;
