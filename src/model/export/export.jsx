import React, { useState } from 'react';
import axios from 'axios';
import './fileUpload.css'; // 样式文件

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 检查文件类型
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

  // 处理文件上传
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadStatus('上传中...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // 发送请求到后端API
      const response = await axios.post('http://localhost:3001/import-employees', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUploadStatus(`上传成功: ${response.data.message}`);
      } else {
        setUploadStatus(`上传失败: ${response.data.error}`);
      }
    } catch (error) {
      console.error('上传错误:', error);
      setUploadStatus(`上传错误: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>员工数据导入</h2>
      
      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="file-upload" className="file-input-label">
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
        <h3>使用说明:</h3>
        <ul>
          <li>请确保Excel文件的列与数据库表结构完全一致</li>
          <li>支持的格式: .xlsx, .xls, .csv</li>
          <li>文件大小限制: 10MB</li>
          <li>上传过程可能需要几秒钟，请耐心等待</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;