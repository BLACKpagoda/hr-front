// 板块4：请假 & 加班 & 外出看板
// 展示：请假类型分布环形图 + 部门请假排行 + 加班统计 + 外出统计 + 单据明细
import React, { useEffect, useState } from 'react';
import { Row, Col, Alert, Table, Tag, message } from 'antd';
import {
  getLeaveStats,
  getOvertimeStats,
  getOutingStats,
  getLeaveOvertimeDetail
} from '../../../api/attendance';
import { BoardCard, DonutChart, BarChart, KpiCard } from '../../../components/AttendanceBoard';
import '../AttendanceBoard.css';

const LeaveOvertimeSection = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaveStats, setLeaveStats] = useState(null);
  const [overtimeStats, setOvertimeStats] = useState(null);
  const [outingStats, setOutingStats] = useState(null);
  const [detail, setDetail] = useState({ list: [], total: 0 });
  const [detailType, setDetailType] = useState('leave'); // leave | overtime
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;

    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [leave, overtime, outing] = await Promise.all([
          getLeaveStats(filters),
          getOvertimeStats(filters),
          getOutingStats(filters)
        ]);
        setLeaveStats(leave);
        setOvertimeStats(overtime);
        setOutingStats(outing);
      } catch (err) {
        setError(err.message || '加载请假加班数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [filters]);

  // 单据明细（请假/加班切换）
  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;
    const fetchDetail = async () => {
      try {
        const res = await getLeaveOvertimeDetail({
          ...filters,
          type: detailType,
          page: detailPage,
          size: 15
        });
        setDetail(res || { list: [], total: 0 });
      } catch (err) {
        message.error(err.message || '加载明细失败');
        setDetail({ list: [], total: 0 });
      }
    };
    fetchDetail();
  }, [filters, detailType, detailPage]);

  // 请假类型分布
  const leaveDist = (leaveStats?.typeDistribution || []).map(d => ({
    name: d.type,
    value: d.duration
  }));

  // 部门请假排行
  const leaveDeptRank = (leaveStats?.departmentRank || []).map(d => ({
    name: d.departmentName,
    value: d.duration
  })).sort((a, b) => b.value - a.value);

  // 部门加班排行
  const overtimeDeptRank = (overtimeStats?.departmentRank || []).map(d => ({
    name: d.departmentName,
    value: d.duration
  })).sort((a, b) => b.value - a.value);

  // 加班类型拆分柱状图
  const overtimeTypeBreakdown = overtimeStats?.typeBreakdown
    ? [
        { name: '工作日加班', value: overtimeStats.typeBreakdown.workday || 0 },
        { name: '周末加班', value: overtimeStats.typeBreakdown.weekend || 0 },
        { name: '节假日加班', value: overtimeStats.typeBreakdown.holiday || 0 }
      ]
    : [];

  // 外出部门排行（双指标：人次/时长）
  const outingDeptData = (outingStats?.departmentRank || []).map(d => d.departmentName);

  const leaveColumns = [
    { title: '申请人', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '请假类型', dataIndex: 'leaveType', key: 'leaveType', width: 100 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 150 },
    { title: '时长(h)', dataIndex: 'duration', key: 'duration', width: 90, align: 'center' },
    {
      title: '审批状态', dataIndex: 'status', key: 'status', width: 90, align: 'center',
      render: v => <Tag color={v === 'approved' ? 'green' : v === 'pending' ? 'orange' : 'red'}>
        {v === 'approved' ? '已通过' : v === 'pending' ? '审批中' : '已驳回'}
      </Tag>
    }
  ];

  const overtimeColumns = [
    { title: '申请人', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '加班类型', dataIndex: 'overtimeType', key: 'overtimeType', width: 100 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 150 },
    { title: '时长(h)', dataIndex: 'duration', key: 'duration', width: 90, align: 'center' },
    {
      title: '审批状态', dataIndex: 'status', key: 'status', width: 90, align: 'center',
      render: v => <Tag color={v === 'approved' ? 'green' : v === 'pending' ? 'orange' : 'red'}>
        {v === 'approved' ? '已通过' : v === 'pending' ? '审批中' : '已驳回'}
      </Tag>
    }
  ];

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      {/* 加班 KPI 总览 */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8}>
          <KpiCard title="加班总时长" value={overtimeStats?.totalDuration ?? 0} suffix="h" icon="fas fa-business-time" color="#722ed1" />
        </Col>
        <Col xs={12} sm={8}>
          <KpiCard title="日均加班" value={overtimeStats?.dailyAvg ?? 0} suffix="h" icon="fas fa-chart-line" color="#9254de" />
        </Col>
        <Col xs={12} sm={8}>
          <KpiCard title="外出人次" value={outingStats?.totalCount ?? 0} suffix="次" icon="fas fa-map-marker-alt" color="#eb2f96" />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} lg={12}>
          <BoardCard title="请假类型分布" loading={loading} empty={!leaveDist.length}>
            <DonutChart data={leaveDist} title="时长(h)" />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="各部门请假时长排行" loading={loading} empty={!leaveDeptRank.length}>
            <BarChart data={leaveDeptRank} horizontal color="#13c2c2" height={Math.max(280, leaveDeptRank.length * 32)} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="各部门加班时长排行" loading={loading} empty={!overtimeDeptRank.length}>
            <BarChart data={overtimeDeptRank} horizontal color="#722ed1" height={Math.max(280, overtimeDeptRank.length * 32)} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="加班类型拆分" loading={loading} empty={!overtimeTypeBreakdown.length}>
            <BarChart data={overtimeTypeBreakdown} color="#9254de" height={280} />
          </BoardCard>
        </Col>
        {outingDeptData.length > 0 && (
          <Col xs={24} lg={12}>
            <BoardCard title="各部门外出人次/时长" loading={loading}>
              <BarChart
                data={outingDeptData.map(name => ({ name }))}
                series={[
                  { name: '外出人次', data: (outingStats.departmentRank || []).map(d => d.count || 0), color: '#eb2f96' },
                  { name: '外出时长(h)', data: (outingStats.departmentRank || []).map(d => d.duration || 0), color: '#f759ab' }
                ]}
                height={280}
              />
            </BoardCard>
          </Col>
        )}
      </Row>

      {/* 单据明细 */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24}>
          <BoardCard
            title={detailType === 'leave' ? '请假单据明细' : '加班单据明细'}
            loading={loading}
            empty={!detail.list.length}
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag.CheckableTag checked={detailType === 'leave'} onChange={() => { setDetailType('leave'); setDetailPage(1); }}>
                  请假单
                </Tag.CheckableTag>
                <Tag.CheckableTag checked={detailType === 'overtime'} onChange={() => { setDetailType('overtime'); setDetailPage(1); }}>
                  加班单
                </Tag.CheckableTag>
              </div>
            }
          >
            <Table
              size="small"
              rowKey={(r, i) => `${r.userId}-${r.startTime}-${i}`}
              dataSource={detail.list}
              columns={detailType === 'leave' ? leaveColumns : overtimeColumns}
              pagination={{
                current: detailPage,
                pageSize: 15,
                total: detail.total,
                size: 'small',
                showTotal: t => `共 ${t} 条`,
                onChange: p => setDetailPage(p)
              }}
            />
          </BoardCard>
        </Col>
      </Row>
    </div>
  );
};

export default LeaveOvertimeSection;
