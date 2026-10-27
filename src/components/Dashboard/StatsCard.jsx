// components/Dashboard/StatsCard.js
import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="stats-card" style={{ borderLeftColor: color }}>
      <div className="stats-icon">
        <i className={icon} style={{ color }}></i>
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

export default StatsCard; // 确保使用默认导出