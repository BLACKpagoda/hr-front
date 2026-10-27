// 看板通用卡片容器：统一标题、loading、空状态
import React from 'react';
import { Card, Spin, Empty } from 'antd';
import './BoardCard.css';

const BoardCard = ({ title, extra, loading, empty, children, style, bodyStyle }) => {
  return (
    <Card
      className="board-card"
      title={title}
      extra={extra}
      style={style}
      styles={{ body: { padding: 16, ...bodyStyle } }}
    >
      {loading ? (
        <div className="board-card-loading">
          <Spin />
        </div>
      ) : empty ? (
        <Empty description="暂无数据" />
      ) : (
        children
      )}
    </Card>
  );
};

export default BoardCard;
