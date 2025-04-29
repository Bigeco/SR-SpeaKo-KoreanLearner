import React from 'react';
import './styles/reels.css';
import { ReelsText } from './components/ReelsText';
import { ReelsControls } from './components/ReelsControls';

const ReelsView: React.FC = () => {
  return (
    <div className="reels-container">
      <div className="reels-content">
        <ReelsText />  {/* 릴스 텍스트 표시 컴포넌트 */}
      </div>
      <div className="reels-controls">
        <ReelsControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default ReelsView; 