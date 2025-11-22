import React from 'react';
import { Button, Space } from 'antd';

const DYNASTIES = [
  '秦', '汉', '三国', '晋', '南北朝', '隋', '唐', '五代十国', '宋', '辽', '金', '元', '明', '清'
];

const TimelineView = ({ onSelectDynasty, currentDynasty }) => {
  return (
    <div style={{ padding: '10px 0' }}>
      <Space wrap>
        {DYNASTIES.map(dynasty => (
          <Button
            key={dynasty}
            type={currentDynasty === dynasty ? 'primary' : 'default'}
            onClick={() => onSelectDynasty(dynasty)}
          >
            {dynasty}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default TimelineView;
