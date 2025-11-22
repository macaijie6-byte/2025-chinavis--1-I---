import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card } from 'antd';
import TimelineView from './components/TimelineView';
import GeospatialView from './components/GeospatialView';
import SankeyView from './components/SankeyView';
import RiverChartView from './components/RiverChartView';
import EventGraphView from './components/EventGraphView';
import PopulationView from './components/PopulationView';
import ImageView from './components/ImageView';
import RagView from './components/RagView';
import { getJsonData } from './api'; // 引入 API 服务

const { Header, Content, Footer } = Layout;

const App = () => {
  const [currentDynasty, setCurrentDynasty] = useState('唐'); // 默认选中唐朝
  const [allData, setAllData] = useState({}); // 存储所有加载的数据

  // 处理朝代选择变化的函数
  const handleDynastyChange = (dynasty) => {
    console.log("选择了新的朝代:", dynasty);
    setCurrentDynasty(dynasty);
  };

  // 在组件加载时获取所有数据
  useEffect(() => {
    const loadAllData = async () => {
      // 这里可以并行加载所有需要的数据文件
      // 示例：加载人口和战争数据
      const populationData = await getJsonData('11人口 - 总数据和各朝代数据');
      const warData = await getJsonData('18战争 - 总数据和各朝代数据');
      const cityData = await getJsonData('07建制沿革 - 总数据和各朝代数据');
      const disasterData = await getJsonData('05灾害 - 总数据和各朝代数据');
      const imageData = await getJsonData('15物产 - 总数据和各朝代数据');
      
      setAllData({
        population: populationData,
        war: warData,
        city: cityData,
        disaster: disasterData,
        image: imageData,
        // ...可以继续加载其他数据
      });
      console.log("所有数据加载完毕:", { population: populationData, war: warData, city: cityData, disaster: disasterData, image: imageData });
      if (Array.isArray(populationData)) {
        console.log("原始人口数据 (前5条):", populationData.slice(0, 5));
      }
    };

    // 将 processed 文件夹移动到 public 目录下
    // Vite 会将 public 目录下的所有文件直接服务
    // 这是一个临时的前端解决方案，以便我们能快速看到效果
    console.log("请手动将 'data/processed' 文件夹复制到 'frontend/dashboard/public/' 目录下");
    
    loadAllData();
  }, []); // 空依赖数组表示只在组件首次渲染时执行

  // 根据当前朝代筛选数据
  const populationForDynasty = Array.isArray(allData.population) ? allData.population.filter(d => d.时期?.includes(currentDynasty)) : [];
  const warForDynasty = Array.isArray(allData.war) ? allData.war.filter(d => d.时期?.includes(currentDynasty)) : [];
  const cityForDynasty = Array.isArray(allData.city) ? allData.city.filter(d => d.时期?.includes(currentDynasty)) : [];
  const disasterForDynasty = Array.isArray(allData.disaster) ? allData.disaster.filter(d => d.时期?.includes(currentDynasty)) : [];
  const imageForDynasty = Array.isArray(allData.image) ? allData.image.filter(d => d.时期?.includes(currentDynasty)) : [];
  
  // 在筛选后打印日志，用于调试
  useEffect(() => {
    if(allData.population) {
      // console.log("原始人口数据:", allData.population);
      console.log(`筛选'${currentDynasty}'朝的人口数据结果:`, populationForDynasty);
    }
    if (allData.war) {
      console.log(`筛选'${currentDynasty}'朝的战争数据结果:`, warForDynasty);
    }
    if (allData.city) {
      console.log(`筛选'${currentDynasty}'朝的城市数据结果:`, cityForDynasty);
    }
    if (allData.disaster) {
      console.log(`筛选'${currentDynasty}'朝的灾害数据结果:`, disasterForDynasty);
    }
    if (allData.image) {
      console.log(`筛选'${currentDynasty}'朝的图像数据结果:`, imageForDynasty);
    }
  }, [currentDynasty, allData, populationForDynasty, warForDynasty, cityForDynasty, disasterForDynasty, imageForDynasty]);


  const filteredData = {
    population: populationForDynasty,
    war: warForDynasty,
    city: cityForDynasty,
    disaster: disasterForDynasty,
    image: imageForDynasty,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: 'white', fontSize: '24px', textAlign: 'center' }}>
        析城观史 - 北京历史时空演变可视分析 (当前朝代: {currentDynasty})
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          {/* Top Row: Timeline */}
          <Col span={24}>
            <Card title="朝代时间线">
              <TimelineView 
                onSelectDynasty={handleDynastyChange}
                currentDynasty={currentDynasty}
              />
            </Card>
          </Col>

          {/* Middle Row: Main Views */}
          <Col xs={24} lg={16}>
            <Card title="地理空间视图" style={{ height: 600 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
              <GeospatialView data={filteredData.war} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                                <Card title="历史文生图" style={{ height: 288 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
                  <ImageView data={filteredData.image} />
                </Card>
              </Col>
              <Col span={24}>
                <Card title="人口变迁视图" style={{ height: 288 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
                  <PopulationView data={filteredData.population} />
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Bottom Row: Chart Views */}
          <Col xs={24} lg={12}>
            <Card title="城市演进桑基图" style={{ height: 400 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
              <SankeyView data={filteredData.city} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="程度变化河流图" style={{ height: 400 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
              <RiverChartView data={filteredData.disaster} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="历史事件图谱" style={{ height: 400 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
              <EventGraphView data={filteredData.war} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="RAG 知识问答" style={{ height: 400 }} styles={{ body: { height: 'calc(100% - 58px)' } }}>
              <RagView />
            </Card>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        析城观史 ©2025 Created by GitHub Copilot
      </Footer>
    </Layout>
  );
};

export default App;

