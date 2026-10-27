// pages/SystemSettings.js - 系统设置页面
import React, { useState } from 'react';
import './SystemSettings.css';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: '常规设置', icon: 'fas fa-cog' },
    { id: 'notifications', label: '通知设置', icon: 'fas fa-bell' },
    { id: 'users', label: '用户管理', icon: 'fas fa-users' },
    { id: 'permissions', label: '权限设置', icon: 'fas fa-lock' },
  ];

  return (
    <div className="system-settings">
      <div className="page-header">
        <h2>系统设置</h2>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="tab-content">
              <h3>常规设置</h3>
              <div className="form-group">
                <label htmlFor="company-name">公司名称</label>
                <input
                  type="text"
                  id="company-name"
                  defaultValue="一汽铸造有限公司"
                />
              </div>
              <div className="form-group">
                <label htmlFor="system-name">系统名称</label>
                <input
                  type="text"
                  id="system-name"
                  defaultValue="人力资源管理系统"
                />
              </div>
              <div className="form-group">
                <label htmlFor="timezone">时区设置</label>
                <select id="timezone" defaultValue="+8">
                  <option value="+8">UTC+8 (北京时间)</option>
                  <option value="+0">UTC+0 (伦敦时间)</option>
                  <option value="-5">UTC-5 (纽约时间)</option>
                </select>
              </div>
              <button className="btn-primary">保存设置</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h3>通知设置</h3>
              <p>通知设置功能开发中...</p>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="tab-content">
              <h3>用户管理</h3>
              <p>用户管理功能开发中...</p>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="tab-content">
              <h3>权限设置</h3>
              <p>权限设置功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;