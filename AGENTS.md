# hr-front — HR 人事数据前端

> 本文件供 AI 编码助手（DSH / Trae / Cursor 等）在开工前读取。
> 配套契约文档：[API_CONTRACT.md](API_CONTRACT.md)（309 行，接口全表 + 字段口径，**改接口调用必须同步更新它**）。
> 后端仓库：`D:\personnelDep\hrdb`（端口 3001）。

## 一句话定位

React 单页应用，对接 hrdb 后端，提供员工管理、考勤看板、数据同步、薪酬分析、帆软指标导入等页面。前端跑 3000，后端跑 3001。

## 技术栈（以实际代码为准）

| 项 | 实际情况 |
|----|---------|
| 框架 | React 19.1 + **Create React App（react-scripts 5.0.1）** |
| UI | Ant Design 5 + ECharts 6（`echarts` + `echarts-for-react`） |
| 路由 | react-router-dom 6（`BrowserRouter`） |
| 请求 | axios，统一封装在 [src/utils/request.js](src/utils/request.js) |
| 日期 | **dayjs 与 moment 并存**（功能重叠，见待办） |
| 构建 | CRA 内置 webpack；**无 vite、无 tsconfig，纯 JSX** |

## 启动

```bash
npm install
npm start          # http://localhost:3000，热更新
npm run build      # 产物在 build/（已 gitignore）
```

环境变量（CRA 约定 `REACT_APP_*` 前缀，`.env*` 全部**不入库**）：

| 文件 | 变量 | 当前值 |
|------|------|--------|
| `.env` | `REACT_APP_API_BASE_URL` | `http://localhost:3001` |
| `.env` | `REACT_APP_USE_MOCK` | **未定义** |
| `.env.development` | `REACT_APP_API_BASE_URL` / `REACT_APP_USE_MOCK` | `http://localhost:3001` / `false` |
| `.env.production` | `REACT_APP_API_BASE_URL` | `http://localhost:3001`（占位，部署前必须改成真实域名） |
| `.env.production` | `REACT_APP_USE_MOCK` | **未定义** ⚠️ |

### ⚠️ Mock 开关的默认值是「开」

[src/api/attendance.js](src/api/attendance.js) 第 8 行：

```js
export const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';
```

即**只要环境里没写 `REACT_APP_USE_MOCK=false`，考勤看板的 17 个接口就全部返回 `src/mock/attendanceBoardMock.js` 里的假数据**。

`.env` 和 `.env.production` 都没有定义这个变量，而 `npm run build` 只加载 `.env` + `.env.production`（**不加载 `.env.development`**）→ **当前生产构建的看板显示的是 mock 假数据**。

修法（二选一，改完必须重新 build）：
- 在 `.env.production` 加 `REACT_APP_USE_MOCK=false`；或
- 把判定改成显式白名单：`process.env.REACT_APP_USE_MOCK === 'true'`（默认关闭，更安全）

## 目录结构

```
src/
├── api/                  ★ 接口层：按业务域封装所有 URL（页面不得绕过）
│   ├── employee.js       /personnel/list、/import-employees
│   ├── attendance.js     /attendance/*、/sync、看板 17 个（含 USE_MOCK 开关）
│   ├── salary.js         /salary-periods、/salary-all-data、/salary-summary、/import-salary
│   ├── fanruan.js        /export-fanruan
│   └── index.js          统一出口（export * as xxxApi）
├── components/           可复用业务组件
│   ├── AttendanceBoard/  看板原子组件（KpiCard、各 Chart、RankList）
│   ├── Dashboard/        StatsCard、RecentActivity
│   ├── Import/           EmployeeImport / AttendanceImport / SalaryImport
│   ├── Layout/           Header / Sidebar / MainContent
│   ├── SalaryAnalysis/   SalaryFilter / SalaryReport / SalaryTotalReport
│   └── Sync/             ⚠️ 空目录，可删
├── pages/                页面级组件，与路由一一对应
├── utils/request.js      ★ axios 实例 + 拦截器
├── mock/                 attendanceBoardMock.js（仅 USE_MOCK 时用）
├── model/                ⚠️ 空目录，可删
├── App.jsx               根组件 + 路由表
├── index.js              入口
└── reportWebVitals.js    CRA 默认文件
```

## 路由 ↔ 页面 ↔ 接口

| 路径 | 页面组件 | 主要接口 |
|------|---------|---------|
| `/` | `Dashboard` | 暂无 |
| `/employees` | `EmployeeManagement` | `/personnel/list` |
| `/attendance` | `Attendance` | `POST /attendance/import` |
| `/import` | `ImportData`（3 个 Tab） | `/import-employees`、`/attendance/excel`、`/import-salary` |
| `/sync` | `DataSync` | `POST /sync` + 轮询 `GET /sync/status/:jobId` |
| `/attendance-board` | `AttendanceBoard` | 看板 17 个接口 |
| `/salary-analysis` | `SalaryAnalysis` | `/salary-periods`、`/salary-all-data`、`/salary-summary` |
| `/fanruan` | `Fanruan` | `POST /export-fanruan` |
| `/settings` | `SystemSettings` | 暂无 |

## 关键约定（改代码前必读）

1. **页面只通过 `src/api/*` 调接口**，不得 `import request` 直接写 URL。

   ```js
   // ❌ 不要
   import request from '../../utils/request';
   const res = await request.get('/personnel/list');

   // ✅ 这样
   import { getEmployeeList } from '../../api/employee';
   const res = await getEmployeeList(page, size);   // 已是解包后的 { list, total }
   ```

2. **响应拦截器已经解了一层**：`code === 200` 时返回 `res.data`（业务数据）。
   凡是**不走 `request` 而直接用裸 `axios`** 的组件，要自己取 `response.data.data`（如 `SalaryAnalysis.jsx`）。新增代码统一走 `request`。

3. **错误处理**：拦截器在 `code !== 200` 时 `reject(new Error(msg))`，页面 `catch (e)` 里直接用 `e.message` 提示，不要自己解析结构。

4. **字段命名**：前端 JS 用小驼峰，后端 DB 用下划线，转换在接口层完成。
   **例外：薪酬模块返回中文键**（`"期间"`、`"公司"`、`"应计工资总和"`…），按中文键读，不要重命名。

5. **文件上传**：`multipart/form-data`，字段名固定 `file`；考勤类额外带 `month`（`YYYY-MM`），员工导入可带 `sheetName`。

6. **不要自己算迟到/旷工/出勤率**：后端已按 `valid_exception` 过滤审批抵消，出勤率后端已 ×100。前端只做展示。
   异常严重程度排序也由后端给出（`旷工 > 缺卡 > 迟到 > 早退`）。

7. **看板数据口径文档在 `API_CONTRACT.md` 第十三章**，改任何看板字段前先读。

8. 样式用**普通 CSS 文件**（每个组件同名 `.css`），没有 CSS Modules / Tailwind / styled-components，不要引入新的样式方案。

## 已知问题 / 技术债

| # | 问题 | 影响 |
|---|------|------|
| 1 | **生产构建 USE_MOCK 默认开启**（见上） | 高：看板线上显示假数据 |
| 2 | `.env.production` 的 `REACT_APP_API_BASE_URL` 还是 `localhost:3001` | 高：部署到服务器后接口全打不通 |
| 3 | `react-scripts 5` 自 2022 年起停止维护，官方已不推荐，与 React 19 属边缘组合 | 中：迟早迁 Vite |
| 4 | 打包体积 **791 kB（gzip）**，无路由级 code splitting，antd + echarts 全量进主包 | 中：首屏慢 |
| 5 | `moment` 与 `dayjs` 共存 | 低：可去 moment 减体积 |
| 6 | 无登录页，`request.js` 里的 token 注入逻辑还在但无来源 | 中：鉴权未闭环 |
| 7 | `src/components/Sync/`、`src/model/` 是空目录 | 低：可删 |
| 8 | [README.md](README.md) 还是 CRA 默认模板，没写项目说明 | 低：可换成真文档 |
| 9 | `.env` 里 `REACT_APP_USE_MOCK` 缺失，导致 `npm start` 之外的场景默认 mock | 高：与 #1 同源 |

## 验证（改完必须跑）

```bash
npm run build        # 必须 Compiled successfully，注意看有无新警告
npm start            # 起开发服务器，手动点一遍改动的页面
npm test             # CRA 自带（目前只有 App.test.js 脚手架用例）
```

CRA 构建里 **warning 不会中断构建**，但 `CI=true` 下 warning 会变 error —— 部署流水线如果设了 `CI=true`，本地也要用 `CI=true npm run build` 预演。

## Git 工作流（重要）

**master 始终保持可运行，不直接提交。**

```bash
git checkout -b feat/简短描述      # 或 fix/、docs/
# ... 改代码 + npm run build 验证 ...
git add -A && git commit -m "feat: 做了什么"
git push -u origin feat/简短描述   # 推的是分支，不是 master
# 然后在 GitHub 开 PR 合回 master
```

硬性红线：

- **不直接 push 到 master**
- **不 force push**，不改写已推送的历史
- 一次任务一个分支
- 提交前确认 `git status` 里没有 `.env*`、`build/`、`node_modules/`

## 与 AI 协作须知

- 这是**内部人事系统**，涉及真实员工姓名、薪酬数据。不要把接口返回的真实业务数据贴到对话里。
- 改动涉及多个组件时，先给出方案再动手，避免大面积重排目录（这个项目刚经历过一次「重构项目结构」，历史 diff 已经很大）。
- 视觉类改动（颜色、间距、图表样式）建议在 Trae 里配合浏览器预览做，或明确告诉我预期效果。
