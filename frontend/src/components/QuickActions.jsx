import React from 'react';
import './QuickActions.css';

const QuickActions = () => (
  <div className="qa-card">
    <div className="qa-header">
      <h2 className="qa-title">Quick Actions</h2>
    </div>
    <div className="qa-body">
      {/* Primary Button — exactly as in Figma */}
      <button className="qa-btn-primary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Request New Asset
      </button>

      {/* Secondary Button — exactly as in Figma */}
      <button className="qa-btn-secondary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Report an Issue
      </button>
    </div>
  </div>
);

export default QuickActions;
