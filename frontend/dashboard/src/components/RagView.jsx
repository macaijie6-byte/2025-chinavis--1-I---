import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Card, Avatar, Typography, Spin, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { chatWithRag } from '../api';

const { Text, Paragraph } = Typography;

const RagView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是析城观史的智能助手。你可以问我关于析城山的历史、人物、事件或物产等问题。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const result = await chatWithRag(userMsg.content);
      const aiMsg = { 
        role: 'assistant', 
        content: result.answer,
        context: result.context_used 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      message.error('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f0f2f5', 
      padding: '20px' 
    }}>
      <Card 
        title="历史知识问答 (RAG)" 
        bordered={false}
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden' // 防止 Card 本身滚动
        }}
        bodyStyle={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={item => (
            <List.Item style={{ border: 'none', padding: '10px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                    style={{ backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a' }}
                  />
                }
                title={item.role === 'user' ? '我' : '智能助手'}
                description={
                  <div style={{ 
                    background: item.role === 'user' ? '#e6f7ff' : '#f6ffed', 
                    padding: '10px', 
                    borderRadius: '8px',
                    display: 'inline-block',
                    maxWidth: '80%'
                  }}>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                    {item.context && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#888', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>参考来源：</Text>
                        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ fontSize: '12px', margin: 0 }}>
                          {item.context}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                }
                style={{ 
                  flexDirection: item.role === 'user' ? 'row-reverse' : 'row',
                  textAlign: item.role === 'user' ? 'right' : 'left'
                }}
              />
            </List.Item>
          )}
        />
        {loading && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <Spin tip="正在思考..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Input 
          placeholder="请输入您的问题..." 
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={handleSend}
          disabled={loading}
          size="large"
        />
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSend} 
          loading={loading}
          size="large"
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default RagView;
