import React from 'react';
import './SalaryReport.css'; // 复用原有样式

const SalaryTotalReport = ({ data }) => {
  const { deptTotal, total, departments, title, period } = data || {};

  // 格式化金额（去掉千位分隔符，以万元为单位，保留原始数值精度）
  const formatAmount = (num) => {
    return String(parseFloat(((num ?? 0) / 10000).toPrecision(10)));
  };

  if (!deptTotal) {
    return <div className="report-empty">暂无月度总额数据</div>;
  }

  return (
    <div className="salary-report">
      <div className="report-header">
        <h2>{title}</h2>
        <p>期间：{period || '未指定期间'}</p>
      </div>
      <div className="report-content">
        <div className="report-table-container">
          <table className="salary-detail-table">
            <thead>
              <tr>
                <th>事业部</th>
                <th>应计工资总额（万元）</th>
              </tr>
            </thead>
            <tbody>
              {/* 仅展示事业部总额，不展开人员类别 */}
              {departments.map(dept => (
                <tr key={dept} className="dept-row"> {/* 复用部门行样式 */}
                  <td className="dept-cell">{dept}</td>
                  <td>{formatAmount(deptTotal[dept])}</td>
                </tr>
              ))}
              {/* 总计行 */}
              <tr className="total-row">
                <td className="total-cell">总计</td>
                <td>{formatAmount(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryTotalReport;