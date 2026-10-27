// Attendance.jsx - 餐补分析考勤导入页面
import React, { useState } from 'react';
import { importAttendanceForMeal } from '../../api/attendance';
import './Attendance.css';

const Attendance = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [month, setMonth] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!selectedFile || !month) {
      setErrorMsg('请选择文件和月份');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // request 拦截器已解包，data 直接是 { successCount, errors, attendanceSummary }
      const result = await importAttendanceForMeal(selectedFile, month);
      setImportResult(result);
    } catch (error) {
      console.error('导入失败', error);
      setErrorMsg(error.message || '导入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-import">
      <h3>考勤数据导入（餐补分析）</h3>
      <div className="form-group">
        <label>选择月份：</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>选择钉钉考勤文件：</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </div>
      <button
        onClick={handleImport}
        disabled={loading || !selectedFile || !month}
      >
        {loading ? '导入中...' : '开始导入'}
      </button>

      {errorMsg && (
        <div className="error-message">{errorMsg}</div>
      )}

      {importResult && (
        <div className="import-result">
          <h4>导入结果</h4>
          <p>成功处理 {importResult.successCount} 条记录</p>
          {importResult.errors && importResult.errors.length > 0 && (
            <div>
              <p>错误记录：</p>
              <ul>
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <h4>出勤统计结果</h4>
          <table border="1">
            <thead>
              <tr>
                <th>员工姓名</th>
                <th>员工ID</th>
                <th>实际出勤天数</th>
              </tr>
            </thead>
            <tbody>
              {(importResult.attendanceSummary || []).map((item, index) => (
                <tr key={item.employeeId || index}>
                  <td>{item.employeeName}</td>
                  <td>{item.employeeId}</td>
                  <td>{item.actualWorkDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Attendance;