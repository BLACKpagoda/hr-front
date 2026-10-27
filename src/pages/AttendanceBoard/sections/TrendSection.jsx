// 板块5：趋势分析看板
// 展示：出勤率趋势折线 + 迟到/缺卡人次趋势（双 Y 轴）
import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Alert, Radio } from 'antd';
import { getBoardTrend } from '../../../api/attendance';
import { BoardCard, LineChart } from '../../../components/AttendanceBoard';
import '../AttendanceBoard.css';

const TrendSection = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState('all'); // all | attendance | abnormal

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getBoardTrend(filters);
        setData(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err.message || '加载趋势数据失败');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  // 出勤率趋势
  const attendanceMetrics = useMemo(() => ([
    { field: 'attendanceRate', name: '出勤率', color: '#2f54eb' }
  ]), []);

  // 迟到/缺卡/旷工人次（双 Y 轴：人次用右轴）
  const abnormalMetrics = useMemo(() => ([
    { field: 'lateCount', name: '迟到人次', color: '#faad14', yAxisIndex: 1 },
    { field: 'misscardCount', name: '缺卡人次', color: '#f5222d', yAxisIndex: 1 },
    { field: 'absentCount', name: '旷工人次', color: '#a8071a', yAxisIndex: 1 }
  ]), []);

  const allMetrics = useMemo(() => ([
    { field: 'attendanceRate', name: '出勤率', color: '#2f54eb' },
    { field: 'lateCount', name: '迟到人次', color: '#faad14', yAxisIndex: 1 },
    { field: 'misscardCount', name: '缺卡人次', color: '#f5222d', yAxisIndex: 1 }
  ]), []);

  const currentMetrics = metric === 'attendance' ? attendanceMetrics
    : metric === 'abnormal' ? abnormalMetrics
    : allMetrics;

  // 周波动分析（按工作日聚合）
  const weekdayStats = useMemo(() => {
    const buckets = { '周一': [], '周二': [], '周三': [], '周四': [], '周五': [], '周六': [], '周日': [] };
    const weekKey = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    data.forEach(d => {
      if (!d.date) return;
      const date = new Date(d.date);
      if (isNaN(date.getTime())) return;
      const key = weekKey[date.getDay()];
      if (buckets[key]) buckets[key].push(d);
    });
    return Object.entries(buckets).map(([name, arr]) => ({
      name,
      avgRate: arr.length ? (arr.reduce((s, x) => s + (x.attendanceRate || 0), 0) / arr.length) : 0,
      avgLate: arr.length ? (arr.reduce((s, x) => s + (x.lateCount || 0), 0) / arr.length) : 0
    }));
  }, [data]);

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      <div className="trend-toolbar">
        <Radio.Group value={metric} onChange={e => setMetric(e.target.value)} size="small">
          <Radio.Button value="all">综合趋势</Radio.Button>
          <Radio.Button value="attendance">出勤率</Radio.Button>
          <Radio.Button value="abnormal">异常人次</Radio.Button>
        </Radio.Group>
      </div>

      <Row gutter={[12, 12]}>
        <Col xs={24}>
          <BoardCard
            title="考勤趋势分析"
            loading={loading}
            empty={!data.length}
          >
            <LineChart
              data={data}
              metrics={currentMetrics}
              dualAxis={metric === 'all' || metric === 'abnormal'}
              height={320}
            />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="每周工作日考勤波动" loading={loading} empty={!weekdayStats.length}>
            <LineChart
              data={weekdayStats}
              metrics={[
                { field: 'avgRate', name: '平均出勤率(%)', color: '#2f54eb' },
                { field: 'avgLate', name: '平均迟到人次', color: '#faad14' }
              ]}
              dualAxis
              height={280}
            />
            <div className="trend-tip">说明：识别哪个工作日考勤问题最突出，便于针对性管理。</div>
          </BoardCard>
        </Col>
      </Row>
    </div>
  );
};

export default TrendSection;
