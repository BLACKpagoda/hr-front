// 帆软相关接口
// 对应后端：routes/index.js（/export-fanruan）
import request from '../utils/request';

/**
 * 导入帆软指标 Excel
 * @param {File} file Excel 文件
 */
export function exportFanruan(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/export-fanruan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
