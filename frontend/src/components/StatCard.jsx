import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, valueColor, icon, iconColor }) => (
  <div className="stat-card">
    <div className="stat-card-top">
      <p className="stat-card-label">{label}</p>
      <span className="stat-card-icon" style={{ color: iconColor }}>{icon}</span>
    </div>
    <p className="stat-card-value" style={{ color: valueColor }}>{value}</p>
  </div>
);

export default StatCard;
