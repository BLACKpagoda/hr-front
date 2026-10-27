// components/Layout/Header.js - 顶部导航组件
import React from 'react';
import './Header.css';

const Header = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <i className={`fas fa-${sidebarCollapsed ? 'indent' : 'outdent'}`}></i>
        </button>
        <h1 className="header-title">人力资源管理系统</h1>
      </div>
      <div className="header-right">
        <button className="header-btn">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">3</span>
        </button>
        <button className="header-btn">
          <i className="fas fa-user"></i>
          <span>管理员</span>
        </button>
      </div>
    </header>
  );
};

export default Header;