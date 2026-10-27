// 薪酬相关接口
// 对应后端：modules/salary/routes.js
import request from '../utils/request';

/**
 * 获取薪酬期间列表（用于筛选器）
 * @returns Promise<string[]> 例如 ['2026-08', '2026-07', ...]
 */
export function getSalaryPeriods() {
  return request.get('/salary-periods');
}

/**
 * 获取所有期间的薪酬汇总（用于累计/平均计算）
 * @returns Promise<Array<{ 期间, 公司, 人员类别, 应计工资总和, 人数 }>>
 */
export function getAllSalaryData() {
  return request.get('/salary-all-data');
}

/**
 * 按维度筛选薪酬汇总
 * @param {string} period 必填，期间 YYYY-MM
 * @param {string[]} companies 公司列表
 * @param {string[]} categories 人员类别列表
 */
export function getSalarySummary({ period, companies = [], categories = [] }) {
  return request.get('/salary-summary', {
    params: { period, companies, categories }
  });
}

/**
 * 导入薪酬 Excel
 * @param {File} file Excel 文件
 */
export function importSalaryData(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/import-salary', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
