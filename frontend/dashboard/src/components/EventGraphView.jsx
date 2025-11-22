import React from 'react';
import ReactECharts from 'echarts-for-react';

const EventGraphView = ({ data }) => {
  console.log("EventGraphView 接收到的数据:", data); 
  if (!data || data.length === 0) {
    return <div>当前朝代没有可显示的战争事件数据。</div>;
  }

  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  data.forEach(item => {
    const event = item.llm_processed;
    
    // --- 数据回退逻辑 ---
    const belligerentStr = event?.belligerent || item['Unnamed: 6'] || '';
    const locationStr = event?.location || item['Unnamed: 5'] || '';
    const eventName = event?.event_name || item['三级'] || '未知事件';
    // --- 结束数据回退逻辑 ---

    if (!belligerentStr || !locationStr) {
      return; // 如果没有任何有效信息，则跳过
    }

    // 拆分可能的多个参战方和地点
    const belligerents = (typeof belligerentStr === 'string') 
      ? belligerentStr.split(/,|、| vs |，/g).map(b => b.trim()).filter(b => b)
      : [];
    const locations = (typeof locationStr === 'string')
      ? locationStr.split(/,|、|，/g).map(l => l.trim()).filter(l => l)
      : [];

    // 添加地点节点
    locations.forEach(location => {
        if (location && !nodeSet.has(location)) {
            nodeSet.add(location);
            nodes.push({
              id: location,
              name: location,
              symbolSize: 20,
              category: 1, // '地点'
              label: { show: true, position: 'right' }
            });
          }
    });

    // 添加参战方节点并创建连线
    belligerents.forEach(belligerent => {
      if (belligerent && !nodeSet.has(belligerent)) {
        nodeSet.add(belligerent);
        nodes.push({
          id: belligerent,
          name: belligerent,
          symbolSize: 35,
          category: 0, // '参战方'
          label: { show: true, position: 'right' }
        });
      }

      // 添加从参战方到每个地点的连线
      locations.forEach(location => {
        if (belligerent && location) {
            links.push({
              source: belligerent,
              target: location,
              value: eventName
            });
          }
      });
    });
  });

  if (nodes.length === 0) {
    return <div>根据当前数据无法生成有效的事件图谱。</div>;
  }

  const option = {
    tooltip: {
        formatter: (params) => {
            if (params.dataType === 'edge') {
                return `<strong>事件:</strong> ${params.value}`;
            }
            return params.name;
        }
    },
    legend: [{
      data: ['参战方', '地点']
    }],
    series: [
      {
        name: '历史事件图谱',
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: [
          { name: '参战方' }, 
          { name: '地点' }
        ],
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        force: {
          repulsion: 150,
          gravity: 0.05,
          edgeLength: 80
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [4, 10],
        edgeLabel: {
            show: false
        },
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default EventGraphView;
