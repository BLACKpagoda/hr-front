// 板块6：人员明细查询
// 展示：人员考勤列表 + 个人考勤日历视图 + 月度汇总 + 导出个人报表
import React, { useEffect, useState } from 'react';
import { Alert, Table, Input, Select, Button, Calendar, Badge, Modal, message } from 'antd';
import { SearchOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { getEmployeeAttendanceList, getEmployeeCalendar, exportEmployeeReport } from '../../../api/attendance';
import { BoardCard } from '../../../components/AttendanceBoard';
import dayjs from 'dayjs';
import '../AttendanceBoard.css';

const EmployeeDetailSection = ({ filters, options }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [departmentPath, setDepartmentPath] = useState(undefined);

  // 日历弹窗
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarUser, setCalendarUser] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs().format('YYYY-MM'));
  const [calendarData, setCalendarData] = useState({ calendar: [], summary: null });
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getEmployeeAttendanceList({
          ...filters,
          page,
          size: 15,
          keyword,
          departmentPath
        });
        setList(res || { list: [], total: 0 });
      } catch (err) {
        setError(err.message || '加载人员明细失败');
        setList({ list: [], total: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, page, keyword, departmentPath]);

  const openCalendar = (record) => {
    setCalendarUser(record);
    setCalendarMonth((filters.startDate || dayjs().format('YYYY-MM-DD')).slice(0, 7));
    setCalendarVisible(true);
  };

  // 加载日历数据
  useEffect(() => {
    if (!calendarVisible || !calendarUser) return;
    const fetchCalendar = async () => {
      setCalendarLoading(true);
      try {
        const res = await getEmployeeCalendar({
          userId: calendarUser.userId,
          month: calendarMonth
        });
        setCalendarData(res || { calendar: [], summary: null });
      } catch (err) {
        message.error(err.message || '加载日历失败');
        setCalendarData({ calendar: [], summary: null });
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchCalendar();
  }, [calendarVisible, calendarUser, calendarMonth]);

  const handleExport = async (record) => {
    setExporting(true);
    try {
      const blob = await exportEmployeeReport({
        userId: record.userId,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.userName}_考勤报表_${filters.startDate}_${filters.endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error(err.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 日历日期单元格渲染
  const dateCellRender = (date) => {
    const day = (calendarData.calendar || []).find(d => d.date === date.format('YYYY-MM-DD'));
    if (!day) return null;
    const statusMap = {
      正常: { type: 'success', text: '正常' },
      迟到: { type: 'warning', text: '迟到' },
      早退: { type: 'warning', text: '早退' },
      缺卡: { type: 'error', text: '缺卡' },
      旷工: { type: 'error', text: '旷工' },
      请假: { type: 'processing', text: '请假' },
      休息: { type: 'default', text: '休息' }
    };
    const s = statusMap[day.workStatus] || statusMap[day.abnormalType] || { type: 'default', text: day.workStatus };
    return (
      <div style={{ textAlign: 'center' }}>
        <Badge status={s.type} text={<span style={{ fontSize: 11 }}>{s.text}</span>} />
        {day.hasLeave && <div style={{ fontSize: 10, color: '#1890ff' }}>请假</div>}
        {day.hasOvertime && <div style={{ fontSize: 10, color: '#722ed1' }}>加班</div>}
      </div>
    );
  };

  const columns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '岗位', dataIndex: 'jobTitle', key: 'jobTitle', width: 120, ellipsis: true },
    { title: '迟到', dataIndex: 'lateCount', key: 'lateCount', width: 70, align: 'center' },
    { title: '早退', dataIndex: 'earlyLeaveCount', key: 'earlyLeaveCount', width: 70, align: 'center' },
    { title: '缺卡', dataIndex: 'misscardCount', key: 'misscardCount', width: 70, align: 'center' },
    { title: '旷工', dataIndex: 'absentCount', key: 'absentCount', width: 70, align: 'center' },
    { title: '请假(天)', dataIndex: 'leaveDays', key: 'leaveDays', width: 90, align: 'center' },
    { title: '加班(h)', dataIndex: 'overtimeHours', key: 'overtimeHours', width: 90, align: 'center' },
    {
      title: '操作', key: 'action', width: 160, align: 'center', fixed: 'right',
      render: (_, record) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Button type="link" size="small" icon={<CalendarOutlined />} onClick={() => openCalendar(record)}>
            日历
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} loading={exporting} onClick={() => handleExport(record)}>
            导出
          </Button>
        </span>
      )
    }
  ];

  const summary = calendarData.summary || {};

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      <div className="employee-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索姓名/工号"
          style={{ width: 200 }}
          onPressEnter={e => { setKeyword(e.target.value); setPage(1); }}
          onChange={e => { if (!e.target.value) { setKeyword(''); setPage(1); } }}
        />
        <Select
          allowClear
          placeholder="选择部门"
          style={{ width: 200 }}
          value={departmentPath}
          onChange={v => { setDepartmentPath(v); setPage(1); }}
          options={(options?.departments || []).map(d => ({ value: d.path, label: d.name }))}
        />
      </div>

      <BoardCard title="人员考勤明细" loading={loading} empty={!list.list.length}>
        <Table
          size="small"
          rowKey="userId"
          dataSource={list.list}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: 15,
            total: list.total,
            size: 'small',
            showTotal: t => `共 ${t} 人`,
            onChange: p => setPage(p)
          }}
        />
      </BoardCard>

      <Modal
        title={`${calendarUser?.userName || ''} 的考勤日历 - ${calendarMonth}`}
        open={calendarVisible}
        onCancel={() => { setCalendarVisible(false); setCalendarUser(null); }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <div className="calendar-month-picker">
          <Input.Search
            placeholder="YYYY-MM"
            value={calendarMonth}
            enterButton="查询"
            onSearch={v => setCalendarMonth(v)}
            style={{ width: 240 }}
          />
        </div>

        {calendarLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : (
          <>
            <Calendar fullscreen={false} dateCellRender={dateCellRender} />
            <div className="calendar-summary">
              <h4>月度汇总</h4>
              <div className="summary-grid">
                <span>迟到：{summary.lateCount ?? 0} 次</span>
                <span>早退：{summary.earlyLeaveCount ?? 0} 次</span>
                <span>缺卡：{summary.misscardCount ?? 0} 次</span>
                <span>旷工：{summary.absentCount ?? 0} 次</span>
                <span>请假：{summary.leaveDays ?? 0} 天</span>
                <span>加班：{summary.overtimeHours ?? 0} 小时</span>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeDetailSection;
