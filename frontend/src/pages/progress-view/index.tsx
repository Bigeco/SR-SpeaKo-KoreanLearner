import React from 'react';
import './styles/progress.css';
import { ProgressText } from './components/ProgressText.tsx';
import { ProgressControls } from './components/ProgressControls.tsx';

const ProgressView: React.FC = () => {
  return (
    <div className="progress-container">
      <div className="progress-content">
        <ProgressText />  {/* 진행 상황 표시 컴포넌트 */}
      </div>
      <div className="progress-controls">
        <ProgressControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default ProgressView; 