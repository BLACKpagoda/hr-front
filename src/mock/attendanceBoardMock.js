// 考勤看板 Mock 数据模块（与 src/api/attendance.js 看板接口一一对应）
// 用途：后端 /attendance/board/* 未实现前，供看板演示与前端联调
// 开关：attendance.js 中 USE_MOCK（REACT_APP_USE_MOCK=false 时关闭）
// 数据口径与 hrdb 实际表模型对齐（attendance_daily_result / attendance_department_daily 等）

import dayjs from 'dayjs';

/* ==================== 可复现伪随机（同参数结果恒定） ==================== */
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 生成 [min, max] 内稳定随机整数
function rand(key, min, max) {
  const r = mulberry32(hashStr(String(key)))();
  return min + Math.round(r * (max - min));
}

// 保留 1 位小数
const round1 = n => Math.round(n * 10) / 10;

/* ==================== 基础维度 ==================== */
// 部门路径（与 dingtalk_user_mapping.department_path 口径一致）
export const DEPARTMENTS = [
  '一汽铸造机关',
  '锻造事业部-锻造公司',
  '锻造事业部-青岛公司',
  '黑色事业部-铸造一厂',
  '黑色事业部-铸造二厂',
  '黑色事业部-无锡分公司',
  '吉佳工厂',
  '铸模事业部-模具设备厂',
  '有色事业部-有色分公司',
  '有色事业部-压铸厂',
  '有色事业部-成都有色'
];

const SURNAMES = '王李张刘陈杨赵黄周吴徐孙马朱胡郭何林罗高郑梁谢宋唐许韩冯邓曹彭曾肖田袁蔡蒋余杜叶程苏魏吕丁任沈姚卢';
const GIVEN = ['伟', '芳', '娜', '敏', '静', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '霞', '平', '刚', '文博', '思远', '志强', '建国', '丽华', '海燕', '春梅', '晨曦', '浩然', '子涵', '雨欣', '德福', '长顺', '永强'];
const JOBTITLES = ['操作', '班长', '工段长', '技术员', '主管', '主任师', '办事员'];

const EMPLOYEE_COUNT = 88;
const EMPLOYEES = Array.from({ length: EMPLOYEE_COUNT }, (_, i) => {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const name =
    SURNAMES[hashStr('sur' + i) % SURNAMES.length] +
    GIVEN[hashStr('giv' + i) % GIVEN.length];
  return {
    userId: `U${1000 + i}`,
    userName: name,
    employeeId: `10${String(100 + i)}`,
    departmentPath: dept,
    jobTitle: JOBTITLES[hashStr('job' + i) % JOBTITLES.length]
  };
});

const employeesOf = (departmentPath) =>
  departmentPath
    ? EMPLOYEES.filter(e => e.departmentPath === departmentPath || e.departmentPath.startsWith(departmentPath))
    : EMPLOYEES;

// 区间内日期列表（含首尾）
function dateRangeList(startDate, endDate) {
  const list = [];
  if (!startDate || !endDate) return list;
  let cur = dayjs(startDate);
  const end = dayjs(endDate);
  let guard = 0;
  while ((cur.isBefore(end) || cur.isSame(end, 'day')) && guard < 400) {
    list.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
    guard++;
  }
  return list;
}

const isWeekend = dateStr => [0, 6].includes(dayjs(dateStr).day());

function randomDateIn(key, startDate, endDate) {
  const list = dateRangeList(startDate, endDate);
  if (!list.length) return dayjs().format('YYYY-MM-DD');
  return list[hashStr(key) % list.length];
}

/* ==================== 板块0：筛选选项 ==================== */
export function getBoardOptions() {
  return {
    departments: DEPARTMENTS.map(d => ({ path: d, name: d }))
  };
}

/* ==================== 板块1：考勤总览 ==================== */
export function getBoardOverview(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const days = dateRangeList(startDate, endDate).filter(d => !isWeekend(d)).length || 1;
  const key = `${startDate}_${endDate}_${departmentPath || 'all'}`;

  const headcount = departmentPath ? employeesOf(departmentPath).length * 4 : 1024;
  const shouldAttendCount = headcount * days; // 人·天
  const lateCount = Math.round(shouldAttendCount * (rand(key + 'late', 28, 52) / 1000));
  const earlyLeaveCount = Math.round(shouldAttendCount * (rand(key + 'early', 8, 18) / 1000));
  const missCardCount = Math.round(shouldAttendCount * (rand(key + 'miss', 15, 30) / 1000));
  const absentCount = Math.round(shouldAttendCount * (rand(key + 'absent', 2, 6) / 1000));
  const leaveCount = Math.round(shouldAttendCount * (rand(key + 'leave', 25, 45) / 1000));
  const attendanceRate = round1(rand(key + 'rate', 9260, 9820) / 100);
  const actualAttendCount = Math.round(shouldAttendCount * attendanceRate / 100);

  return {
    kpi: {
      shouldAttendCount,
      actualAttendCount,
      attendanceRate,
      lateCount,
      earlyLeaveCount,
      missCardCount,
      absentCount,
      leaveDuration: Math.round(leaveCount * rand(key + 'lh', 4, 8) / days),
      overtimeDuration: Math.round(shouldAttendCount * (rand(key + 'ot', 5, 12) / 100)),
      outingCount: Math.round(shouldAttendCount * (rand(key + 'out', 4, 10) / 1000))
    },
    statusDistribution: [
      { name: '正常', value: Math.max(0, shouldAttendCount - lateCount - earlyLeaveCount - missCardCount - absentCount - leaveCount) },
      { name: '迟到', value: lateCount },
      { name: '早退', value: earlyLeaveCount },
      { name: '缺卡', value: missCardCount },
      { name: '请假', value: leaveCount },
      { name: '旷工', value: absentCount }
    ]
  };
}

/* ==================== 板块2：部门维度统计 ==================== */
export function getBoardDepartmentStats(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const days = dateRangeList(startDate, endDate).filter(d => !isWeekend(d)).length || 1;
  const key = `${startDate}_${endDate}`;

  return DEPARTMENTS
    .filter(d => !departmentPath || d === departmentPath || d.startsWith(departmentPath))
    .map(dept => {
      const k = key + dept;
      const headcount = employeesOf(dept).length * 4;
      const should = headcount * days;
      const rate = round1(rand(k + 'rate', 9100, 9900) / 100);
      return {
        departmentPath: dept,
        departmentName: dept,
        headcount,
        actualAttendCount: Math.round(should * rate / 100),
        attendanceRate: rate,
        lateCount: Math.round(should * (rand(k + 'late', 20, 60) / 1000)),
        earlyLeaveCount: Math.round(should * (rand(k + 'early', 5, 20) / 1000)),
        missCardCount: Math.round(should * (rand(k + 'miss', 10, 35) / 1000)),
        absentCount: Math.round(should * (rand(k + 'absent', 0, 8) / 1000)),
        leaveDuration: Math.round(should * (rand(k + 'leave', 3, 10) / 100)),
        overtimeDuration: Math.round(should * (rand(k + 'ot', 4, 14) / 100))
      };
    });
}

/* ==================== 板块3：异常考勤 ==================== */
export function getAbnormalLateRank(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `lateRank_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const pool = employeesOf(departmentPath);
  return pool
    .slice(0, params.limit || 10)
    .map((e, i) => {
      const lateCount = rand(key + i, 3, 16);
      return {
        userId: e.userId,
        userName: e.userName,
        departmentName: e.departmentPath,
        lateCount,
        lateDuration: lateCount * rand(key + 'd' + i, 5, 40)
      };
    })
    .sort((a, b) => b.lateCount - a.lateCount);
}

export function getAbnormalMisscardRank(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `missRank_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const pool = employeesOf(departmentPath);
  return pool
    .slice(pool.length - (params.limit || 10))
    .map((e, i) => ({
      userId: e.userId,
      userName: e.userName,
      departmentName: e.departmentPath,
      misscardCount: rand(key + i, 2, 12)
    }))
    .sort((a, b) => b.misscardCount - a.misscardCount);
}

export function getAbnormalAbsentList(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `absent_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const pool = employeesOf(departmentPath);
  return Array.from({ length: 9 }, (_, i) => {
    const e = pool[(hashStr(key + i) + i * 7) % pool.length];
    return {
      userId: e.userId,
      userName: e.userName,
      departmentName: e.departmentPath,
      date: randomDateIn(key + i, startDate, endDate),
      reason: i % 3 === 0 ? '全天未打卡且无审批' : '旷工半天（未办理请假）'
    };
  });
}

export function getAbnormalResubmitList(params = {}) {
  const { startDate, endDate } = params;
  const key = `resubmit_${startDate}_${endDate}`;
  const statuses = ['pending', 'approved', 'pending', 'approved', 'rejected', 'approved'];
  return Array.from({ length: 6 }, (_, i) => {
    const e = EMPLOYEES[(hashStr(key) + i * 11) % EMPLOYEES.length];
    return {
      userId: e.userId,
      userName: e.userName,
      departmentName: e.departmentPath,
      date: randomDateIn(key + i, startDate, endDate),
      resubmitTime: `${randomDateIn(key + 't' + i, startDate, endDate)} ${9 + (i % 8)}:${String(10 + i * 3).padStart(2, '0')}`,
      status: statuses[i % statuses.length]
    };
  });
}

export function getAbnormalDetail(params = {}) {
  const { startDate, endDate, departmentPath, page = 1, size = 15 } = params;
  const key = `abnDetail_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const total = rand(key, 120, 380);
  const types = ['迟到', '早退', '缺卡', '旷工'];

  const start = (page - 1) * size;
  if (start >= total) return { list: [], total };

  const list = Array.from({ length: Math.min(size, total - start) }, (_, i) => {
    const idx = start + i;
    const e = EMPLOYEES[(hashStr(key + idx) + idx * 3) % EMPLOYEES.length];
    const abnormalType = types[(hashStr(key + 't' + idx) + idx) % types.length];
    const hasApprovalCancel = idx % 7 === 3;
    return {
      userId: e.userId,
      userName: e.userName,
      departmentName: e.departmentPath,
      date: randomDateIn(key + idx, startDate, endDate),
      abnormalType,
      duration: abnormalType === '旷工' ? rand(key + 'g' + idx, 120, 480) : rand(key + 'd' + idx, 3, 55),
      hasApprovalCancel,
      validException: !hasApprovalCancel
    };
  });

  return { list, total };
}

/* ==================== 板块4：请假 & 加班 & 外出 ==================== */
export function getLeaveStats(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `leave_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const depts = DEPARTMENTS.filter(d => !departmentPath || d === departmentPath || d.startsWith(departmentPath));

  return {
    typeDistribution: [
      { type: '年假', duration: rand(key + 'a', 200, 600), count: rand(key + 'ac', 30, 80) },
      { type: '事假', duration: rand(key + 's', 100, 400), count: rand(key + 'sc', 20, 60) },
      { type: '病假', duration: rand(key + 'b', 150, 500), count: rand(key + 'bc', 25, 70) },
      { type: '调休', duration: rand(key + 't', 180, 550), count: rand(key + 'tc', 30, 90) },
      { type: '婚假', duration: rand(key + 'h', 20, 90), count: rand(key + 'hc', 2, 8) },
      { type: '产假', duration: rand(key + 'c', 60, 300), count: rand(key + 'cc', 1, 5) },
      { type: '其他', duration: rand(key + 'o', 30, 120), count: rand(key + 'oc', 5, 20) }
    ],
    departmentRank: depts.map(d => ({
      departmentName: d,
      duration: rand(key + d, 40, 260)
    }))
  };
}

export function getOvertimeStats(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `ot_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const days = dateRangeList(startDate, endDate).filter(d => !isWeekend(d)).length || 1;
  const depts = DEPARTMENTS.filter(d => !departmentPath || d === departmentPath || d.startsWith(departmentPath));
  const totalDuration = rand(key, 1200, 4200);

  return {
    totalDuration,
    dailyAvg: round1(totalDuration / days),
    departmentRank: depts.map(d => ({
      departmentName: d,
      duration: rand(key + d, 60, 520)
    })),
    typeBreakdown: {
      workday: Math.round(totalDuration * 0.52),
      weekend: Math.round(totalDuration * 0.38),
      holiday: Math.round(totalDuration * 0.10)
    }
  };
}

export function getOutingStats(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `outing_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const depts = DEPARTMENTS.filter(d => !departmentPath || d === departmentPath || d.startsWith(departmentPath));

  return {
    totalCount: rand(key, 60, 260),
    totalDuration: rand(key + 'd', 400, 1600),
    departmentRank: depts.map(d => ({
      departmentName: d,
      count: rand(key + d, 3, 40),
      duration: rand(key + 'du' + d, 20, 220)
    }))
  };
}

export function getLeaveOvertimeDetail(params = {}) {
  const { startDate, endDate, departmentPath, type = 'leave', page = 1, size = 15 } = params;
  const key = `loDetail_${type}_${startDate}_${endDate}_${departmentPath || 'all'}`;
  const total = rand(key, 60, 240);
  const start = (page - 1) * size;
  if (start >= total) return { list: [], total };

  const leaveTypes = ['年假', '事假', '病假', '调休', '婚假', '产假', '其他'];
  const overtimeTypes = ['工作日加班', '周末加班', '节假日加班'];
  const statuses = ['approved', 'approved', 'approved', 'pending', 'rejected'];

  const list = Array.from({ length: Math.min(size, total - start) }, (_, i) => {
    const idx = start + i;
    const e = EMPLOYEES[(hashStr(key + idx) + idx * 5) % EMPLOYEES.length];
    const d1 = randomDateIn(key + idx, startDate, endDate);
    const hour = rand(key + 'h' + idx, 8, 17);
    return {
      userId: e.userId,
      userName: e.userName,
      departmentName: e.departmentPath,
      ...(type === 'leave'
        ? { leaveType: leaveTypes[idx % leaveTypes.length] }
        : { overtimeType: overtimeTypes[idx % overtimeTypes.length] }),
      startTime: `${d1} ${String(hour).padStart(2, '0')}:00`,
      endTime: `${d1} ${String(Math.min(hour + rand(key + 'e' + idx, 2, 9), 23)).padStart(2, '0')}:00`,
      duration: rand(key + 'du' + idx, 2, 24),
      status: statuses[idx % statuses.length]
    };
  });

  return { list, total };
}

/* ==================== 板块5：趋势分析 ==================== */
export function getBoardTrend(params = {}) {
  const { startDate, endDate, departmentPath } = params;
  const key = `trend_${startDate}_${endDate}_${departmentPath || 'all'}`;
  return dateRangeList(startDate, endDate).map((date, i) => {
    const weekend = isWeekend(date);
    const k = key + date + i;
    return {
      date,
      attendanceRate: weekend ? rand(k, 3000, 6000) / 100 : rand(k, 9100, 9900) / 100,
      lateCount: weekend ? rand(k + 'l', 0, 8) : rand(k + 'l', 15, 65),
      misscardCount: weekend ? rand(k + 'm', 0, 5) : rand(k + 'm', 8, 32),
      absentCount: weekend ? 0 : rand(k + 'a', 0, 5)
    };
  });
}

/* ==================== 板块6：人员明细 ==================== */
export function getEmployeeAttendanceList(params = {}) {
  const { startDate, endDate, page = 1, size = 15, departmentPath, keyword } = params;
  const key = `empList_${startDate}_${endDate}`;

  let pool = employeesOf(departmentPath);
  if (keyword) {
    const kw = keyword.trim().toLowerCase();
    pool = pool.filter(
      e => e.userName.toLowerCase().includes(kw) || e.employeeId.includes(kw)
    );
  }
  const total = pool.length;
  const start = (page - 1) * size;
  if (start >= total) return { list: [], total };

  const list = pool.slice(start, start + size).map((e, i) => {
    const k = key + e.userId;
    return {
      userId: e.userId,
      userName: e.userName,
      employeeId: e.employeeId,
      departmentName: e.departmentPath,
      jobTitle: e.jobTitle,
      lateCount: rand(k + 'l', 0, 9),
      earlyLeaveCount: rand(k + 'e', 0, 4),
      misscardCount: rand(k + 'm', 0, 6),
      absentCount: rand(k + 'a', 0, 2),
      leaveDays: round1(rand(k + 'le', 0, 60) / 10),
      overtimeHours: rand(k + 'o', 0, 60)
    };
  });

  return { list, total };
}

export function getEmployeeCalendar(params = {}) {
  const { userId, month } = params;
  const key = `cal_${userId}_${month}`;
  const e = EMPLOYEES.find(x => x.userId === userId) || EMPLOYEES[0];
  const daysInMonth = dayjs(month).daysInMonth();

  const calendar = [];
  const summary = { lateCount: 0, earlyLeaveCount: 0, misscardCount: 0, absentCount: 0, leaveDays: 0, overtimeHours: 0 };

  for (let d = 1; d <= daysInMonth; d++) {
    const date = dayjs(`${month}-${String(d).padStart(2, '0')}`).format('YYYY-MM-DD');
    const k = key + d;

    if (isWeekend(date)) {
      calendar.push({ date, workStatus: '休息', checkIn: '', checkOut: '', abnormalType: '', hasLeave: false, hasOvertime: d % 5 === 0, hasOuting: false });
      if (d % 5 === 0) summary.overtimeHours += 8;
      continue;
    }

    // 缺卡 idx%13==4；迟到 idx%9==2；早退 idx%15==8；请假 idx%17==6；旷工 idx%29==11；其余正常
    let workStatus = '正常';
    let checkIn = `08:${String(rand(k + 'in', 0, 9)).padStart(2, '0')}`;
    let checkOut = `17:${String(rand(k + 'out', 20, 59)).padStart(2, '0')}`;
    let hasLeave = false;
    let hasOvertime = d % 6 === 0;

    if (d % 13 === 4) {
      workStatus = '缺卡';
      checkIn = d % 2 === 0 ? '' : checkIn;
      summary.misscardCount++;
    } else if (d % 9 === 2) {
      workStatus = '迟到';
      checkIn = `08:${String(rand(k + 'late', 15, 45)).padStart(2, '0')}`;
      summary.lateCount++;
    } else if (d % 15 === 8) {
      workStatus = '早退';
      checkOut = `16:${String(rand(k + 'e', 0, 40)).padStart(2, '0')}`;
      summary.earlyLeaveCount++;
    } else if (d % 17 === 6) {
      workStatus = '请假';
      hasLeave = true;
      summary.leaveDays += 1;
    } else if (d % 29 === 11) {
      workStatus = '旷工';
      checkIn = '';
      checkOut = '';
      summary.absentCount++;
    }
    if (hasOvertime) summary.overtimeHours += 2;

    calendar.push({ date, workStatus, checkIn, checkOut, abnormalType: workStatus === '正常' ? '' : workStatus, hasLeave, hasOvertime, hasOuting: false });
  }

  return { calendar, summary, employee: { userId: e.userId, userName: e.userName, departmentName: e.departmentPath } };
}

/* ==================== 导出（Blob） ==================== */
function toCsvBlob(headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.join(','))];
  const csv = '\ufeff' + lines.join('\r\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

export function exportEmployeeReport(params = {}) {
  const { calendar } = getEmployeeCalendar({ userId: params.userId, month: (params.startDate || '').slice(0, 7) || dayjs().format('YYYY-MM') });
  const rows = calendar.map(c => [c.date, c.workStatus, c.checkIn || '-', c.checkOut || '-', c.hasLeave ? '是' : '', c.hasOvertime ? '是' : '']);
  return Promise.resolve(
    toCsvBlob(['日期', '状态', '上班打卡', '下班打卡', '请假', '加班'], rows)
  );
}

export function exportDepartmentStats(params = {}) {
  const stats = getBoardDepartmentStats(params);
  const rows = stats.map(s => [
    s.departmentName, s.headcount, s.actualAttendCount, s.attendanceRate + '%',
    s.lateCount, s.earlyLeaveCount, s.missCardCount, s.absentCount,
    s.leaveDuration, s.overtimeDuration
  ]);
  return Promise.resolve(
    toCsvBlob(
      ['部门', '应考勤人数', '实际打卡', '出勤率', '迟到', '早退', '缺卡', '旷工', '请假时长(h)', '加班时长(h)'],
      rows
    )
  );
}
