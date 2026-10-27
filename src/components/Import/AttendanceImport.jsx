// components/Import/AttendanceImport.jsx - 考勤数据导入组件（原始考勤导入到月份动态表）
import React, { useState } from 'react';
import { importAttendanceExcel } from '../../api/attendance';
import './FileUpload.css';

const AttendanceImport = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 生成最近12个月的选项
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 13; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;

      options.push(
        <option key={value} value={value}>
          {label}
        </option>
      );
    }

    return options;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('请选择Excel文件(.xlsx, .xls, .csv)');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('请先选择文件');
      return;
    }
    if (!selectedMonth) {
      setUploadStatus('请选择月份');
      return;
    }

    setIsUploading(true);
    setUploadStatus('导入中...');

    try {
      // request 拦截器已解包，data 为导入结果对象
      const data = await importAttendanceExcel(selectedFile, selectedMonth);
      // 兼容 service 返回的不同结构：优先使用 count，其次 successCount
      const count = data?.count ?? data?.successCount ?? '未知';
      setUploadStatus(`导入成功：共处理 ${count} 条记录`);
    } catch (error) {
      console.error('上传错误:', error);
      setUploadStatus(`上传错误: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="import-panel">
      <div className="panel-header">
        <h3>考勤数据导入</h3>
        <p>按月份导入考勤数据并存储到数据库，用于考勤分析与统计</p>
      </div>
      
      <div className="upload-section">
        <div className="month-selector">
          <label htmlFor="month-select">选择月份:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">请选择月份</option>
            {generateMonthOptions()}
          </select>
        </div>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            id="attendance-file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="attendance-file-upload" className="file-input-label">
            选择Excel文件
          </label>
          {selectedFile && (
            <div className="file-name">
              {selectedFile.name}
            </div>
          )}
        </div>
        
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !selectedMonth || isUploading}
          className="upload-button"
        >
          {isUploading ? '导入中...' : '开始导入'}
        </button>
      </div>
      
      {uploadStatus && (
        <div className={`status-message ${uploadStatus.includes('成功') ? 'success' : 'error'}`}>
          {uploadStatus}
        </div>
      )}
      
      <div className="instructions">
        <h4>使用说明:</h4>
        <ul>
          <li>导入的考勤数据将存储到数据库中</li>
          <li>请选择正确的月份进行导入，避免数据重复</li>
          <li>文件必须包含: 工号、日期、上班时间、下班时间等字段</li>
          <li>支持的格式: .xlsx, .xls, .csv</li>
          <li>文件大小限制: 10MB</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceImport;