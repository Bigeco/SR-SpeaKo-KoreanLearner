import React from 'react';
import './styles/oral-structure.css';
import { OralStructureText } from './components/OralStructureText.tsx';
import { OralStructureControls } from './components/OralStructureControls.tsx';

const OralStructureView: React.FC = () => {
  return (
    <div className="oral-structure-container">
      <div className="oral-structure-content">
        <OralStructureText />  {/* 구강 구조 텍스트 표시 컴포넌트 */}
      </div>
      <div className="oral-structure-controls">
        <OralStructureControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default OralStructureView; 