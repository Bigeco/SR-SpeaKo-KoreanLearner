import React from 'react';
import './styles/subtitle.css';
import { SubtitleText } from './components/SubtitleText';
import { SubtitleControls } from './components/SubtitleControls';

const SubtitleView: React.FC = () => {
  return (
    <div className="subtitle-container">
      <div className="subtitle-content">
        <SubtitleText />  {/* 자막 표시 컴포넌트 */}
      </div>
      <div className="subtitle-controls">
        <SubtitleControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default SubtitleView;
