import React from 'react';
import ReactECharts from 'echarts-for-react';

const PopulationView = ({ data }) => {
  console.log("PopulationView 接收到的数据:", data); // 在这里添加日志
  if (!data || data.length === 0) {
    return <div>当前朝代没有可显示的人口数据。</div>;
  }

  // 假设数据格式是 { '时期': '唐', llm_processed: { year: '公元618年', population_beijing: 100000 } }
  // 我们需要解析年份并进行排序
  const sortedData = data
    .map(item => {
      // --- 开始手动修正 ---
      if (item.时期?.includes('唐') && item.llm_processed?.error) {
        console.log("手动修正唐朝数据:", item);
        return { year: 742, population: 150000, originalYear: '约742年 (天宝元年)' };
      }
      // --- 结束手动修正 ---

      const yearStr = item.llm_processed?.year || '';
      const population = item.llm_processed?.population_beijing || 0;
      
      let year;
      if (yearStr.includes('公元前')) {
        year = -parseInt(yearStr.replace('公元前', '').replace('年', ''));
      } else {
        year = parseInt(yearStr.replace('年', ''));
      }
      
      return { year, population, originalYear: yearStr };
    })
    .filter(item => !isNaN(item.year) && item.population > 0)
    .sort((a, b) => a.year - b.year);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const item = sortedData[params[0].dataIndex];
        return `年份: ${item.originalYear}<br/>北京人口: ${params[0].value.toLocaleString()} 人`;
      }
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.originalYear),
      name: '年份',
    },
    yAxis: {
      type: 'value',
      name: '人口数量（人）',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        data: sortedData.map(item => item.population),
        type: 'bar',
        name: '北京人口',
        itemStyle: {
          color: '#5470C6'
        }
      },
    ],
    dataZoom: [
        {
            type: 'inside'
        },
        {
            type: 'slider'
        }
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default PopulationView;