// 排名列表：高频迟到/缺卡 TOP 人员
import React from 'react';
import { Table, Tag } from 'antd';
import './RankList.css';

/**
 * 通用排名列表
 * @param {Array} data         数据
 * @param {Array} columns     自定义列配置（不传则用默认）
 * @param {string} [rankField] 用于排名的字段（默认取第3列值显示）
 * @param {number} [pageSize]
 */
const RankList = ({ data = [], columns, pageSize = 10 }) => {
  const indexCol = {
    title: '排名',
    key: '_rank',
    width: 60,
    align: 'center',
    render: (_, __, idx) => (
      <span className={`rank-badge rank-${idx + 1 <= 3 ? idx + 1 : 'normal'}`}>
        {idx + 1}
      </span>
    )
  };

  const finalColumns = columns ? [indexCol, ...columns] : [indexCol];

  return (
    <Table
      className="rank-list"
      size="small"
      rowKey={(r, i) => r.userId || r.departmentName || i}
      dataSource={data}
      columns={finalColumns}
      pagination={data.length > pageSize ? { pageSize, size: 'small' } : false}
    />
  );
};

export const StatusTag = ({ type, text }) => {
  const colorMap = {
    late: 'orange',
    early: 'volcano',
    misscard: 'red',
    absent: 'magenta',
    leave: 'blue',
    overtime: 'gold',
    outing: 'cyan',
    approved: 'green',
    pending: 'orange',
    rejected: 'red'
  };
  return <Tag color={colorMap[type] || 'default'}>{text}</Tag>;
};

export default RankList;
