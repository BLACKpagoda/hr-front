// KPI 指标卡：用于板块1 考勤总览
import React from 'react';
import { Card, Statistic } from 'antd';
import './KpiCard.css';

/**
 * @param {object} props
 * @param {string} props.title        指标名称
 * @param {number|string} props.value 数值
 * @param {string} [props.suffix]     后缀（如 %、人、小时）
 * @param {string} [props.icon]       图标类名（fontawesome）
 * @param {string} [props.color]      主题色
 * @param {string} [props.prefix]     前缀
 */
const KpiCard = ({ title, value, suffix, icon, color = '#1890ff', prefix }) => {
  return (
    <Card className="kpi-card" styles={{ body: { padding: 16 } }}>
      <div className="kpi-card-inner">
        <div className="kpi-icon" style={{ backgroundColor: color }}>
          <i className={icon} />
        </div>
        <div className="kpi-content">
          <Statistic
            title={title}
            value={value}
            prefix={prefix}
            valueStyle={{ color, fontSize: 24, fontWeight: 600 }}
            formatter={(val) => {
              const v = typeof val === 'number' ? val.toString() : String(val || '');
              return suffix ? `${v}${suffix}` : v;
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default KpiCard;
