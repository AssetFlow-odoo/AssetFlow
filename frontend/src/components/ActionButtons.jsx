import React from 'react';
import './ActionButtons.css';

const ActionButtons = () => (
  <div className="action-row">
    <button className="action-btn action-btn--primary">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Register Asset
    </button>
    <button className="action-btn action-btn--secondary">Book Resource</button>
    <button className="action-btn action-btn--secondary">Raise Request</button>
  </div>
);

export default ActionButtons;
