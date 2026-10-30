# hr-front — HR 人事数据前端

React 19 + Ant Design 5 + ECharts 的 HR 数据管理界面，对接后端 [hrdb](../hrdb)（端口 3001）。

## 快速开始

```bash
npm install

# 创建环境变量（.env* 不入库，参照模板填写）
cp .env.example .env

npm start        # http://localhost:3000
npm run build    # 产物在 build/
```

## 环境变量

见 [.env.example](.env.example)。两个关键项：

| 变量 | 说明 |
|------|------|
| `REACT_APP_API_BASE_URL` | 后端地址，默认 `http://localhost:3001` |
| `REACT_APP_USE_MOCK` | 考勤看板假数据开关，**只有显式写 `true` 才启用**，生产必须是 `false` |

> 生产构建只加载 `.env` + `.env.production`（不加载 `.env.development`）。部署前务必确认
> `.env.production` 里的 `REACT_APP_API_BASE_URL` 已改成真实域名，否则接口全部打不通。

## 功能页面

| 路由 | 功能 |
|------|------|
| `/` | 仪表盘 |
| `/employees` | 员工列表 |
| `/attendance` | 考勤餐补分析导入 |
| `/import` | 数据导入（员工 / 考勤 / 薪酬） |
| `/sync` | 钉钉考勤同步（异步任务 + 进度轮询） |
| `/attendance-board` | 考勤看板（总览 / 部门 / 异常 / 请假加班 / 人员明细） |
| `/salary-analysis` | 薪酬分析 |
| `/fanruan` | 帆软指标导入 |
| `/settings` | 系统设置 |

## 开发说明

- **所有接口调用必须走 `src/api/`**，不要 import `request` 或手写 URL —— 见 [src/utils/request.js](src/utils/request.js) 的拦截器约定
- 新增页面：`src/pages/<Name>/` + `App.jsx` 加一条 `<Route>` + `src/api/` 加对应方法
- 样式用普通 CSS 文件（每组件同名 `.css`），无 CSS Modules / Tailwind

详细约定、已知问题、分支工作流见 [AGENTS.md](AGENTS.md)；前后端接口全表见 [API_CONTRACT.md](API_CONTRACT.md)。
