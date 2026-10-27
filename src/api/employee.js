// 员工相关接口
// 对应后端：routes/index.js（/personnel/list、/import-employees）
import request from '../utils/request';

/**
 * 获取员工列表（分页）
 * @param {number} page 当前页码（从 1 开始）
 * @param {number} size 每页条数
 * @returns Promise<{ list: Array, total: number }>
 */
export function getEmployeeList(page = 1, size = 10) {
  return request.get('/personnel/list', {
    params: { page, size }
  });
}

/**
 * 导入 PS 系统员工 Excel
 * @param {File} file Excel 文件
 * @param {string|number} sheetName 工作表名/索引（可选）
 * @returns Promise<{ details: { success: number, errors: Array } }>
 */
export function importEmployees(file, sheetName) {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName !== undefined) {
    formData.append('sheetName', sheetName);
  }
  return request.post('/import-employees', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
