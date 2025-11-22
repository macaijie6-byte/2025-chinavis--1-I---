import React from 'react';
import ReactECharts from 'echarts-for-react';

// 辅助函数：从 "三级" 字段中提取主要的实体名称
const getSourceName = (text) => {
  if (!text || typeof text !== 'string') return null;
  return text.split(/：|:| /)[0].trim();
};

// 辅助函数：从 "四级" 字段中提取相关的实体列表
const parseTargets = (text) => {
  if (!text || typeof text !== 'string') return [];
  // 匹配 "领...县是：A、B、C" 或 "领...县：A、B、C" 等模式
  const match = text.match(/(?:领|管|辖|为|有|是)[^：:]*[:：]\s*(.*)/);
  if (match && match[1]) {
    // 使用顿号、逗号、空格等作为分隔符
    return match[1].split(/[、，, ]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};


const SankeyView = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>当前朝代没有可显示的城市演进数据。</div>;
  }

  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  data.forEach(item => {
    const sourceName = getSourceName(item['三级']);
    // 使用正确的四级字段名
    const targetsText = item['四级（对“建制沿革总体描述原文”的拆分）'];
    const targetNames = parseTargets(targetsText);

    if (sourceName && targetNames.length > 0) {
      if (!nodeSet.has(sourceName)) {
        nodeSet.add(sourceName);
        nodes.push({ name: sourceName });
      }

      targetNames.forEach(targetName => {
        if (!nodeSet.has(targetName)) {
          nodeSet.add(targetName);
          nodes.push({ name: targetName });
        }
        links.push({
          source: sourceName,
          target: targetName,
          value: 1, // 给一个基础权重值
        });
      });
    }
  });

  if (nodes.length === 0 || links.length === 0) {
    return <div>无法根据当前数据生成有效的演进关系图。</div>;
  }

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency',
        },
        data: nodes,
        links: links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
        },
        label: {
            fontSize: 10
        }
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default SankeyView;
