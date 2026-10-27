// 环形图：考勤状态分布、请假类型占比
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * @param {Array<{name: string, value: number, color?: string}>} data
 * @param {string} [title]       中心标题
 * @param {number} [total]       中心总数
 * @param {number} [height]
 */
const DonutChart = ({ data = [], title, total, height = 280 }) => {
  const option = useMemo(() => {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        bottom: 0,
        type: 'scroll',
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 12 }
      },
      title: title
        ? {
            text: total != null ? String(total) : '',
            subtext: title,
            left: 'center',
            top: '38%',
            textStyle: { fontSize: 22, fontWeight: 600 },
            subtextStyle: { fontSize: 12, color: '#8c8c8c' }
          }
        : undefined,
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' }
          },
          data: data.map(d => ({
            name: d.name,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined
          }))
        }
      ]
    };
  }, [data, title, total]);

  return <ReactECharts option={option} style={{ height }} />;
};

export default DonutChart;
