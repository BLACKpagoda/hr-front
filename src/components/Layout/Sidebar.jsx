// components/Layout/Sidebar.js - 侧边菜单组件
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const menuItems = [
    { path: '/', icon: 'fas fa-tachometer-alt', label: '仪表盘（未上线）', exact: true },
    { path: '/employees', icon: 'fas fa-users', label: '员工管理（未上线）' },
    { path: '/sync', icon: 'fas fa-sync-alt', label: '考勤数据同步（未上线）' }, // 新增
    { path: '/attendance-board', icon: 'fas fa-chart-bar', label: '考勤看板（开发中）' },
    { path: '/settings', icon: 'fas fa-cog', label: '系统设置（未上线）' },
    { path: '/fanruan', icon: 'fas fa-cog', label: '指标数据导入（未上线）' },
    { path: '/attendance', icon: 'fas fa-calendar-check', label: '考勤餐补工具（已上线）' },
    { path: '/import', icon: 'fas fa-file-import', label: '数据导入（已上线）' },
    { path: '/salary-analysis', icon: 'fas fa-cog', label: '薪酬数据分析（已上线）' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <i className={item.icon}></i>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="system-info">
            <p>HR System v1.0</p>
            <p>© 2023 一汽铸造有限公司</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;