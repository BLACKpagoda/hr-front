// App.js - 主应用组件
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainContent from './components/Layout/MainContent';
import Dashboard from './pages/Dashboard/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement/EmployeeManagement';
import Attendance from './pages/Attendance/Attendance';
import ImportData from './pages/ImportData/ImportData';
import DataSync from './pages/DataSync/DataSync';
import AttendanceBoard from './pages/AttendanceBoard/AttendanceBoard';
import SystemSettings from './pages/SystemSettings/SystemSettings';
import SalaryAnalysis from './pages/SalaryAnalysis/SalaryAnalysis';
import Fanruan from './pages/Fanruan/Fanruan'
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Router>
      <div className="app">
        <Header 
          sidebarCollapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
        <div className="app-body">
          <Sidebar collapsed={sidebarCollapsed} />
          <MainContent>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/import" element={<ImportData />} />
              <Route path="/sync" element={<DataSync/>} />
              <Route path="/attendance-board" element={<AttendanceBoard />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="/fanruan" element={<Fanruan/>}/>
              <Route path="/salary-analysis" element={<SalaryAnalysis />} />
            </Routes>
          </MainContent>
        </div>
      </div>
    </Router>
  );
}

export default App;