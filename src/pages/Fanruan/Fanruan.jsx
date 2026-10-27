import React, { useState } from 'react';
import { exportFanruan } from '../../api/fanruan';

const Fanruan = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('请选择Excel文件（.xlsx/.xls）');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      // request 拦截器已解包，data 为帆软导入结果对象（按工作表名映射）
      const data = await exportFanruan(file);
      setResult(data);
    } catch (err) {
      setError(err.message || '上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: '20px' }}>
      <h3>人力资源数据导入</h3>
      <div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
        />
        {file && <p>已选择文件: {file.name}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          style={{ 
            margin: '10px 0', 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {loading ? '导入中...' : '开始导入'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h4>导入结果</h4>
          <table border="1" cellPadding="8" cellSpacing="0">
            <thead>
              <tr>
                <th>工作表</th>
                <th>状态</th>
                <th>导入条数</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result).map(([sheet, data]) => (
                <tr key={sheet}>
                  <td>{sheet}</td>
                  <td style={{ color: data.success ? 'green' : 'red' }}>
                    {data.success ? '成功' : '失败'}
                  </td>
                  <td>{data.success ? data.count : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Fanruan;