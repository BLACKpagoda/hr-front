// pages/ImportData.js - 优化后的数据导入页面
import React, { useState } from 'react';
import EmployeeImport from '../../components/Import/EmployeeImport';
import AttendanceImport from '../../components/Import/AttendanceImport';
import SalaryImport from '../../components/Import/SalaryImport';
import './ImportData.css';

const ImportData = () => {
  const [activeTab, setActiveTab] = useState('employee');
  
  const tabs = [
    { id: 'employee', label: '员工数据导入', icon: 'fas fa-user-plus' },
    { id: 'attendance', label: '考勤数据导入', icon: 'fas fa-calendar-alt' },
    { id: 'salary', label: '薪资数据导入', icon: 'fas fa-money-bill-wave' },
  ];

  return (
    <div className="import-data">
      <div className="page-header">
        <h2>数据导入</h2>
        <div className="header-description">
          <p>
            <strong>数据导入 vs 数据同步:</strong> 
            数据同步用于每日自动更新考勤数据到数据库，而数据导入用于按月导入历史数据进行分析处理，不直接存入数据库。
          </p>
        </div>
      </div>
      
      <div className="import-tabs">
        <div className="tab-buttons">
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
        
        <div className="tab-content">
          {activeTab === 'employee' && (
            <div className="tab-panel">
              <EmployeeImport />
            </div>
          )}
          
          {activeTab === 'attendance' && (
            <div className="tab-panel">
              <AttendanceImport />
            </div>
          )}
          
          {activeTab === 'salary' && (
            <div className="tab-panel">
              <SalaryImport />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportData;