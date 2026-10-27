import React, { useState, useEffect } from 'react';
import { getSalaryPeriods, getAllSalaryData } from '../../api/salary';
import SalaryFilter from '../../components/SalaryAnalysis/SalaryFilter';
import SalaryReport from '../../components/SalaryAnalysis/SalaryReport';
import SalaryTotalReport from '../../components/SalaryAnalysis/SalaryTotalReport';
import './SalaryAnalysis.css';

// 部门映射表（包含公司整体维度）
const departmentMap = {
  "公司整体": [],
  "锻造事业部": [
    "一汽锻造（吉林）有限公司",
    "一汽锻造（吉林）有限公司-智慧汽车划拨",
    "一汽锻造（青岛）有限公司",
    "一汽铸造有限公司一汽锻造（吉林）有限公司",
  ],
  "黑色事业部": [
    "一汽铸造有限公司铸造一厂",
    "一汽铸造有限公司铸造二厂",
    "一汽铸造有限公司无锡分公司"
  ],
  "吉佳工厂": ["吉佳工厂"],
  "铸模事业部": ["一汽铸造有限公司铸造模具设备厂"],
  "有色事业部": [
    "一汽铸造有限公司有色铸造分公司",
    "一汽铸造有限公司有色厂",
    "一汽铸造有限公司成都有色铸造分公司",
    "一汽铸造有限公司压铸厂",
    "压铸厂",
    "赛力斯项目组"
  ],
  "职能部": ["一汽铸造有限公司","一汽铸造机关"]
};

const companyToDepartment = {};
Object.entries(departmentMap).forEach(([dept, companies]) => {
  if (dept !== "公司整体") {
    companies.forEach(company => {
      companyToDepartment[company] = dept;
    });
  }
});

// 人员类别映射表
const jobCategoryMap = {
  "03-首席": ["03-首席"],
  "04-总监助理": ["04-总监助理"],
  "05-高级主任师": ["05-高级主任师"],
  "06-主任": ["06-主任"],
  "07-主任师": ["07-主任师"],
  "08-主管": ["08-主管"],
  "09-员": ["09-员"],
  "10-操作": [
    "11-高级技能师",
    "12-技能师",
    "13-工段长",
    "14-班组长",
    "15-直产、辅产",
    "16-辅助服务"
  ]
};

const categoryToJob = {};
Object.entries(jobCategoryMap).forEach(([job, categories]) => {
  categories.forEach(category => {
    categoryToJob[category] = job;
  });
});

const departments = Object.keys(departmentMap);
const jobCategories = Object.keys(jobCategoryMap);
const businessDepartments = departments.filter(dept => dept !== "公司整体");

// 解析期间字符串为 { year: 年, month: 月 } 对象
const parsePeriod = (period) => {
  if (!period || !period.includes('-')) return { year: 0, month: 0, yearStr: '' };
  const [year, month] = period.split('-').map(Number);
  return { year, month, yearStr: String(year) };
};

// 筛选同一年且 <= 当前期间的所有数据
const filterSameYearCumulativeData = (allData, targetPeriod) => {
  const target = parsePeriod(targetPeriod);
  if (target.year === 0) return [];
  return allData.filter(item => {
    const itemPeriod = item.期间 || item.月份 || '';
    const dataItem = parsePeriod(itemPeriod);
    // 仅保留：同一年 + 月份 <= 目标月份
    return dataItem.year === target.year && dataItem.month <= target.month;
  });
};

// 计算同一年的累计月份数
const getSameYearMonthCount = (allData, targetPeriod) => {
  const target = parsePeriod(targetPeriod);
  if (target.year === 0) return 0;
  const validPeriods = [...new Set(
    allData.map(item => item.期间 || item.月份 || '')
  )].filter(period => {
    const p = parsePeriod(period);
    return p.year === target.year && p.month <= target.month;
  });
  return validPeriods.length;
};

const SalaryAnalysis = () => {
  const [filters, setFilters] = useState({ period: '' });
  const [analysisData, setAnalysisData] = useState({
    current: null,
    cumulative: null,
    average: null,
    currentTotal: null
  });
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allPeriods, setAllPeriods] = useState([]);
  const [periodError, setPeriodError] = useState('');

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  // 初始化空数据结构
  const createEmptyData = () => {
    const emptyGroupedData = {};
    departments.forEach(dept => {
      emptyGroupedData[dept] = {
        totalAmount: 0,
        count: 0,
        categories: jobCategories.reduce((acc, cat) => {
          acc[cat] = { totalAmount: 0, count: 0 };
          return acc;
        }, {})
      };
    });

    return {
      groupedData: emptyGroupedData,
      totalSummary: { totalAmount: 0, totalCount: 0 },
      departments: [...departments],
      jobCategories: [...jobCategories],
      currentPeriod: filters.period,
      title: ''
    };
  };

  useEffect(() => {
    const fetchPeriods = async () => {
      setPeriodError('');
      try {
        // request 拦截器已解包，data 直接是期间数组
        const data = await getSalaryPeriods();
        setAllPeriods(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('获取期间失败:', error);
        setPeriodError(error.message || '获取期间失败，请重试');
        setAllPeriods([]);
      }
    };
    fetchPeriods();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (allPeriods.length === 0) return;
      try {
        const data = await getAllSalaryData();
        // 过滤无效格式的期间数据
        const validData = Array.isArray(data) ? data.filter(item => {
          const period = item.期间 || item.月份 || '';
          return /^\d{4}-\d{2}$/.test(period); // 仅保留YYYY-MM格式
        }) : [];
        setAllData(validData);
      } catch (error) {
        console.error('获取所有数据失败:', error);
        setAllData([]);
      }
    };
    fetchAllData();
  }, [allPeriods]);

  // 处理单月数据
  const processSalaryData = (rawData) => {
    const safeData = Array.isArray(rawData) ? rawData : [];
    const data = createEmptyData();

    safeData.forEach(item => {
      const company = item.公司 || item.company || '';
      const category = item.人员类别 || item.jobCategory || '';
      const salaryStr = (item.应计工资总和 || item.totalSalary || '0')
        .toString().trim().replace(/,/g, '');
      const salary = parseFloat(salaryStr) || 0;
      const personCount = parseInt(item.人数 || item.headcount || '0', 10) || 0;

      const job = categoryToJob[category];
      if (!job) return;

      // 公司整体数据
      data.groupedData["公司整体"].categories[job].totalAmount += salary;
      data.groupedData["公司整体"].categories[job].count += personCount;
      data.groupedData["公司整体"].totalAmount += salary;
      data.groupedData["公司整体"].count += personCount;

      // 事业部数据
      const dept = companyToDepartment[company];
      if (dept && data.departments.includes(dept)) {
        data.groupedData[dept].categories[job].totalAmount += salary;
        data.groupedData[dept].categories[job].count += personCount;
        data.groupedData[dept].totalAmount += salary;
        data.groupedData[dept].count += personCount;
      }
    });

    // 总计仅统计事业部
    data.totalSummary = businessDepartments.reduce((sum, dept) => {
      sum.totalAmount += data.groupedData[dept].totalAmount;
      sum.totalCount += data.groupedData[dept].count;
      return sum;
    }, { totalAmount: 0, totalCount: 0 });

    return data;
  };

  // 处理月度总额数据
  const processTotalAmountData = (rawData) => {
    const safeData = Array.isArray(rawData) ? rawData : [];
    const deptTotal = businessDepartments.reduce((acc, dept) => {
      acc[dept] = 0;
      return acc;
    }, {});

    safeData.forEach(item => {
      const company = item.公司 || item.company || '';
      const salaryStr = (item.应计工资总和 || item.totalSalary || '0')
        .toString().trim().replace(/,/g, '');
      const salary = parseFloat(salaryStr) || 0;
      const dept = companyToDepartment[company];

      if (dept && businessDepartments.includes(dept)) {
        deptTotal[dept] += salary;
      }
    });

    const total = businessDepartments.reduce((sum, dept) => sum + deptTotal[dept], 0);
    const periodInfo = parsePeriod(filters.period);

    return {
      deptTotal,
      total,
      departments: businessDepartments,
      period: filters.period,
      title: `${periodInfo.yearStr}年${periodInfo.month}月 月度总额`
    };
  };

  // 月度累计数据处理
  const processCumulativeData = (rawData) => {
    const data = processSalaryData(rawData);
    const periodInfo = parsePeriod(filters.period);
    data.title = `${periodInfo.yearStr}年1-${periodInfo.month}月 累计数据`;
    return data;
  };

  // 修复月度平均数据计算：平均应计工资 = 累计工资总和 / 平均人数
  const calculateAverageData = (cumulativeData, monthCount) => {
    const data = createEmptyData();
    const safeMonthCount = monthCount > 0 ? monthCount : 1;
    const periodInfo = parsePeriod(filters.period);

    if (monthCount === 0) {
      console.warn('累计月份数为0，默认按1计算');
    }

    departments.forEach(dept => {
      const cumulativeDeptData = cumulativeData.groupedData[dept] || { 
        totalAmount: 0, 
        count: 0, 
        categories: {} 
      };
      
      // 1. 计算平均人数（累计人数 / 月份数）
      const avgCount = cumulativeDeptData.count / safeMonthCount;
      
      // 2. 计算平均应计工资（累计工资总和 / 平均人数）
      const avgAmount = avgCount > 0 ? cumulativeDeptData.totalAmount / avgCount : 0;

      data.groupedData[dept] = {
        totalAmount: avgAmount,  // 平均工资 = 累计总额 / 平均人数
        count: avgCount,         // 平均人数 = 累计人数 / 月份数
        categories: {}
      };

      // 人员类别层级计算
      jobCategories.forEach(category => {
        const cumulativeCatData = cumulativeDeptData.categories[category] || { 
          totalAmount: 0, 
          count: 0 
        };
        
        // 人员类别平均人数
        const catAvgCount = cumulativeCatData.count / safeMonthCount;
        // 人员类别平均工资 = 累计工资 / 平均人数
        const catAvgAmount = catAvgCount > 0 ? cumulativeCatData.totalAmount / catAvgCount : 0;

        data.groupedData[dept].categories[category] = {
          totalAmount: catAvgAmount,
          count: catAvgCount
        };
      });
    });

    // 总计仅统计事业部
    data.totalSummary = businessDepartments.reduce((sum, dept) => {
      sum.totalAmount += data.groupedData[dept].totalAmount;
      sum.totalCount += data.groupedData[dept].count;
      return sum;
    }, { totalAmount: 0, totalCount: 0 });

    data.title = `${periodInfo.yearStr}年1-${periodInfo.month}月 平均数据`;
    return data;
  };

  // 执行分析
  const handleAnalyze = async () => {
    if (!filters.period) {
      alert('请选择分析期间');
      return;
    }

    setLoading(true);
    try {
      // 过滤当前月份数据
      const currentMonthData = allData.filter(item => {
        const itemPeriod = item.期间 || item.月份 || '';
        return itemPeriod === filters.period;
      });
      
      // 修复：仅累计「同一年」且 <= 当前期间的数据
      const cumulativeData = filterSameYearCumulativeData(allData, filters.period);
      
      // 修复：仅计算「同一年」的累计月份数
      const monthCount = getSameYearMonthCount(allData, filters.period);

      // 处理各维度数据
      const currentData = processSalaryData(currentMonthData);
      const periodInfo = parsePeriod(filters.period);
      currentData.title = `${periodInfo.yearStr}年${periodInfo.month}月 当期数据`;

      const cumulativeResult = processCumulativeData(cumulativeData);
      
      const averageResult = calculateAverageData(
        cumulativeResult, 
        monthCount
      );

      const currentTotalData = processTotalAmountData(currentMonthData);

      setAnalysisData({
        current: currentData,
        cumulative: cumulativeResult,
        average: averageResult,
        currentTotal: currentTotalData
      });
    } catch (error) {
      console.error('分析数据失败:', error);
      alert('分析失败，请重试');
      setAnalysisData({
        current: createEmptyData(),
        cumulative: createEmptyData(),
        average: createEmptyData(),
        currentTotal: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="salary-analysis">
      <div className="page-header">
        <h2>薪酬分析</h2>
        <p>分析各部门薪酬发放情况，支持按期间查看详细数据</p>
      </div>

      <div className="analysis-container">
        {/* 左侧筛选区域 */}
        <div className="analysis-filters">
          <SalaryFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onAnalyze={handleAnalyze}
            loading={loading}
            allPeriods={allPeriods || []}
            periodError={periodError}
          />
        </div>

        {/* 右侧结果区域 */}
        <div className="analysis-results">
          {loading ? (
            <div className="loading-indicator">
              <i className="fas fa-spinner"></i>
              <span>正在分析数据...</span>
            </div>
          ) : (
            <>
              {/* 当前月度数据 */}
              {analysisData.current && (
                <div className="analysis-section">
                  <SalaryReport 
                    data={analysisData.current} 
                    departments={analysisData.current.departments || []}
                    jobCategories={analysisData.current.jobCategories || []}
                  />
                </div>
              )}

              {/* 当前月度总额 */}
              {analysisData.currentTotal && (
                <div className="analysis-section">
                  <SalaryTotalReport 
                    data={analysisData.currentTotal} 
                    departments={analysisData.currentTotal.departments || []}
                  />
                </div>
              )}

              {/* 月度累计数据 */}
              {analysisData.cumulative && (
                <div className="analysis-section">
                  <SalaryReport 
                    data={analysisData.cumulative} 
                    departments={analysisData.cumulative.departments || []}
                    jobCategories={analysisData.cumulative.jobCategories || []}
                  />
                </div>
              )}

              {/* 月度平均数据 */}
              {analysisData.average && (
                <div className="analysis-section">
                  <SalaryReport 
                    data={analysisData.average} 
                    departments={analysisData.average.departments || []}
                    jobCategories={analysisData.average.jobCategories || []}
                  />
                </div>
              )}

              {/* 空状态 */}
              {!analysisData.current && !loading && (
                <div className="empty-state">
                  <p>请选择分析期间并点击"开始分析"按钮</p>
                  <p>系统将展示各部门薪酬分析结果</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryAnalysis;