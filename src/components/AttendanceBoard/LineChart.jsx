// 折线图：近30天出勤率/迟到/缺卡趋势
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * @param {Array<{date: string}>} data         含 date 字段
 * @param {Array<{field: string, name: string, color?: string, yAxisIndex?: number}>} metrics  要绘制的指标
 * @param {boolean} [dualAxis]  是否双 Y 轴（如：出勤率% vs 人次）
 * @param {number} [height]
 */
const LineChart = ({
  data = [],
  metrics = [],
  dualAxis = false,
  height = 320
}) => {
  const option = useMemo(() => {
    const xData = data.map(d => d.date);
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        bottom: 0,
        data: metrics.map(m => m.name)
      },
      grid: { left: 10, right: 20, top: 20, bottom: 40, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData,
        axisLabel: { fontSize: 11 }
      },
      yAxis: dualAxis
        ? [
            { type: 'value', name: '出勤率(%)', position: 'left', axisLabel: { formatter: '{value}%' } },
            { type: 'value', name: '人次', position: 'right' }
          ]
        : [{ type: 'value' }],
      series: metrics.map(m => ({
        name: m.name,
        type: 'line',
        smooth: true,
        data: data.map(d => d[m.field]),
        itemStyle: m.color ? { color: m.color } : undefined,
        yAxisIndex: m.yAxisIndex
      }))
    };
  }, [data, metrics, dualAxis]);

  return <ReactECharts option={option} style={{ height }} />;
};

export default LineChart;
