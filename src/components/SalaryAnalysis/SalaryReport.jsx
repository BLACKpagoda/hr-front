import React, { useState } from 'react';
import './SalaryReport.css';

const SalaryReport = ({ data, departments, jobCategories }) => {
  const { 
    groupedData, 
    totalSummary, 
    currentPeriod, 
    title, 
    periodRange 
  } = data || {};
  const [expandedDepts, setExpandedDepts] = useState([]);

  // 判断是否为"当前月度数据"（需要显示三列）
  const isCurrentMonth = title === '当前月度数据';

  const toggleDept = (dept) => {
    setExpandedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  // 格式化函数（去掉千位分隔符，金额以万元为单位，保留原始数值精度）
  const formatPersonCount = (num) => (num ?? 0).toFixed(0);
  const formatAmount = (num) => String(parseFloat(((num ?? 0) / 10000).toPrecision(10)));

  // 渲染事业部行（根据类型显示不同列）
  const renderDeptRow = (dept) => {
    const deptData = groupedData[dept];
    const isExpanded = expandedDepts.includes(dept);
    // 当前月度数据需要计算人均工资
    const perPersonAmount = isCurrentMonth 
      ? (deptData.count > 0 ? deptData.totalAmount / deptData.count : 0) 
      : 0;
    
    return (
      <React.Fragment key={dept}>
        <tr className="dept-row" onClick={() => toggleDept(dept)}>
          <td className="dept-cell">
            <span className="expand-icon">{isExpanded ? '▼' : '►'}</span>
            {dept}
          </td>
          <td>{formatPersonCount(deptData.count)}</td> {/* 人数 */}
          <td>{formatAmount(deptData.totalAmount)}</td> {/* 工资总和 */}
          {/* 当前月度数据额外显示人均工资列 */}
          {isCurrentMonth && (
            <td>{formatAmount(perPersonAmount)}</td>
          )}
        </tr>
        
        {/* 展开显示人员类别 */}
        {isExpanded && jobCategories.map(category => {
          const catData = deptData.categories[category];
          const catPerPerson = isCurrentMonth 
            ? (catData.count > 0 ? catData.totalAmount / catData.count : 0) 
            : 0;
          
          return (
            <tr key={`${dept}-${category}`} className="category-row">
              <td className="category-cell">{category}</td>
              <td>{formatPersonCount(catData.count)}</td>
              <td>{formatAmount(catData.totalAmount)}</td>
              {/* 当前月度显示人均 */}
              {isCurrentMonth && (
                <td>{formatAmount(catPerPerson)}</td>
              )}
            </tr>
          );
        })}
      </React.Fragment>
    );
  };

  // 渲染总计行
  const renderTotalRow = () => {
    if (!totalSummary) return null;
    const totalPerPerson = isCurrentMonth 
      ? (totalSummary.totalCount > 0 ? totalSummary.totalAmount / totalSummary.totalCount : 0) 
      : 0;
    
    return (
      <tr className="total-row">
        <td className="total-cell">总计</td>
        <td>{formatPersonCount(totalSummary.totalCount)}</td>
        <td>{formatAmount(totalSummary.totalAmount)}</td>
        {/* 当前月度显示总人均 */}
        {isCurrentMonth && (
          <td>{formatAmount(totalPerPerson)}</td>
        )}
      </tr>
    );
  };

  if (!groupedData) {
    return <div className="report-empty">暂无分析数据，请先执行分析</div>;
  }

  return (
    <div className="salary-report">
      <div className="report-header">
        <h2>{title}</h2>
        <p>{periodRange || `分析期间：${currentPeriod || '未指定期间'}`}</p>
      </div>
      <div className="report-content">
        <div className="report-table-container">
          <table className="salary-detail-table">
            <thead>
              <tr>
                <th>部门/人员类别</th>
                <th>
                  {isCurrentMonth ? '人数（人）' : 
                   title.includes('累计') ? '累计人数（人）' : '平均人数（人）'
                  }
                </th>
                <th>
                  {isCurrentMonth ? '应计工资总额（万元）' : 
                   title.includes('累计') ? '累计应计工资总和（万元）' : '平均应计工资（万元）'
                  }
                </th>
                {/* 当前月度额外显示人均列 */}
                {isCurrentMonth && <th>人均工资（万元）</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => renderDeptRow(dept))}
              {renderTotalRow()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryReport;