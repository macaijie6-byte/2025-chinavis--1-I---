import React, { useState } from 'react';
import { Carousel, Button, Spin, Tooltip, message } from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateImage } from '../api'; // Import the API function
import './ImageView.css';

const ImageView = ({ data }) => {
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState({}); // Store generated image URLs by index

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>当前朝代没有可显示的物产数据。</p>
      </div>
    );
  }

  const handleGenerate = async (index, text) => {
    if (generating) return;
    setGenerating(true);
    
    try {
      // Construct a better prompt for historical image generation
      const prompt = `历史复原图，中国古代，${text}，写实风格，高画质`;
      const result = await generateImage(prompt);
      
      setGeneratedImages(prev => ({ ...prev, [index]: result.url }));
      
      if (result.note) {
        message.info(result.note);
      } else {
        message.success("图片生成成功！");
      }
    } catch (error) {
      message.error("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="image-view-container">
      <Carousel arrows prevArrow={<LeftOutlined />} nextArrow={<RightOutlined />} style={{ height: '100%' }}>
        {data.map((item, index) => (
          <div key={index} className="carousel-item">
            <div className="image-area">
              {generating ? (
                <div className="loading-state">
                  <Spin tip="AI 正在解析文本并生成图片..." />
                </div>
              ) : generatedImages[index] ? (
                <div className="generated-image-wrapper">
                  <img 
                    src={generatedImages[index]} 
                    alt={item['Unnamed: 2']} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <Tooltip title="重新生成">
                    <Button 
                      type="primary" 
                      shape="circle" 
                      icon={<ReloadOutlined />} 
                      className="regenerate-btn"
                      onClick={() => handleGenerate(index, item['物产'])}
                    />
                  </Tooltip>
                </div>
              ) : (
                <div className="placeholder-state" onClick={() => handleGenerate(index, item['物产'])}>
                  <p>点击生成 "{item['Unnamed: 2']}" 的历史复原图</p>
                  <Button type="primary">开始生成</Button>
                </div>
              )}
            </div>
            <div className="carousel-caption">
              <h3>{item['Unnamed: 2']}</h3>
              <p title={item['物产']}>{item['物产']}</p>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default ImageView;
