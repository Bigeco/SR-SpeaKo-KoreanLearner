import React from 'react';
import './styles/onboarding.css';
import { OnboardingText } from './components/OnboardingText.tsx';
import { OnboardingControls } from './components/OnboardingControls.tsx';

const OnboardingView: React.FC = () => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <OnboardingText />  {/* 온보딩 텍스트 표시 컴포넌트 */}
      </div>
      <div className="onboarding-controls">
        <OnboardingControls />  {/* 컨트롤 버튼 컴포넌트 */}
      </div>
    </div>
  );
};

export default OnboardingView; 