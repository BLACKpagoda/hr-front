// 考勤相关接口
// 对应后端：modules/attendance-excel/routes.js、modules/attendance-sync/routes.js、modules/attendance-board/routes.js
import request from '../utils/request';
import * as mockBoard from '../mock/attendanceBoardMock';

// 考勤看板 Mock 开关：默认关闭（走真实后端）
// 仅当显式设置 REACT_APP_USE_MOCK=true 时才启用假数据，例如：REACT_APP_USE_MOCK=true npm start
//
// 注意：原实现是 `!== 'false'`（默认开启）。CRA 在 `npm run build` 时只加载
// .env + .env.production，而这两个文件都没有定义该变量，导致生产构建静默返回
// mock 假数据。改为显式白名单后，任何环境漏配都默认走真实接口，不会静默造假。
export const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

/**
 * 餐补分析考勤导入（解析餐补，存入 employee_attendance_summary 表）
 * @param {File} file Excel 文件
 * @param {string} month 月份 YYYY-MM
 * @returns Promise<{ successCount: number, errors: Array, attendanceSummary: Array }>
 */
export function importAttendanceForMeal(file, month) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month);
  return request.post('/attendance/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * 原始考勤 Excel 导入（存入月份动态表）
 * @param {File} file Excel 文件
 * @param {string} month 月份 YYYY-MM
 */
export function importAttendanceExcel(file, month) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month);
  return request.post('/attendance/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * 钉钉考勤数据同步（异步模式，方案B）
 * 后端立即返回 jobId，不阻塞；前端通过 getSyncStatus 轮询进度
 * 后端实际参数：{ fromDate, toDate, refreshMapping }，兼容 startDate/endDate
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @returns Promise<{ jobId: string, message: string }>
 */
export function syncAttendance({ startDate, endDate }) {
  return request.post('/sync', { startDate, endDate, refreshMapping: true });
}

/**
 * 轮询同步任务状态
 * @param {string} jobId
 * @returns Promise<{
 *   id: string, status: 'running'|'done'|'error', progress: number,
 *   stage: string, logs: Array<{ time, message, type }>,
 *   result: object|null, error: string|null
 * }>
 */
export function getSyncStatus(jobId) {
  return request.get(`/sync/status/${jobId}`);
}

/**
 * 获取已同步数据覆盖范围（用于看板初始化时自动选择有数据的日期范围）
 * @returns Promise<{
 *   daily_result: { min_date: string, max_date: string, total_rows: number },
 *   leave_status: { ... },
 *   dept_daily: { ... },
 *   emp_monthly: { min_month: string, max_month: string, total_rows: number }
 * }>
 */
export function getDataCoverage() {
  return request.get('/sync/coverage');
}

/**
 * 导入花名册 Excel（用于精准匹配钉钉用户）
 * @param {File} file Excel 文件（含工号、姓名、部门、手机号、身份证）
 * @param {string} month 月份 YYYY-MM
 * @returns Promise<{ total: number, inserted: number, skipped: number, month: string }>
 */
export function importRoster(file, month) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month);
  return request.post('/roster/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

/**
 * 查看花名册各月概况
 * @returns Promise<Array<{ year_month, total, active, has_mobile }>>
 */
export function getRosterStats() {
  return request.get('/roster/stats');
}

/* ========================================================================== */
/* 以下为考勤看板（AttendanceBoard）相关接口                                       */
/* 后端对应模块：modules/attendance-board/{routes,controller,service}.js           */
/* 在 hrdb/routes/index.js 中挂载：router.use('/', require('../modules/attendance-board/routes')) */
/* 统一查询参数：startDate(YYYY-MM-DD)、endDate(YYYY-MM-DD)、departmentPath?（部门路径前缀匹配） */
/* 数据来源：hrdb 现有表 attendance_daily_result / attendance_leave_status /        */
/*           attendance_department_daily / attendance_employee_monthly（详见 API_CONTRACT.md 第十三章） */
/* ========================================================================== */

/**
 * 看板筛选条件（部门路径列表）
 * @returns Promise<{ departments: Array<{path: string, name: string}> }>
 */
export function getBoardOptions() {
  if (USE_MOCK) return Promise.resolve(mockBoard.getBoardOptions());
  return request.get('/attendance/board/options');
}

/**
 * 板块1：考勤总览 KPI + 状态分布
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<{
 *   kpi: {
 *     shouldAttendCount: number,      // 应考勤人·天
 *     actualAttendCount: number,      // 实际打卡人·天
 *     attendanceRate: number,         // 出勤率（0-100，保留1位）
 *     lateCount: number,              // 迟到总人次
 *     earlyLeaveCount: number,        // 早退总人次
 *     missCardCount: number,          // 缺卡人次
 *     absentCount: number,            // 旷工人次
 *     leaveDuration: number,          // 请假总时长（小时）
 *     overtimeDuration: number,       // 加班总时长（小时）
 *     outingCount: number             // 外出人次
 *   },
 *   statusDistribution: Array<{ name: string, value: number }>
 * }>
 */
export function getBoardOverview(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getBoardOverview(params));
  return request.get('/attendance/board/overview', { params });
}

/**
 * 板块2：部门维度统计
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<Array<{
 *   departmentPath: string,
 *   departmentName: string,
 *   headcount: number,
 *   actualAttendCount: number,
 *   attendanceRate: number,
 *   lateCount: number,
 *   earlyLeaveCount: number,
 *   missCardCount: number,
 *   absentCount: number,
 *   leaveDuration: number,
 *   overtimeDuration: number
 * }>>
 */
export function getBoardDepartmentStats(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getBoardDepartmentStats(params));
  return request.get('/attendance/board/department-stats', { params });
}

/**
 * 板块3-1：高频迟到人员 TOP
 * @param {object} params { startDate, endDate, departmentPath?, limit? }
 * @returns Promise<Array<{ userId, userName, departmentName, lateCount, lateDuration }>>
 *   lateDuration 单位：分钟
 */
export function getAbnormalLateRank(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getAbnormalLateRank(params));
  return request.get('/attendance/board/abnormal/late-rank', { params });
}

/**
 * 板块3-2：高频缺卡人员清单
 * @param {object} params { startDate, endDate, departmentPath?, limit? }
 * @returns Promise<Array<{ userId, userName, departmentName, misscardCount }>>
 */
export function getAbnormalMisscardRank(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getAbnormalMisscardRank(params));
  return request.get('/attendance/board/abnormal/misscard-rank', { params });
}

/**
 * 板块3-3：旷工人员清单
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<Array<{ userId, userName, departmentName, date, reason }>>
 */
export function getAbnormalAbsentList(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getAbnormalAbsentList(params));
  return request.get('/attendance/board/abnormal/absent-list', { params });
}

/**
 * 板块3-4：异常考勤明细
 * 字段口径（对应 attendance_daily_result 表）：
 *   hasApprovalCancel = has_approval_cancel（当日关联了请假/外出审批，异常被抵消）
 *   validException    = valid_exception（抵消后的有效异常，应计入处罚统计）
 * @param {object} params { startDate, endDate, departmentPath?, page?, size? }
 * @returns Promise<{ list: Array<{ userId, userName, departmentName, date, abnormalType, duration, hasApprovalCancel, validException }>, total: number }>
 */
export function getAbnormalDetail(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getAbnormalDetail(params));
  return request.get('/attendance/board/abnormal/detail', { params });
}

/**
 * 板块3-5：补卡申请列表（后端暂未同步补卡数据，见契约 13.5 数据缺口）
 * @param {object} params { startDate, endDate, status? }
 * @returns Promise<Array<{ userId, userName, departmentName, date, resubmitTime, status }>>
 */
export function getAbnormalResubmitList(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getAbnormalResubmitList(params));
  return request.get('/attendance/board/abnormal/resubmit-list', { params });
}

/**
 * 板块4-1：请假统计（类型分布 + 部门排行）
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<{
 *   typeDistribution: Array<{ type: string, duration: number, count: number }>,
 *   departmentRank: Array<{ departmentName, duration: number }>
 * }>
 *   duration 单位：小时
 */
export function getLeaveStats(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getLeaveStats(params));
  return request.get('/attendance/board/leave/stats', { params });
}

/**
 * 板块4-2：加班统计（后端暂无加班表，需补同步，见契约 13.5）
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<{
 *   totalDuration: number,
 *   dailyAvg: number,
 *   departmentRank: Array<{ departmentName, duration }>,
 *   typeBreakdown: { workday: number, weekend: number, holiday: number }
 * }>
 */
export function getOvertimeStats(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getOvertimeStats(params));
  return request.get('/attendance/board/overtime/stats', { params });
}

/**
 * 板块4-3：外出/出差统计（后端暂无外出表，需补同步，见契约 13.5）
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<{
 *   totalCount: number,
 *   totalDuration: number,
 *   departmentRank: Array<{ departmentName, count, duration }>
 * }>
 */
export function getOutingStats(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getOutingStats(params));
  return request.get('/attendance/board/outing/stats', { params });
}

/**
 * 板块4-4：请假/加班单据明细
 * @param {object} params { startDate, endDate, type: 'leave'|'overtime', page?, size?, departmentPath? }
 * @returns Promise<{ list: Array, total: number }>
 */
export function getLeaveOvertimeDetail(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getLeaveOvertimeDetail(params));
  return request.get('/attendance/board/leave-overtime/detail', { params });
}

/**
 * 板块5：趋势分析（按日：出勤率/迟到/缺卡/旷工）
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<Array<{ date, attendanceRate, lateCount, misscardCount, absentCount }>>
 */
export function getBoardTrend(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getBoardTrend(params));
  return request.get('/attendance/board/trend', { params });
}

/**
 * 板块6-1：人员明细列表（月度汇总）
 * @param {object} params { startDate, endDate, page?, size?, departmentPath?, keyword? }
 * @returns Promise<{ list: Array<{ userId, userName, employeeId, departmentName, jobTitle, lateCount, earlyLeaveCount, misscardCount, absentCount, leaveDays, overtimeHours }>, total: number }>
 */
export function getEmployeeAttendanceList(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getEmployeeAttendanceList(params));
  return request.get('/attendance/board/employee/list', { params });
}

/**
 * 板块6-2：个人考勤日历视图
 * @param {object} params { userId, month }
 *   month: YYYY-MM
 * @returns Promise<{
 *   calendar: Array<{ date, workStatus, checkIn, checkOut, abnormalType, hasLeave, hasOvertime, hasOuting }>,
 *   summary: { lateCount, earlyLeaveCount, misscardCount, absentCount, leaveDays, overtimeHours }
 * }>
 *   workStatus 取值：正常/迟到/早退/缺卡/旷工/请假/休息
 */
export function getEmployeeCalendar(params) {
  if (USE_MOCK) return Promise.resolve(mockBoard.getEmployeeCalendar(params));
  return request.get('/attendance/board/employee/calendar', { params });
}

/**
 * 板块6-3：导出个人考勤报表
 * @param {object} params { userId, startDate, endDate }
 * @returns Promise<Blob>
 */
export function exportEmployeeReport(params) {
  if (USE_MOCK) return mockBoard.exportEmployeeReport(params);
  return request.get('/attendance/board/employee/export', {
    params,
    responseType: 'blob'
  });
}

/**
 * 板块6-4：部门考勤汇总表导出（板块2 表格导出）
 * @param {object} params { startDate, endDate, departmentPath? }
 * @returns Promise<Blob>
 */
export function exportDepartmentStats(params) {
  if (USE_MOCK) return mockBoard.exportDepartmentStats(params);
  return request.get('/attendance/board/department-stats/export', {
    params,
    responseType: 'blob'
  });
}
