import React, { useState } from 'react';
import axios from 'axios';
import './SyncButton.css'; // 样式文件

const SyncButton = () => {
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // 处理同步操作
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('同步中...');
    setSyncResult(null);

    try {
      // 发送请求到后端同步API
      const response = await axios.get('http://localhost:3001/sync');
      
      if (response.data.success) {
        setSyncStatus('同步成功');
        setSyncResult(response.data);
      } else {
        setSyncStatus(`同步失败: ${response.data.error}`);
      }
    } catch (error) {
      console.error('同步错误:', error);
      setSyncStatus(`同步错误: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="sync-container">
      <h2>考勤数据同步</h2>
      
      <div className="sync-section">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="sync-button"
        >
          {isSyncing ? '同步中...' : '开始同步'}
        </button>
        
        {syncStatus && (
          <div className={`status-message ${syncStatus.includes('成功') ? 'success' : syncStatus.includes('中') ? 'info' : 'error'}`}>
            {syncStatus}
          </div>
        )}
      </div>
      
      {syncResult && (
        <div className="sync-result">
          <h3>同步结果详情</h3>
          <div className="result-grid">
            <div className="result-item">
              <span className="label">原始记录:</span>
              <span className="value">{syncResult.recordCount || 0} 条</span>
            </div>
            <div className="result-item">
              <span className="label">每日状态:</span>
              <span className="value">{syncResult.dailyStatusCount || 0} 条</span>
            </div>
            <div className="result-item">
              <span className="label">打卡明细:</span>
              <span className="value">{syncResult.detailCount || 0} 条</span>
            </div>
            <div className="result-item">
              <span className="label">月度汇总:</span>
              <span className="value">{syncResult.summaryCount || 0} 条</span>
            </div>
          </div>
          
          {syncResult.message && (
            <div className="result-message">
              {syncResult.message}
            </div>
          )}
        </div>
      )}
      
      <div className="instructions">
        <h3>使用说明:</h3>
        <ul>
          <li>点击"开始同步"按钮将从钉钉系统同步考勤数据</li>
          <li>同步过程可能需要几分钟时间，请耐心等待</li>
          <li>同步数据包括最近31天的考勤记录</li>
          <li>同步完成后会显示详细的统计结果</li>
          <li>建议每天定时同步一次以确保数据最新</li>
        </ul>
      </div>
    </div>
  );
};

export default SyncButton;