// 考勤看板主页面：统一筛选区 + Tabs 聚合 6 大板块
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Tabs, DatePicker, Select, Radio, Row, Col, Space, Tag, ConfigProvider, Empty } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import dayjs from 'dayjs';
import { getBoardOptions, getDataCoverage, USE_MOCK } from '../../api/attendance';
import OverviewSection from './sections/OverviewSection';
import DepartmentSection from './sections/DepartmentSection';
import AbnormalSection from './sections/AbnormalSection';
import LeaveOvertimeSection from './sections/LeaveOvertimeSection';
import TrendSection from './sections/TrendSection';
import EmployeeDetailSection from './sections/EmployeeDetailSection';
import './AttendanceBoard.css';

const { RangePicker } = DatePicker;

// 快捷周期
const QUICK_RANGES = {
  today: () => [dayjs(), dayjs()],
  week: () => [dayjs().startOf('week').add(1, 'day'), dayjs()], // 周一~今日
  month: () => [dayjs().startOf('month'), dayjs()],
  last30: () => [dayjs().subtract(29, 'day'), dayjs()],
  lastMonth: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
};

const AttendanceBoard = () => {
  const [quickRange, setQuickRange] = useState('lastMonth');
  const [dateRange, setDateRange] = useState(QUICK_RANGES.lastMonth());
  const [departmentPath, setDepartmentPath] = useState(undefined);
  const [options, setOptions] = useState({ departments: [] });
  const [activeTab, setActiveTab] = useState('overview');
  const [dataCoverage, setDataCoverage] = useState(null);

  // 加载筛选下拉数据 + 数据覆盖范围
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [opts, coverage] = await Promise.all([
          getBoardOptions(),
          getDataCoverage(),
        ]);
        setOptions(opts || { departments: [] });

        // 根据数据覆盖范围自动调整默认日期
        if (coverage?.daily_result?.max_date) {
          setDataCoverage(coverage);
          const maxDate = dayjs(coverage.daily_result.max_date);

          // 如果当前月没有数据，跳到有数据的最后一个月
          if (maxDate.isBefore(dayjs().startOf('month'))) {
            const lastMonthEnd = maxDate;
            const lastMonthStart = maxDate.startOf('month');
            setQuickRange('custom');
            setDateRange([lastMonthStart, lastMonthEnd]);
          }
        }
      } catch (err) {
        console.error('加载筛选项失败', err);
      }
    };
    fetchAll();
  }, []);

  // 统一传给各板块的 filters
  const filters = useMemo(() => ({
    startDate: dateRange[0]?.format('YYYY-MM-DD') || '',
    endDate: dateRange[1]?.format('YYYY-MM-DD') || '',
    departmentPath: departmentPath || undefined
  }), [dateRange, departmentPath]);

  const handleQuickChange = (key) => {
    setQuickRange(key);
    if (key !== 'custom') {
      setDateRange(QUICK_RANGES[key]());
    }
  };

  const handleRangeChange = (dates) => {
    setDateRange(dates || [null, null]);
    setQuickRange('custom');
  };

  const tabItems = [
    { key: 'overview', label: '📊 考勤总览', children: <OverviewSection filters={filters} /> },
    { key: 'department', label: '🏢 部门统计', children: <DepartmentSection filters={filters} /> },
    { key: 'abnormal', label: '⚠️ 异常考勤', children: <AbnormalSection filters={filters} /> },
    { key: 'leave', label: '🕐 请假加班', children: <LeaveOvertimeSection filters={filters} /> },
    { key: 'trend', label: '📈 趋势分析', children: <TrendSection filters={filters} /> },
    { key: 'employee', label: '👤 人员明细', children: <EmployeeDetailSection filters={filters} options={options} /> }
  ];

  const hasDate = filters.startDate && filters.endDate;

  return (
    <ConfigProvider locale={zhCN}>
      <div className="attendance-board">
        <div className="board-page-header">
          <h2>考勤看板</h2>
          <p>钉钉考勤数据可视化看板 · 数据基础：钉钉【考勤日报】API（已处理排班/请假抵消/调休）· 最终大屏报表对接帆软BI</p>
        </div>

        {/* 统一筛选区 */}
        <Card className="board-filter-card" size="small">
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md="auto">
              <Radio.Group value={quickRange} onChange={e => handleQuickChange(e.target.value)} size="small">
                <Radio.Button value="today">今日</Radio.Button>
                <Radio.Button value="week">本周</Radio.Button>
                <Radio.Button value="month">本月</Radio.Button>
                <Radio.Button value="last30">近30天</Radio.Button>
                <Radio.Button value="lastMonth">上月</Radio.Button>
                <Radio.Button value="custom">自定义</Radio.Button>
              </Radio.Group>
            </Col>
            <Col xs={24} md="auto">
              <RangePicker
                value={dateRange}
                onChange={handleRangeChange}
                allowClear={false}
                format="YYYY-MM-DD"
                size="small"
                style={{ width: 240 }}
              />
            </Col>
            <Col xs={24} md="auto">
              <Select
                allowClear
                showSearch
                placeholder="选择部门"
                size="small"
                style={{ width: 200 }}
                value={departmentPath}
                onChange={setDepartmentPath}
                options={options.departments?.map(d => ({ value: d.path, label: d.name }))}
                optionFilterProp="label"
              />
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Space>
                {USE_MOCK && <Tag color="orange">演示数据（Mock）</Tag>}
                {dataCoverage?.daily_result && (
                  <Tag color="purple">
                    数据范围：{dayjs(dataCoverage.daily_result.min_date).format('YYYY-MM-DD')} ~ {dayjs(dataCoverage.daily_result.max_date).format('YYYY-MM-DD')}
                  </Tag>
                )}
                <Tag color="blue">{filters.startDate} ~ {filters.endDate}</Tag>
                {departmentPath && <Tag color="cyan">部门筛选</Tag>}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 数据未就绪提示 */}
        {!hasDate ? (
          <Card className="board-empty-card">
            <Empty description="请先选择查询日期范围" />
          </Card>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="board-tabs"
            type="card"
          />
        )}

        {/* 同步提示 */}
        <div className="board-footer-tip">
          提示：钉钉考勤非实时，打卡后几分钟才生成日报。建议在【考勤数据同步】页配置定时同步任务后再查看本看板。
          本看板数据以同步至本地数据库的考勤日报为准，已自动过滤离职人员。
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AttendanceBoard;
