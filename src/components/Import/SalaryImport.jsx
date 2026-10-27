// components/Import/SalaryImport.jsx - 薪资数据导入组件
import React, { useState } from 'react';
import { importSalaryData } from '../../api/salary';
import './FileUpload.css';

const SalaryImport = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setUploadStatus('');
        setIsError(false);
      } else {
        setUploadStatus('请选择Excel文件(.xlsx, .xls, .csv)');
        setIsError(true);
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
    setIsError(false);

    try {
      // request 拦截器已解包，data 为导入结果对象
      const data = await importSalaryData(selectedFile);
      // 后端返回结构：{ sheet名: { success, newCount, existCount, message } } 或 { error }
      const result = data && data.error
        ? { success: false, message: data.error }
        : (Object.values(data || {})[0] || {});

      if (result.success) {
        setIsError(false);
        setUploadStatus(
          `导入成功：新增 ${result.newCount ?? 0} 条` +
          (result.existCount ? `，已存在 ${result.existCount} 条` : '')
        );
      } else {
        setIsError(true);
        setUploadStatus(`导入失败：${result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('上传错误:', error);
      setIsError(true);
      setUploadStatus(`导入失败：${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="import-panel">
      <div className="panel-header">
        <h3>薪资数据导入</h3>
        <p>导入薪资数据并存储到数据库，用于薪酬分析</p>
      </div>
      
      <div className="upload-section">
        {/* 移除月份选择器 */}
        <div className="file-input-wrapper">
          <input
            type="file"
            id="salary-file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="salary-file-upload" className="file-input-label">
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
          {isUploading ? '导入中...' : '确认导入'}
        </button>
      </div>
      
      {uploadStatus && (
        <div className={`status-message ${isError ? 'error' : 'success'}`}>
          {uploadStatus}
        </div>
      )}
      
      <div className="instructions">
        <h4>使用说明:</h4>
        <ul>
          <li>导入的薪资数据将存储到数据库中</li>
          <li>支持导入一整份包含多月份的薪资数据</li>
          <li>文件必须包含: 工号、姓名、月份、基本工资、绩效奖金、扣款等字段</li>
          <li>支持的格式: .xlsx, .xls, .csv</li>
          <li>文件大小限制: 10MB</li>
        </ul>
      </div>
    </div>
  );
};

export default SalaryImport;