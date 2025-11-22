import React from 'react';
import ReactECharts from 'echarts-for-react';

const RiverChartView = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>当前朝代没有可显示的灾害数据。</div>;
  }

  // 数据处理：将原始数据转换为河流图需要的格式 [时间, 数值, 类别]
  const chartData = data.flatMap(item => {
    const disasterTypesRaw = item['四级（对“灾害总体描述原文”的拆分）'];
    const yearsRaw = item['Unnamed: 4'];

    // 确保原始数据存在
    if (!disasterTypesRaw || !yearsRaw || typeof yearsRaw !== 'string') {
      return [];
    }

    const disasterTypes = disasterTypesRaw.split(/、|，/).filter(t => t && t.trim() !== '');
    
    // 匹配所有 "xxxx年" 或 "前xxx年" 的年份
    const yearMatches = yearsRaw.match(/(前)?\d{1,4}年/g);

    if (!yearMatches) {
      return [];
    }

    const events = [];
    yearMatches.forEach(yearStr => {
      let year;
      if (yearStr.startsWith('前')) {
        // 公元前年份
        year = -parseInt(yearStr.replace('前', '').replace('年', ''));
      } else {
        // 公元年份
        year = parseInt(yearStr.replace('年', ''));
      }

      if (!isNaN(year)) {
        // ECharts 的时间轴不支持公元0年或负数年份的 'YYYY-MM-DD' 格式
        // 我们直接使用年份作为数值，并将坐标轴类型改为 'value'
        disasterTypes.forEach(type => {
          events.push([year, 1, type.trim()]);
        });
      }
    });
    return events;
  }).filter(Boolean);

  // 新增：数据聚合逻辑，解决同一年份同一灾害类型重复导致的问题
  const aggregatedData = {};
  chartData.forEach(([year, value, type]) => {
    const key = `${year}-${type}`;
    if (aggregatedData[key]) {
      aggregatedData[key][1] += value; // 累加次数
    } else {
      aggregatedData[key] = [year, value, type];
    }
  });

  const finalChartData = Object.values(aggregatedData);

  // 关键修复：河流图数据必须按时间排序
  finalChartData.sort((a, b) => a[0] - b[0]);

  if (finalChartData.length === 0) {
    return <div>无法从当前数据中提取有效的灾害和年份信息。</div>;
  }

  const disasterTypes = [...new Set(finalChartData.map(item => item[2]))];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(0,0,0,0.2)',
          width: 1,
          type: 'solid'
        }
      }
    },
    legend: {
      data: disasterTypes,
      textStyle: {
          color: '#333'
      }
    },
    singleAxis: {
      top: 50,
      bottom: 50,
      axisTick: {},
      axisLabel: {},
      type: 'value', // <--- 将坐标轴类型从 'time' 改为 'value'
      axisPointer: {
        animation: true,
        label: {
          show: true
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.2
        }
      }
    },
    series: [
      {
        type: 'themeRiver',
        emphasis: {
          focus: 'series'
        },
        data: finalChartData
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default RiverChartView;
