// 板块2：部门维度统计
// 展示：各部门出勤率排名柱状图 + 迟到/早退/缺卡/旷工对比 + 汇总表（导出）
import React, { useEffect, useState } from 'react';
import { Row, Col, Alert, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getBoardDepartmentStats, exportDepartmentStats } from '../../../api/attendance';
import { BoardCard, BarChart } from '../../../components/AttendanceBoard';
import { Table } from 'antd';
import '../AttendanceBoard.css';

const DepartmentSection = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getBoardDepartmentStats(filters);
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err.message || '加载部门统计失败');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // 出勤率排名数据（横向柱状图）
  const rateData = data
    .map(d => ({ name: d.departmentName, value: Number(d.attendanceRate || 0).toFixed(1) }))
    .sort((a, b) => b.value - a.value);

  // 迟到/早退/缺卡/旷工对比（多系列柱状图）
  const categories = data.map(d => d.departmentName);
  const abnormalSeries = [
    { name: '迟到', data: data.map(d => d.lateCount || 0), color: '#faad14' },
    { name: '早退', data: data.map(d => d.earlyLeaveCount || 0), color: '#fa8c16' },
    { name: '缺卡', data: data.map(d => d.missCardCount || 0), color: '#f5222d' },
    { name: '旷工', data: data.map(d => d.absentCount || 0), color: '#a8071a' }
  ];

  // 请假/加班时长对比
  const durationSeries = [
    { name: '请假时长(h)', data: data.map(d => d.leaveDuration || 0), color: '#13c2c2' },
    { name: '加班时长(h)', data: data.map(d => d.overtimeDuration || 0), color: '#722ed1' }
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDepartmentStats(filters);
      // 拦截器对 blob 原样返回
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `部门考勤汇总_${filters.startDate}_${filters.endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error(err.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const tableColumns = [
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', fixed: 'left', width: 160 },
    { title: '应考勤人数', dataIndex: 'headcount', key: 'headcount', width: 100, align: 'center' },
    { title: '实际打卡', dataIndex: 'actualAttendCount', key: 'actualAttendCount', width: 90, align: 'center' },
    {
      title: '出勤率', dataIndex: 'attendanceRate', key: 'attendanceRate', width: 100, align: 'center',
      render: v => <span style={{ color: (v || 0) >= 95 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>{Number(v || 0).toFixed(1)}%</span>
    },
    { title: '迟到', dataIndex: 'lateCount', key: 'lateCount', width: 80, align: 'center' },
    { title: '早退', dataIndex: 'earlyLeaveCount', key: 'earlyLeaveCount', width: 80, align: 'center' },
    { title: '缺卡', dataIndex: 'missCardCount', key: 'missCardCount', width: 80, align: 'center' },
    { title: '旷工', dataIndex: 'absentCount', key: 'absentCount', width: 80, align: 'center' },
    { title: '请假时长(h)', dataIndex: 'leaveDuration', key: 'leaveDuration', width: 100, align: 'center' },
    { title: '加班时长(h)', dataIndex: 'overtimeDuration', key: 'overtimeDuration', width: 100, align: 'center' }
  ];

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <BoardCard title="各部门出勤率排名" loading={loading} empty={!rateData.length}>
            <BarChart data={rateData} horizontal color="#2f54eb" height={Math.max(300, rateData.length * 32)} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="异常考勤人次对比" loading={loading} empty={!categories.length}>
            <BarChart data={categories.map(name => ({ name }))} series={abnormalSeries} height={Math.max(300, categories.length * 32)} />
          </BoardCard>
        </Col>
        <Col xs={24}>
          <BoardCard title="请假/加班时长对比" loading={loading} empty={!categories.length}>
            <BarChart data={categories.map(name => ({ name }))} series={durationSeries} height={300} />
          </BoardCard>
        </Col>
        <Col xs={24}>
          <BoardCard
            title="部门考勤汇总表"
            loading={loading}
            empty={!data.length}
            extra={
              <Button type="primary" size="small" icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                导出 Excel
              </Button>
            }
          >
            <Table
              size="small"
              rowKey="departmentId"
              dataSource={data}
              columns={tableColumns}
              pagination={data.length > 20 ? { pageSize: 20, size: 'small' } : false}
              scroll={{ x: 1000 }}
            />
          </BoardCard>
        </Col>
      </Row>
    </div>
  );
};

export default DepartmentSection;
