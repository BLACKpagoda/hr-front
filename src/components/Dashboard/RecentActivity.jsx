// components/Dashboard/RecentActivity.js
import React from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const activities = [
    { id: 1, action: '数据同步', user: '管理员', time: '10分钟前' },
    { id: 2, action: '员工信息导入', user: '管理员', time: '1小时前' },
    { id: 3, action: '考勤数据更新', user: '系统', time: '2小时前' },
  ];

  return (
    <div className="recent-activity">
      <ul>
        {activities.map(activity => (
          <li key={activity.id} className="activity-item">
            <div className="activity-content">
              <span className="activity-action">{activity.action}</span>
              <span className="activity-user">由 {activity.user}</span>
            </div>
            <span className="activity-time">{activity.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity; // 确保使用默认导出