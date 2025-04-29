import React from 'react';
import './styles/start-record.css';
import { StartRecordText } from './components/StartRecordText.tsx';
import { StartRecordControls } from './components/StartRecordControls.tsx';

const StartRecordView: React.FC = () => {
  return (
    <div className="start-record-container">
      <div className="start-record-content">
        <StartRecordText />  {/* 녹음 시작 텍스트 표시 컴포넌트 */}
      </div>
      <div className="start-record-controls">
        <StartRecordControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default StartRecordView; 