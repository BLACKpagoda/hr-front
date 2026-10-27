// 柱状图：部门出勤率排名、部门请假/加班时长对比
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * @param {Array<{name: string, value: number}>} data
 * @param {string} [yAxisName]
 * @param {string} [color]     柱子颜色
 * @param {boolean} [horizontal] 是否横向柱状图
 * @param {number} [height]
 * @param {Array} [series]     多系列数据 [{name, data, color}]
 */
const BarChart = ({
  data = [],
  series,
  color = '#1890ff',
  horizontal = false,
  height = 300,
  yAxisName
}) => {
  const option = useMemo(() => {
    const categories = data.map(d => d.name);
    const singleSeries = !series || series.length === 0;

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: singleSeries ? undefined : { bottom: 0 },
      grid: { left: 10, right: 20, top: 20, bottom: singleSeries ? 20 : 40, containLabel: true },
      xAxis: horizontal
        ? { type: 'value', name: yAxisName }
        : { type: 'category', data: categories, axisLabel: { interval: 0, rotate: categories.length > 6 ? 30 : 0 } },
      yAxis: horizontal
        ? { type: 'category', data: categories, inverse: true, axisLabel: { interval: 0 } }
        : { type: 'value', name: yAxisName },
      series: singleSeries
        ? [{
            type: 'bar',
            data: data.map(d => d.value),
            itemStyle: { color },
            barMaxWidth: 40,
            label: { show: true, position: horizontal ? 'right' : 'top', fontSize: 11 }
          }]
        : series.map(s => ({
            name: s.name,
            type: 'bar',
            data: s.data,
            itemStyle: s.color ? { color: s.color } : undefined,
            barMaxWidth: 30,
            label: { show: true, position: horizontal ? 'right' : 'top', fontSize: 11 }
          }))
    };
  }, [data, series, color, horizontal, yAxisName]);

  return <ReactECharts option={option} style={{ height }} />;
};

export default BarChart;
