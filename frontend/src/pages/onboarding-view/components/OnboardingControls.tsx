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
        className="control-button bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        onClick={handleNext}
      >
        시작하기
      </button>
    </div>
  );
};
