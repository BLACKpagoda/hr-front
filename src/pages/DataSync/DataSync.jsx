import React, { useState, useRef, useEffect } from 'react';
import { DatePicker, Button, Card, message, Progress, Typography, Select, ConfigProvider, Tag, Upload } from 'antd';
import { SyncOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { syncAttendance, getSyncStatus, importRoster, getRosterStats } from '../../api/attendance';
import zhCN from 'antd/lib/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import './DataSync.css';

dayjs.locale('zh-cn');

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 时间粒度选项
const TIME_GRANULARITY = {
  DAY: 'day',
  MONTH: 'month'
};

const POLL_INTERVAL = 3000; // 轮询间隔 3 秒

const DataSync = () => {
  // 状态管理
  const [timeRange, setTimeRange] = useState([]); // [startMoment, endMoment] 最终值
  const [pickerDates, setPickerDates] = useState(null); // RangePicker 面板中间态，驱动 disabledDate
  const [granularity, setGranularity] = useState(''); // 初始化为空，必须选择
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [syncLog, setSyncLog] = useState([]);
  const [syncStatus, setSyncStatus] = useState(''); // running / done / error
  const [rosterMonth, setRosterMonth] = useState(dayjs()); // 花名册月份
  const [rosterUploading, setRosterUploading] = useState(false);
  const [rosterStats, setRosterStats] = useState([]);

  // 轮询定时器引用
  const pollTimerRef = useRef(null);
  const jobIdRef = useRef(null);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // 加载花名册概况
  useEffect(() => {
    loadRosterStats();
  }, []);

  const loadRosterStats = async () => {
    try {
      const data = await getRosterStats();
      setRosterStats(data || []);
    } catch (err) {
      console.warn('花名册概况获取失败:', err.message);
    }
  };

  // 花名册导入
  const handleRosterUpload = async (file) => {
    if (!file) return false;
    const month = rosterMonth.format('YYYY-MM');
    setRosterUploading(true);
    try {
      const data = await importRoster(file, month);
      message.success(`花名册导入成功：${data.inserted} 条记录（${month}），表头在第 ${data.headerRow} 行`, 8);
      loadRosterStats(); // 刷新概况
    } catch (err) {
      // err.message 可能包含后端返回的列名详情，用长时长展示
      message.error({ content: err.message || '花名册导入失败', duration: 10 });
    } finally {
      setRosterUploading(false);
    }
    return false; // 阻止 antd 自动上传
  };

  // 禁用未来日期
  const disabledDate = (current) => {
    return current && current.isAfter(dayjs().endOf('day'));
  };

  // RangePicker：禁用未来日期 + 限制最大31天跨度
  const disabledRangeDate = (current) => {
    if (!current) return false;
    if (current.isAfter(dayjs().endOf('day'))) return true;
    const picked = pickerDates;
    if (!picked || !picked[0]) return false;
    const tooLate = current.diff(picked[0], 'days') >= 31;
    const tooEarly = picked[0].diff(current, 'days') >= 31;
    return tooLate || tooEarly;
  };

  // 处理粒度切换
  const handleGranularityChange = (value) => {
    setGranularity(value);
    setTimeRange([]); // 切换时清空选择
    setPickerDates(null);
  };

  // 格式化参数给后端
  const formatTimeParams = () => {
    if (granularity === TIME_GRANULARITY.MONTH) {
      const month = timeRange[0];
      return {
        startDate: month.startOf('month').format('YYYY-MM-DD'),
        endDate: month.endOf('month').format('YYYY-MM-DD'),
      };
    } else {
      return {
        startDate: timeRange[0]?.format('YYYY-MM-DD') || '',
        endDate: timeRange[1]?.format('YYYY-MM-DD') || '',
      };
    }
  };

  // 检查是否可以同步（按钮状态控制）
  const canSync = () => {
    if (syncing) return false;
    if (!granularity) return false;

    if (granularity === TIME_GRANULARITY.MONTH) {
      return !!timeRange[0];
    } else {
      return timeRange.length === 2 && !!timeRange[0] && !!timeRange[1];
    }
  };

  // 轮询任务状态
  const startPolling = (jobId) => {
    // 立即查一次
    const poll = async () => {
      try {
        const status = await getSyncStatus(jobId);
        setProgress(status.progress || 0);
        setStage(status.stage || '');
        setSyncStatus(status.status || 'running');
        // 用后端日志替换本地日志
        if (status.logs && status.logs.length > 0) {
          setSyncLog(status.logs.map((log, idx) => ({
            id: `${jobId}-${idx}`,
            timestamp: log.time,
            content: log.message,
            type: log.type || 'info',
          })));
        }

        if (status.status === 'done') {
          // 同步完成
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setSyncing(false);
          setProgress(100);
          // 解析最终结果
          const r = status.result;
          if (r) {
            message.success(`同步完成：匹配 ${r.matchedUsers ?? 0} 人，打卡 ${r.checkStats?.dailyRows ?? 0} 行`);
          } else {
            message.success('同步完成');
          }
        } else if (status.status === 'error') {
          // 同步失败
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setSyncing(false);
          message.error(status.error || '同步失败');
        }
      } catch (err) {
        // 轮询失败不中断，下次重试
        console.warn('轮询状态失败:', err.message);
      }
    };

    poll(); // 立即执行一次
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
  };

  // 执行同步
  const handleSync = async () => {
    if (!canSync()) {
      message.warning('请完善同步参数');
      return;
    }

    // 重置状态
    setSyncing(true);
    setProgress(0);
    setStage('初始化');
    setSyncLog([]);
    setSyncStatus('running');

    const params = formatTimeParams();

    try {
      // 后端立即返回 { jobId, message }
      const data = await syncAttendance(params);
      jobIdRef.current = data.jobId;
      setSyncLog([{
        id: 'start',
        timestamp: dayjs().format('HH:mm:ss'),
        content: data.message || `同步已启动（${params.startDate} ~ ${params.endDate}）`,
        type: 'info',
      }]);

      // 开始轮询
      startPolling(data.jobId);
    } catch (error) {
      setSyncing(false);
      message.error(error.message || '同步启动失败，请重试');
      setSyncLog(prev => [...prev, {
        id: 'error',
        timestamp: dayjs().format('HH:mm:ss'),
        content: `同步启动失败：${error.message}`,
        type: 'error',
      }]);
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="data-sync-container">
        <Title level={2}>考勤数据同步</Title>
        <Paragraph>
          同步钉钉考勤数据至本地数据库，支持按天（最多31天）或按月同步
        </Paragraph>

        {/* 花名册导入卡片 */}
        <Card className="roster-card" title={<span><TeamOutlined style={{ marginRight: 8 }} />花名册导入</span>} style={{ marginBottom: 24 }}>
          <div className="roster-settings">
            <div className="setting-item">
              <Text strong>花名册月份：</Text>
              <DatePicker
                picker="month"
                value={rosterMonth}
                onChange={(date) => setRosterMonth(date || dayjs())}
                style={{ width: 180, marginLeft: 16 }}
                placeholder="选择月份"
                format="YYYY年MM月"
              />
            </div>
            <div className="setting-item">
              <Upload
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={handleRosterUpload}
              >
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  loading={rosterUploading}
                  size="large"
                >
                  上传花名册
                </Button>
              </Upload>
              <Text type="secondary" style={{ marginLeft: 16 }}>
                Excel 需含列：员工 ID/工号、姓名、部门（路径）、手机号、身份证（自动模糊识别表头，兼容中英文）
              </Text>
            </div>
          </div>

          {/* 花名册概况 */}
          {rosterStats.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已导入花名册：</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {rosterStats.map(s => (
                  <Tag key={s.year_month} color={s.active > 0 ? 'blue' : 'default'}>
                    {s.year_month} | {s.total} 人（在岗 {s.active}，有手机号 {s.has_mobile}）
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="sync-card" title="同步设置">
          <div className="sync-settings">
            {/* 粒度选择 */}
            <div className="setting-item">
              <Text strong>同步粒度：</Text>
              <Select
                value={granularity}
                onChange={handleGranularityChange}
                style={{ width: 180, marginLeft: 16 }}
                allowClear={false}
                placeholder="请选择同步粒度"
              >
                <Option value={TIME_GRANULARITY.DAY}>按天同步</Option>
                <Option value={TIME_GRANULARITY.MONTH}>按月同步</Option>
              </Select>
            </div>

            {/* 日期选择器 */}
            <div className="setting-item">
              <Text strong>
                {granularity === TIME_GRANULARITY.MONTH ? '同步月份：' : '同步日期范围：'}
              </Text>

              {granularity === TIME_GRANULARITY.MONTH ? (
                <DatePicker
                  picker="month"
                  value={timeRange[0] || null}
                  onChange={(date) => setTimeRange(date ? [date] : [])}
                  disabledDate={disabledDate}
                  style={{ width: 180, marginLeft: 16 }}
                  placeholder="选择月份"
                  format="YYYY年MM月"
                />
              ) : granularity ? (
                <RangePicker
                  value={timeRange}
                  onChange={(dates) => {
                    setTimeRange(dates || []);
                    if (!dates) setPickerDates(null);
                  }}
                  onCalendarChange={(dates) => setPickerDates(dates)}
                  disabledDate={disabledRangeDate}
                  style={{ width: 320, marginLeft: 16 }}
                  placeholder={['开始日期', '结束日期']}
                  format="YYYY年MM月DD日"
                />
              ) : null}
            </div>

            {/* 同步按钮 */}
            <div className="sync-action">
              <Button
                type="primary"
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                disabled={!canSync()}
                size="large"
              >
                {syncing ? '同步中...' : '开始同步'}
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          {syncing && (
            <div className="sync-progress">
              <Progress
                percent={progress}
                status={syncStatus === 'error' ? 'exception' : progress === 100 ? 'success' : 'active'}
                strokeWidth={6}
                style={{ marginTop: 24 }}
              />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                {syncStatus === 'error' ? (
                  <Tag color="red">同步失败</Tag>
                ) : progress === 100 ? (
                  <Tag color="green">同步完成</Tag>
                ) : (
                  <Tag color="blue">{stage || '同步中'}</Tag>
                )}
                <Text type="secondary">
                  {syncing ? `后端正在${stage || '处理'}...` : ''}
                </Text>
              </div>
            </div>
          )}
        </Card>

        {/* 同步日志 */}
        <Card className="sync-log-card" title="同步日志" style={{ marginTop: 24 }}>
          <div className="sync-log-list">
            {syncLog.length === 0 ? (
              <div className="empty-log">
                <ClockCircleOutlined style={{ fontSize: 24, color: '#ccc', marginBottom: 8 }} />
                <Text type="secondary">暂无同步记录，请点击"开始同步"</Text>
              </div>
            ) : (
              syncLog.map(log => (
                <div key={log.id} className={`log-item log-${log.type}`}>
                  <Text type="secondary" className="log-time">[{log.timestamp}]</Text>
                  <span className="log-content">
                    {log.type === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {log.type === 'error' && <CloseCircleOutlined style={{ color: '#f5222d' }} />}
                    {log.type === 'info' && <ClockCircleOutlined style={{ color: '#1890ff' }} />}
                    <span style={{ marginLeft: 8 }}>{log.content}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default DataSync;
