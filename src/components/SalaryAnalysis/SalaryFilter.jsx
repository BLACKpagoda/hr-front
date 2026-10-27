import React from 'react';
import './SalaryFilter.css'; // 保留原样式引用

const SalaryFilter = ({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  loading,
  allPeriods,
  periodError
}) => {
  return (
    <div className="salary-filter-panel"> 
      <h3>分析条件</h3>
      
      <div className="filter-group">
        <label htmlFor="analysis-period">分析期间</label>
        <select
          id="analysis-period"
          value={filters.period}
          onChange={(e) => onFilterChange({ period: e.target.value })}
          disabled={!Array.isArray(allPeriods) || allPeriods.length === 0}
        >
          <option value="">请选择期间</option>
          {Array.isArray(allPeriods) && allPeriods.map(period => (
            <option key={period} value={period}>{period}</option>
          ))}
        </select>
        {periodError && <div className="filter-error">{periodError}</div> }
      </div>
      
      <button 
        className="btn-primary analyze-button" 
        onClick={onAnalyze}
        disabled={loading || !filters.period}
      >
        {loading ? '分析中...' : '开始分析'}
      </button>
    </div>
  );
};

export default SalaryFilter;