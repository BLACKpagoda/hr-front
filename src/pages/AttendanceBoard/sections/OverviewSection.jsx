// 板块1：考勤总览（首页大屏）
// 展示：KPI 指标卡 + 考勤状态分布环形图
import React, { useEffect, useState } from 'react';
import { Row, Col, Alert, message } from 'antd';
import { getBoardOverview } from '../../../api/attendance';
import { KpiCard, DonutChart, BoardCard } from '../../../components/AttendanceBoard';
import '../AttendanceBoard.css';

// 状态分布固定配色
const STATUS_COLORS = {
  正常: '#52c41a',
  迟到: '#faad14',
  早退: '#fa8c16',
  缺卡: '#f5222d',
  请假: '#1890ff',
  旷工: '#a8071a'
};

const OverviewSection = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getBoardOverview(filters);
        setData(res);
      } catch (err) {
        setError(err.message || '加载总览数据失败');
        message.error(err.message || '加载总览数据失败');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const kpi = data?.kpi || {};
  const distribution = (data?.statusDistribution || []).map(d => ({
    ...d,
    color: d.color || STATUS_COLORS[d.name]
  }));
  const distTotal = distribution.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      {/* KPI 指标卡片 */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="应考勤人数" value={kpi.shouldAttendCount ?? 0} suffix="人" icon="fas fa-users" color="#1890ff" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="实际打卡人数" value={kpi.actualAttendCount ?? 0} suffix="人" icon="fas fa-user-check" color="#52c41a" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="出勤率" value={kpi.attendanceRate ?? 0} suffix="%" icon="fas fa-chart-pie" color="#2f54eb" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="迟到人次" value={kpi.lateCount ?? 0} suffix="次" icon="fas fa-clock" color="#faad14" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="早退人次" value={kpi.earlyLeaveCount ?? 0} suffix="次" icon="fas fa-running" color="#fa8c16" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="缺卡人次" value={kpi.missCardCount ?? 0} suffix="次" icon="fas fa-times-circle" color="#f5222d" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="旷工人次" value={kpi.absentCount ?? 0} suffix="次" icon="fas fa-user-slash" color="#a8071a" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="请假总时长" value={kpi.leaveDuration ?? 0} suffix="h" icon="fas fa-calendar-minus" color="#13c2c2" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="加班总时长" value={kpi.overtimeDuration ?? 0} suffix="h" icon="fas fa-business-time" color="#722ed1" />
        </Col>
        <Col xs={12} sm={8} md={6} xl={4}>
          <KpiCard title="外出人次" value={kpi.outingCount ?? 0} suffix="次" icon="fas fa-map-marker-alt" color="#eb2f96" />
        </Col>
      </Row>

      {/* 状态分布环形图 */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={12}>
          <BoardCard title="考勤状态分布" loading={loading} empty={!distribution.length}>
            <DonutChart data={distribution} title="状态人次" total={distTotal} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="出勤概览说明" loading={loading}>
            <div className="overview-tips">
              <p>• 数据来源：钉钉【考勤日报】API（已由钉钉处理排班、请假抵消、调休）</p>
              <p>• 出勤率 = 实际打卡人数 / 应考勤人数 × 100%</p>
              <p>• 请假/加班时长单位为小时</p>
              <p>• 若当天有合法请假/外出审批，该异常已做抵消处理</p>
              <p>• 钉钉考勤非实时，建议配置定时同步任务，避免高频轮询</p>
            </div>
          </BoardCard>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewSection;
