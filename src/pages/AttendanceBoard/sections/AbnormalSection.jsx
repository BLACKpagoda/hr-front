// 板块3：异常考勤专题看板（HR 最常用）
// 展示：高频迟到 TOP + 高频缺卡 TOP + 旷工清单 + 补卡申请 + 异常明细表（含抵消标记）
import React, { useEffect, useState } from 'react';
import { Row, Col, Alert, Table, Tag, message } from 'antd';
import {
  getAbnormalLateRank,
  getAbnormalMisscardRank,
  getAbnormalAbsentList,
  getAbnormalResubmitList,
  getAbnormalDetail
} from '../../../api/attendance';
import { BoardCard, RankList } from '../../../components/AttendanceBoard';
import '../AttendanceBoard.css';

const AbnormalSection = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lateRank, setLateRank] = useState([]);
  const [misscardRank, setMisscardRank] = useState([]);
  const [absentList, setAbsentList] = useState([]);
  const [resubmitList, setResubmitList] = useState([]);
  const [detail, setDetail] = useState({ list: [], total: 0 });
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;

    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [late, miss, absent, resubmit] = await Promise.all([
          getAbnormalLateRank({ ...filters, limit: 10 }),
          getAbnormalMisscardRank({ ...filters, limit: 10 }),
          getAbnormalAbsentList(filters),
          getAbnormalResubmitList(filters)
        ]);
        setLateRank(Array.isArray(late) ? late : []);
        setMisscardRank(Array.isArray(miss) ? miss : []);
        setAbsentList(Array.isArray(absent) ? absent : []);
        setResubmitList(Array.isArray(resubmit) ? resubmit : []);
      } catch (err) {
        setError(err.message || '加载异常考勤数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [filters]);

  // 异常明细分页查询
  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;
    const fetchDetail = async () => {
      try {
        const res = await getAbnormalDetail({
          ...filters,
          page: detailPage,
          size: 15
        });
        setDetail(res || { list: [], total: 0 });
      } catch (err) {
        message.error(err.message || '加载异常明细失败');
        setDetail({ list: [], total: 0 });
      }
    };
    fetchDetail();
  }, [filters, detailPage]);

  const lateColumns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '迟到次数', dataIndex: 'lateCount', key: 'lateCount', width: 90, align: 'center' },
    { title: '迟到时长(分)', dataIndex: 'lateDuration', key: 'lateDuration', width: 110, align: 'center' }
  ];

  const misscardColumns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '缺卡次数', dataIndex: 'misscardCount', key: 'misscardCount', width: 100, align: 'center' }
  ];

  const absentColumns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true }
  ];

  const resubmitColumns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '补卡日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '申请时间', dataIndex: 'resubmitTime', key: 'resubmitTime', width: 160 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center',
      render: v => <Tag color={v === 'approved' ? 'green' : v === 'pending' ? 'orange' : 'red'}>
        {v === 'approved' ? '已通过' : v === 'pending' ? '待审批' : '已驳回'}
      </Tag>
    }
  ];

  const detailColumns = [
    { title: '姓名', dataIndex: 'userName', key: 'userName', width: 90 },
    { title: '部门', dataIndex: 'departmentName', key: 'departmentName', ellipsis: true },
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    {
      title: '异常类型', dataIndex: 'abnormalType', key: 'abnormalType', width: 100, align: 'center',
      render: v => {
        const color = { 迟到: 'orange', 早退: 'volcano', 缺卡: 'red', 旷工: 'magenta' }[v] || 'default';
        return <Tag color={color}>{v}</Tag>;
      }
    },
    { title: '时长(分)', dataIndex: 'duration', key: 'duration', width: 90, align: 'center' },
    {
      title: '审批抵消', dataIndex: 'hasApprovalCancel', key: 'hasApprovalCancel', width: 90, align: 'center',
      render: v => v ? <Tag color="green">已抵消</Tag> : <span style={{ color: '#bfbfbf' }}>—</span>
    },
    {
      title: '有效异常', dataIndex: 'validException', key: 'validException', width: 90, align: 'center',
      render: v => v ? <Tag color="red">有效</Tag> : <span style={{ color: '#bfbfbf' }}>—</span>
    }
  ];

  return (
    <div className="board-section">
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <BoardCard title="高频迟到人员 TOP 10" loading={loading} empty={!lateRank.length}>
            <RankList data={lateRank} columns={lateColumns} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="高频缺卡人员 TOP 10" loading={loading} empty={!misscardRank.length}>
            <RankList data={misscardRank} columns={misscardColumns} />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="旷工人员清单" loading={loading} empty={!absentList.length}>
            <Table
              size="small"
              rowKey={(r, i) => `${r.userId}-${r.date}-${i}`}
              dataSource={absentList}
              columns={absentColumns}
              pagination={absentList.length > 10 ? { pageSize: 10, size: 'small' } : false}
            />
          </BoardCard>
        </Col>
        <Col xs={24} lg={12}>
          <BoardCard title="补卡申请列表" loading={loading} empty={!resubmitList.length}>
            <Table
              size="small"
              rowKey={(r, i) => `${r.userId}-${r.date}-${i}`}
              dataSource={resubmitList}
              columns={resubmitColumns}
              pagination={resubmitList.length > 10 ? { pageSize: 10, size: 'small' } : false}
            />
          </BoardCard>
        </Col>
        <Col xs={24}>
          <BoardCard title="异常考勤明细（审批抵消 + 有效异常标记）" loading={loading} empty={!detail.list.length}>
            <Table
              size="small"
              rowKey={(r, i) => `${r.userId}-${r.date}-${i}`}
              dataSource={detail.list}
              columns={detailColumns}
              pagination={{
                current: detailPage,
                pageSize: 15,
                total: detail.total,
                size: 'small',
                showTotal: t => `共 ${t} 条`,
                onChange: p => setDetailPage(p)
              }}
            />
            <div className="abnormal-tip">
              说明：「审批抵消」表示当天存在合法请假/外出审批（对应 attendance_daily_result.has_approval_cancel）；
              「有效异常」为抵消后的实际异常（valid_exception），应计入处罚统计。抵消逻辑由后端同步层完成。
            </div>
          </BoardCard>
        </Col>
      </Row>
    </div>
  );
};

export default AbnormalSection;
