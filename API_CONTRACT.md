# 前端 hr-front 项目结构 & 前后端对接契约

> 本文档面向后端开发者，描述前端项目结构、接口对接方式、各页面对应的 API 调用。
> 后端在调整接口返回格式或字段时，请同步通知前端或更新本文档。

---

## 一、项目概览

| 项目 | 路径 | 技术栈 | 端口 |
|------|------|--------|------|
| 前端 hr-front | `d:\personnelDep\hr-front` | React 19 + Antd 5 + react-router-dom 6 + axios | 3000 |
| 后端 hrdb | `d:\personnelDep\hrdb` | Node.js + Express + PostgreSQL | 3001 |

## 二、启动方式

| 端 | 命令 | 端口 |
|----|------|------|
| 前端 | `npm start`（react-scripts） | 3000 |
| 后端 | `npm run dev`（nodemon）或 `npm start` | 3001（由 `.env` 的 `PORT=3001` 控制） |

## 三、目录结构

```
hr-front/
├── public/                    # 静态资源（PWA 配置、favicon 等）
├── src/
│   ├── api/                   # ★ 接口模块层（按业务域封装所有 URL）
│   │   ├── employee.js        #   员工相关：/personnel/list、/import-employees
│   │   ├── attendance.js      #   考勤相关：/attendance/import、/attendance/excel、/sync
│   │   ├── salary.js          #   薪酬相关：/salary-periods、/salary-all-data、/salary-summary、/import-salary
│   │   ├── fanruan.js         #   帆软导入：/export-fanruan
│   │   └── index.js           #   统一出口
│   │
│   ├── components/            # 可复用业务组件
│   │   ├── Dashboard/         #   仪表盘（StatsCard、RecentActivity）
│   │   ├── Import/            #   数据导入子组件（Employee/Attendance/Salary）
│   │   ├── Layout/            #   布局（Header、Sidebar、MainContent）
│   │   └── SalaryAnalysis/    #   薪酬分析（Filter、Report、TotalReport）
│   │
│   ├── pages/                 # 页面级组件（路由对应）
│   │   ├── Attendance/        #   /attendance       → 考勤餐补分析导入
│   │   ├── Dashboard/         #   /                  → 仪表盘
│   │   ├── DataSync/          #   /sync              → 钉钉考勤同步
│   │   ├── EmployeeManagement/ # /employees         → 员工列表
│   │   ├── Fanruan/           #   /fanruan           → 帆软指标导入
│   │   ├── ImportData/        #   /import            → 数据导入（聚合 3 个子组件）
│   │   ├── SalaryAnalysis/    #   /salary-analysis   → 薪酬分析
│   │   └── SystemSettings/    #   /settings          → 系统设置
│   │
│   ├── utils/
│   │   └── request.js         # ★ axios 实例 + 拦截器（详见下文）
│   │
│   ├── App.jsx                # 根组件 + 路由配置
│   ├── App.css
│   ├── index.js               # 入口
│   └── index.css
│
├── .env                       # 默认环境变量
├── .env.development           # 开发环境（npm start 时生效）
├── .env.production            # 生产环境（npm run build 时生效）
├── package.json
└── README.md
```

## 四、环境变量

通过 CRA 内置的 `process.env.REACT_APP_*` 注入，**前端无硬编码 baseURL**。

| 文件 | 变量 | 默认值 |
|------|------|--------|
| `.env` | `REACT_APP_API_BASE_URL` | `http://localhost:3001` |
| `.env.development` | 同上 | `http://localhost:3001` |
| `.env.production` | 同上 | `http://localhost:3001`（部署时改为生产域名） |

部署到生产环境时，只需修改 `.env.production` 中的 `REACT_APP_API_BASE_URL` 后重新 `npm run build`。

## 五、请求层封装（`src/utils/request.js`）

### 5.1 axios 实例

```js
const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});
```

### 5.2 请求拦截器

自动从 `localStorage` / `sessionStorage` 读取 `token`，注入 `Authorization: Bearer <token>`。

### 5.3 响应拦截器（与后端 `common/response.js` 对齐）

后端统一返回：

```json
{ "code": 200, "msg": "操作成功", "data": {...} }     // 成功
{ "code": 500, "msg": "失败原因", "data": null }       // 失败
```

拦截器逻辑：

| 场景 | 处理 |
|------|------|
| `res.code === 200` | 返回 `res.data`（页面直接拿到业务数据） |
| `res.code !== 200` | `Promise.reject(new Error(res.msg))`，页面 `catch` 中取 `error.message` |
| 非 `{code, msg, data}` 结构（数组/字符串/文件流） | 原样返回，兼容文件下载等场景 |
| HTTP 401 | 清除 token（不强跳登录，交由调用方处理） |
| HTTP 其他错误 | `Promise.reject(new Error(response.data.msg 或 网络异常))` |

### 5.4 页面调用约定

页面**不直接** `import request` 或写 URL，必须通过 `src/api/` 模块调用：

```js
// ❌ 错误：散落在页面中
import request from '../../utils/request';
const res = await request.get('/personnel/list', { params: { page, size } });

// ✅ 正确：通过 api 模块
import { getEmployeeList } from '../../api/employee';
const res = await getEmployeeList(page, size);  // res 直接是 { list, total }
```

## 六、前后端接口对接全表

> **响应字段列**中的 `data` 表示拦截器解包后的业务数据，不是 axios 原生 `response.data`。

### 6.1 员工模块（`src/api/employee.js`）

| 前端调用 | HTTP & 路径 | 后端处理 | 请求参数 | 响应 data 结构 |
|---------|------------|---------|---------|---------------|
| `getEmployeeList(page, size)` | `GET /personnel/list` | `routes/index.js` | query: `page`, `size` | `{ list: Array, total: number }` |
| `importEmployees(file, sheetName?)` | `POST /import-employees` (multipart) | `routes/index.js` | form: `file`、可选 `sheetName` | `{ details: { success: number, errors: Array } }` |

### 6.2 考勤模块（`src/api/attendance.js`）

| 前端调用 | HTTP & 路径 | 后端处理 | 请求参数 | 响应 data 结构 |
|---------|------------|---------|---------|---------------|
| `importAttendanceForMeal(file, month)` | `POST /attendance/import` (multipart) | `modules/attendance-excel/routes.js` | form: `file`、`month`(YYYY-MM) | `{ successCount, errors: Array, attendanceSummary: Array }` |
| `importAttendanceExcel(file, month)` | `POST /attendance/excel` (multipart) | `modules/attendance-excel/routes.js` | form: `file`、`month`(YYYY-MM) | 导入结果对象（字段名以 service 实际返回为准，前端兼容 `count` / `successCount`） |
| `syncAttendance({ startDate, endDate, granularity })` | `POST /sync` | `modules/attendance-sync/routes.js` | json: `startDate`(YYYY-MM-DD)、`endDate`(YYYY-MM-DD)、`granularity`('day' / 'month') | `{ userCount: number, dateRange: { startDate, endDate }, granularity }` |

### 6.3 薪酬模块（`src/api/salary.js`）

| 前端调用 | HTTP & 路径 | 后端处理 | 请求参数 | 响应 data 结构 |
|---------|------------|---------|---------|---------------|
| `getSalaryPeriods()` | `GET /salary-periods` | `modules/salary/routes.js` | - | `string[]`（如 `['2026-08', '2026-07', ...]`，按 DESC 排序） |
| `getAllSalaryData()` | `GET /salary-all-data` | `modules/salary/routes.js` | - | `Array<{ 期间, 公司, 人员类别, 应计工资总和, 人数 }>` |
| `getSalarySummary({ period, companies, categories })` | `GET /salary-summary` | `modules/salary/routes.js` | query: `period`、`companies[]`、`categories[]` | `Array<{ 公司, 人员类别, 期间, 应计工资总和, 人数 }>` |
| `importSalaryData(file)` | `POST /import-salary` (multipart) | `modules/salary/routes.js` | form: `file` | 导入结果对象（前端兼容 `success` / `count`） |

### 6.4 帆软模块（`src/api/fanruan.js`）

| 前端调用 | HTTP & 路径 | 后端处理 | 请求参数 | 响应 data 结构 |
|---------|------------|---------|---------|---------------|
| `exportFanruan(file)` | `POST /export-fanruan` (multipart) | `routes/index.js` | form: `file` | 以工作表名为 key 的对象，每个工作表 `{ success: boolean, count: number }` |

## 七、前端路由 ↔ 页面 ↔ 接口对照

| 路由路径 | 页面组件 | 调用接口 |
|---------|---------|---------|
| `/` | `Dashboard` | （暂无） |
| `/employees` | `EmployeeManagement` | `getEmployeeList` |
| `/attendance` | `Attendance` | `importAttendanceForMeal` |
| `/import` | `ImportData`（聚合 3 个 Tab） | `importEmployees` / `importAttendanceExcel` / `importSalaryData` |
| `/sync` | `DataSync` | `syncAttendance` |
| `/settings` | `SystemSettings` | （暂无） |
| `/fanruan` | `Fanruan` | `exportFanruan` |
| `/salary-analysis` | `SalaryAnalysis` | `getSalaryPeriods` + `getAllSalaryData` |

## 八、CORS 与跨域

后端 `app.js` 已配置 CORS，允许来源：

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3001`

允许的方法：`GET, POST, PUT, DELETE, OPTIONS`
允许的请求头：`Content-Type, Authorization, X-Requested-With`

## 九、字段命名约定

| 维度 | 约定 | 示例 |
|------|------|------|
| 前端 JS 变量 | 小驼峰 | `employeeId`、`actualWorkDays` |
| 后端数据库字段 | 下划线 | `employee_id`、`actual_work_days` |
| 薪酬业务数据 | **中文键** | `"期间"`、`"公司"`、`"人员类别"`、`"应计工资总和"`、`"人数"` |

> ⚠️ 薪酬模块返回的是中文键名（后端 SQL `SELECT "期间", "公司"...` 直接透传），前端在 `SalaryAnalysis.jsx` 中按中文键读取，**后端不要修改这些中文列名**。

## 十、文件上传约定

所有文件上传接口统一使用 `multipart/form-data`：

- 字段名固定为 `file`
- 考勤类上传额外带 `month` 字段（`YYYY-MM` 格式）
- 员工导入可选带 `sheetName` 字段
- 后端使用 `multer.memoryStorage()`，文件内容在 `req.file.buffer` 中（**不是 `req.file.path`**）

## 十一、错误处理流程

```
后端 fail(res, msg, code)
  ↓
HTTP 响应：{ code, msg, data: null }，HTTP 状态码 = code（如 400/500）
  ↓
前端拦截器：code !== 200 → reject(new Error(msg))
  ↓
页面 catch (error) { ... error.message ... }   // error.message 即后端的 msg
```

## 十二、待办与已知问题

| 项 | 说明 | 责任方 |
|----|------|--------|
| `/import-employees` 的 `req.file.path` bug | multer 用 memoryStorage 时 `path` 为 undefined，但 `model/export.js` 内部用 `fs.existsSync(filePath)`，只支持路径。需后端改为传 buffer 或临时文件方案 | 后端 |
| `attendance-excel/service.js` 日期硬编码 | `extractDailyRecords` 仅适用于 2025-09，需改为根据 month 动态生成 | 后端 |
| 前端未接入登录 | `model/login.jsx` 已删除，token 注入逻辑保留但无登录页 | 前端 |
| `moment` 与 `dayjs` 共存 | 两者功能重叠，可统一为 dayjs 减小体积 | 前端（可选） |

---

**文档更新约定**：后端在调整接口路径、请求参数、响应字段时，请同步更新本文档第六章的接口对接全表，并通知前端。

---

## 十三、考勤看板接口对接（AttendanceBoard）

> 本章对应前端 `src/pages/AttendanceBoard/` 与 `src/api/attendance.js` 中的看板接口（共 17 个）。
> **后端实现方式**：新建 `hrdb/modules/attendance-board/` 模块（routes.js / controller.js / service.js，结构与 attendance-sync 相同），
> 在 `hrdb/routes/index.js` 的模块挂载区追加一行：
> `router.use('/', require('../modules/attendance-board/routes'));`
> 路由路径直接写 `/attendance/board/...`（主路由挂载在 `/`，无需额外前缀）。响应统一用 `common/response.js` 的 `success/fail`。
>
> **数据基础（重要）**：看板**直接查询 hrdb 现有表**，不需要为新表再调钉钉 API：
> `attendance_daily_result`（日级考勤结果）、`attendance_leave_status`（请假状态）、
> `attendance_department_daily`（部门日汇总）、`attendance_employee_monthly`（员工月汇总）、
> `dingtalk_user_mapping`（人员映射）。这些表由 `modules/attendance-sync` 的同步服务维护，
> 钉钉侧已完成排班/审批抵消计算（`has_approval_cancel` / `valid_exception` 字段），**前后端都不要自行计算迟到旷工**。
>
> **在岗过滤**：所有人员维度统计需关联 `dingtalk_user_mapping` 并过滤 `employment_status='在岗'`（参考 attendance-sync/service.js 中 calcSummary 的既有写法）。

### 13.0 通用约定

| 项 | 约定 |
|----|------|
| 统一查询参数 | `startDate`(YYYY-MM-DD)、`endDate`(YYYY-MM-DD)、`departmentPath?`（部门路径，取值为 `dingtalk_user_mapping.department_path`，**前缀匹配**：`department_path = $1 OR department_path LIKE $1 \|\| '%'`） |
| 时长单位 | 请假/加班/外出时长统一为**小时**，迟到/早退时长为**分钟** |
| 出勤率口径 | 数据库 `attendance_rate` 为 0-1 小数（NUMERIC(5,4)），**接口返回时 ×100 保留 1 位小数**（如 0.9635 → 96.4） |
| 在岗过滤 | 所有人员统计需 `employment_status='在岗'` 且 `sync_status='matched'` |
| 分页参数 | `page`（从 1 开始）、`size`（默认 15），返回 `{ list, total }` |
| 通用响应 | 成功 `success(res, data, msg)`，失败 `fail(res, msg, code)`（见 common/response.js） |

### 13.1 接口对接全表

| 前端调用 | HTTP & 路径 | 请求参数 | 响应 data 结构 |
|---------|------------|---------|---------------|
| `getBoardOptions()` | `GET /attendance/board/options` | - | `{ departments:[{path,name}] }`（path=`department_path` 原值，name=展示名） |
| `getBoardOverview(params)` | `GET /attendance/board/overview` | startDate,endDate,departmentPath? | `{ kpi:{...}, statusDistribution:[{name,value}] }` |
| `getBoardDepartmentStats(params)` | `GET /attendance/board/department-stats` | startDate,endDate,departmentPath? | `Array<{departmentPath,departmentName,headcount,actualAttendCount,attendanceRate,lateCount,earlyLeaveCount,missCardCount,absentCount,leaveDuration,overtimeDuration}>` |
| `getAbnormalLateRank(params)` | `GET /attendance/board/abnormal/late-rank` | startDate,endDate,departmentPath?,limit? | `Array<{userId,userName,departmentName,lateCount,lateDuration}>` |
| `getAbnormalMisscardRank(params)` | `GET /attendance/board/abnormal/misscard-rank` | startDate,endDate,departmentPath?,limit? | `Array<{userId,userName,departmentName,misscardCount}>` |
| `getAbnormalAbsentList(params)` | `GET /attendance/board/abnormal/absent-list` | startDate,endDate,departmentPath? | `Array<{userId,userName,departmentName,date,reason}>` |
| `getAbnormalDetail(params)` | `GET /attendance/board/abnormal/detail` | startDate,endDate,departmentPath?,page?,size? | `{ list:[{userId,userName,departmentName,date,abnormalType,duration,hasApprovalCancel,validException}], total }` |
| `getAbnormalResubmitList(params)` | `GET /attendance/board/abnormal/resubmit-list` | startDate,endDate,status? | `Array<{userId,userName,departmentName,date,resubmitTime,status}>`（暂可返回空数组，见 13.5） |
| `getLeaveStats(params)` | `GET /attendance/board/leave/stats` | startDate,endDate,departmentPath? | `{ typeDistribution:[{type,duration,count}], departmentRank:[{departmentName,duration}] }` |
| `getOvertimeStats(params)` | `GET /attendance/board/overtime/stats` | startDate,endDate,departmentPath? | `{ totalDuration,dailyAvg,departmentRank:[...], typeBreakdown:{workday,weekend,holiday} }`（见 13.5） |
| `getOutingStats(params)` | `GET /attendance/board/outing/stats` | startDate,endDate,departmentPath? | `{ totalCount,totalDuration, departmentRank:[{departmentName,count,duration}] }`（见 13.5） |
| `getLeaveOvertimeDetail(params)` | `GET /attendance/board/leave-overtime/detail` | startDate,endDate,type('leave'\|'overtime'),page?,size?,departmentPath? | `{ list:[{userId,userName,departmentName,leaveType\|overtimeType,startTime,endTime,duration,status}], total }` |
| `getBoardTrend(params)` | `GET /attendance/board/trend` | startDate,endDate,departmentPath? | `Array<{date,attendanceRate,lateCount,misscardCount,absentCount}>` |
| `getEmployeeAttendanceList(params)` | `GET /attendance/board/employee/list` | startDate,endDate,page?,size?,departmentPath?,keyword? | `{ list:[{userId,userName,employeeId,departmentName,jobTitle,lateCount,earlyLeaveCount,misscardCount,absentCount,leaveDays,overtimeHours}], total }` |
| `getEmployeeCalendar(params)` | `GET /attendance/board/employee/calendar` | userId,month(YYYY-MM) | `{ calendar:[{date,workStatus,checkIn,checkOut,abnormalType,hasLeave,hasOvertime,hasOuting}], summary:{lateCount,earlyLeaveCount,misscardCount,absentCount,leaveDays,overtimeHours} }` |
| `exportEmployeeReport(params)` | `GET /attendance/board/employee/export` | userId,startDate,endDate | **文件流**（Excel，Content-Disposition 附件） |
| `exportDepartmentStats(params)` | `GET /attendance/board/department-stats/export` | startDate,endDate,departmentPath? | **文件流**（Excel） |

**异常明细字段口径**（板块3-4，直接取自 `attendance_daily_result`）：
- `hasApprovalCancel` = `has_approval_cancel`：当日关联了请假/外出审批，异常被抵消
- `validException` = `valid_exception`：抵消后的有效异常，应计入处罚统计
- `abnormalType` 映射：`late_count>0`→迟到、`early_leave_count>0`→早退、`lack_card_count>0`→缺卡、`is_absent=true`→旷工（同一人多异常时按 旷工>缺卡>迟到>早退 取最严重）
- `duration`：迟到/早退/缺卡取分钟数；旷工取分钟（旷工时长可按半天=240 分钟估算）

### 13.2 KPI 字段含义（板块1 总览 `kpi` 对象）

| 字段 | 含义 | 单位 |
|------|------|------|
| `shouldAttendCount` | 应考勤人数（在册且当日应打卡） | 人 |
| `actualAttendCount` | 实际打卡人数 | 人 |
| `attendanceRate` | 出勤率 = 实际打卡/应考勤×100 | % |
| `lateCount` | 迟到总人次 | 人次 |
| `earlyLeaveCount` | 早退总人次 | 人次 |
| `missCardCount` | 缺卡人次 | 人次 |
| `absentCount` | 旷工人次 | 人次 |
| `leaveDuration` | 请假总时长 | 小时 |
| `overtimeDuration` | 加班总时长 | 小时 |
| `outingCount` | 外出人次 | 人次 |

### 13.3 状态分布（板块1 环形图）

`statusDistribution` 固定返回以下状态（值为 0 也返回，保证环形图完整）：

| name | 配色（前端约定） |
|------|------|
| 正常 | `#52c41a` |
| 迟到 | `#faad14` |
| 早退 | `#fa8c16` |
| 缺卡 | `#f5222d` |
| 请假 | `#1890ff` |
| 旷工 | `#a8071a` |

### 13.4 接口 ↔ 数据来源映射（直接查现有表，无需重新调钉钉）

| 看板接口 | 数据来源（hrdb 现有表） | 实现要点 |
|---------|----------------------|---------|
| `getBoardOptions` | `dingtalk_user_mapping` | `SELECT DISTINCT department_path WHERE employment_status='在岗' AND department_path IS NOT NULL` |
| `getBoardOverview` | `attendance_daily_result`（或预计算表 `attendance_department_daily`） | lateCount=`SUM(late_count)`；earlyLeave=`SUM(early_leave_count)`；missCard=`SUM(lack_card_count)`；absent=`COUNT(*) WHERE is_absent`；请假时长=`attendance_leave_status` 汇总；仅统计 `valid_exception=true` 的异常 |
| `getBoardDepartmentStats` | `attendance_department_daily` | `GROUP BY department_path`（区间内 `SUM`），`attendance_rate×100` |
| `getAbnormalLateRank` | `attendance_daily_result` | `WHERE late_count>0 AND valid_exception=true GROUP BY dingtalk_userid ORDER BY COUNT(*) DESC LIMIT n`；lateDuration=`SUM(late_minutes)` |
| `getAbnormalMisscardRank` | `attendance_daily_result` | 同上，`lack_card_count>0` |
| `getAbnormalAbsentList` | `attendance_daily_result` | `WHERE is_absent=true`；reason 可取审批关联说明或固定文案 |
| `getAbnormalDetail` | `attendance_daily_result` | 条件 `(late_count>0 OR early_leave_count>0 OR lack_card_count>0 OR is_absent)`，分页返回；字段映射见 13.1 表下方说明 |
| `getAbnormalResubmitList` | （暂无表） | 见 13.5 缺口①，先返回空数组 |
| `getLeaveStats` | `attendance_leave_status` | typeDistribution 按 `leave_code` 分组；duration_percent×标准工时→小时 |
| `getOvertimeStats` | （暂无表） | 见 13.5 缺口② |
| `getOutingStats` | （暂无表） | 见 13.5 缺口③ |
| `getBoardTrend` | `attendance_department_daily` | `GROUP BY stat_date` 汇总全公司（或按 departmentPath 前缀过滤），周末可返回 0 或照常返回 |
| `getEmployeeAttendanceList` | `attendance_employee_monthly` | `WHERE year_month BETWEEN start月 AND end月`，keyword 模糊匹配 `employee_name/employee_id` |
| `getEmployeeCalendar` | `attendance_daily_result` + `attendance_leave_status` | 按月查询单人；workStatus 映射：正常（无异常）/迟到/早退/缺卡/旷工(is_absent)/请假(has_leave_status)/休息（钉钉侧无打卡要求的日期） |
| `exportEmployeeReport` | 同 calendar 数据 | 后端用 exceljs/sheet 生成 xlsx 流 |
| `exportDepartmentStats` | 同 department-stats 数据 | 同上 |

> 注意：`attendance_daily_result` 中同一行可能同时有迟到+缺卡等多重异常，明细/排行统计按"人次"口径（每个异常字段分别累加），与 KPI 汇总口径一致。

### 13.5 数据缺口与实现优先级

| # | 缺口 | 影响 | 建议方案 |
|---|------|------|---------|
| ① | 补卡申请无表 | 板块3-5 补卡列表 | 方案A：同步钉钉补卡记录（`/topapi/attendance/getleavestatus` 同族接口）新增 `attendance_resubmit_record` 表；方案B：先返回空数组，看板该卡片显示"暂无数据" |
| ② | 加班单据无表 | 板块4-2 加班统计、4-4 加班明细 | 方案A（推荐）：同步钉钉加班结果（`/topapi/attendance/getovertimestatus`）新增 `attendance_overtime_record` 表；方案B（过渡）：读旧月度表"X月考勤"的 `加班总时长/工作日转加班费/休息日转加班费/节假日转加班费` 列（仅月度粒度，typeBreakdown 用三个"转"字段拆分） |
| ③ | 外出/出差无表 | 板块4-3 外出统计 | 同②：钉钉外出记录接口同步；或过渡读旧表 `出差时长/外出时长` 列 |
| ④ | 考勤组维度无表 | 原"考勤组筛选"已从前端移除 | 暂不实现，后续需要再加 |

**建议实现顺序**：overview → department-stats → trend → abnormal 4 个 → employee list/calendar → leave stats → 导出 2 个 → 加班/外出/补卡（等缺口补齐）。
前端已全部实现并带 Mock，后端每完成一个接口即可在前端 `.env` 中逐步切换验证（当前 Mock 是整板开关，也可按接口逐个替换 `attendance.js` 中对应函数的 `USE_MOCK` 分支）。

### 13.6 前端路由对照

| 路由 | 页面 | 调用接口 |
|------|------|---------|
| `/attendance-board` | `AttendanceBoard` | `getBoardOptions` + 6 板块接口 |
| `/sync` | `DataSync`（已有） | `syncAttendance`（钉钉数据同步，看板数据前置来源） |

### 13.7 帆软 BI 数据集对接字段清单

> 帆软 BI 数据源建议直接查询汇总层 DWS 表或调用上述看板接口。每个图表所需字段：

**图表1：KPI 大屏卡片** ← 接口 `getBoardOverview`
- 维度：无（单值）
- 度量：shouldAttendCount、actualAttendCount、attendanceRate、lateCount、earlyLeaveCount、missCardCount、absentCount、leaveDuration、overtimeDuration、outingCount

**图表2：考勤状态分布环形图** ← `statusDistribution`
- 维度：name（正常/迟到/早退/缺卡/请假/旷工）
- 度量：value

**图表3：部门出勤率排名柱状图** ← `getBoardDepartmentStats`
- 维度：departmentName
- 度量：attendanceRate、lateCount、earlyLeaveCount、missCardCount、absentCount、leaveDuration、overtimeDuration

**图表4：异常人员 TOP** ← `getAbnormalLateRank` / `getAbnormalMisscardRank`
- 维度：userName、departmentName
- 度量：lateCount、lateDuration / misscardCount

**图表5：请假类型占比** ← `getLeaveStats.typeDistribution`
- 维度：type
- 度量：duration、count

**图表6：加班类型拆分** ← `getOvertimeStats.typeBreakdown`
- 维度：加班类型（工作日/周末/节假日）
- 度量：时长

**图表7：趋势折线** ← `getBoardTrend`
- 维度：date
- 度量：attendanceRate、lateCount、misscardCount、absentCount

**图表8：人员明细表** ← `getEmployeeAttendanceList`
- 维度：userName、departmentName、jobTitle
- 度量：lateCount、earlyLeaveCount、misscardCount、absentCount、leaveDays、overtimeHours

> 帆软对接优先级：建议优先做图表1、图表3、图表7（总览+部门+趋势），这三张是大屏最核心。

---

**考勤看板接口更新约定**：后端按 13.1 表逐接口实现，字段名与前端 `attendance.js` 保持一致；接口 ↔ 表的取数逻辑见 13.4；加班/外出/补卡三个缺口按 13.5 处理（先返回空数据，前端已做兼容展示）。
