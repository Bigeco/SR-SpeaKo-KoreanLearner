import React from 'react';
import { useNavigate } from 'react-router-dom';

export const OnboardingControls: React.FC = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/start-record');
  };

  return (
    <div className="onboarding-controls-buttons flex justify-center mt-2">
      <button
        className="control-button"
        onClick={handleNext}
      >
        시작하기
      </button>
    </div>
  );
};
