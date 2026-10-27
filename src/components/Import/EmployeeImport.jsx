// components/Import/EmployeeImport.jsx - 员工数据导入组件
import React, { useState } from 'react';
import { importEmployees } from '../../api/employee';
import './FileUpload.css';

const EmployeeImport = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

    setIsUploading(true);
    setUploadStatus('上传中...');

    try {
      // request 拦截器已解包，data = { details: { success: number, errors: Array } }
      const data = await importEmployees(selectedFile);
      const details = data?.details || { success: 0, errors: [] };
      setUploadStatus(
        `上传成功：成功 ${details.success} 条，失败 ${(details.errors || []).length} 条`
      );
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
        <h3>员工数据导入</h3>
        <p>导入员工基本信息到数据库，用于系统基础数据管理</p>
      </div>
      
      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="employee-file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="employee-file-upload" className="file-input-label">
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
          disabled={!selectedFile || isUploading}
          className="upload-button"
        >
          {isUploading ? '上传中...' : '确认上传'}
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
          <li>导入的员工数据将直接存入数据库</li>
          <li>用于初始化系统或批量更新员工信息</li>
          <li>文件必须包含: 工号、姓名、部门、职位等必要字段</li>
          <li>支持的格式: .xlsx, .xls, .csv</li>
          <li>文件大小限制: 10MB</li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeeImport;