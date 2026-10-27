// pages/Dashboard.js - 仪表盘页面
import React from 'react';
import StatsCard from '../../components/Dashboard/StatsCard';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import './Dashboard.css';

const Dashboard = () => {
  const statsData = [
    { title: '员工总数', value: '156', icon: 'fas fa-users', color: '#3498db' },
    { title: '本月出勤率', value: '96.5%', icon: 'fas fa-calendar-check', color: '#2ecc71' },
    { title: '待处理审批', value: '12', icon: 'fas fa-clipboard-list', color: '#e74c3c' },
    { title: '系统状态', value: '正常', icon: 'fas fa-server', color: '#f39c12' },
  ];

  return (
    <div className="dashboard">
      <h2>系统概览</h2>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="dashboard-content">
        <div className="recent-activities">
          <h3>最近活动</h3>
          <RecentActivity />
        </div>

        <div className="quick-actions">
          <h3>快捷操作</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.location.href = '/sync'}>
              <i className="fas fa-sync"></i>
              <span>同步考勤数据</span>
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/import'}>
              <i className="fas fa-upload"></i>
              <span>导入员工数据</span>
            </button>
            <button className="action-btn">
              <i className="fas fa-download"></i>
              <span>导出报表</span>
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/settings'}>
              <i className="fas fa-cog"></i>
              <span>系统设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;