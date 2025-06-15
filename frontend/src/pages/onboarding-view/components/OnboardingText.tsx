import React from 'react';

export const OnboardingText: React.FC = () => {
  return (
    <div className="onboarding-text text-center p-4">
      <h2 className="welcome-title">Speako.</h2>
      <p className="text-gray-700 mb-4">
        SpeaKo의 다양한 피드백을 통해 정확한 한국어 발음을 학습할 수 있어요.
      </p>
      <p className="text-gray-600">
        아래 버튼을 눌러 발음 연습을 시작해보세요.
      </p>
    </div>
  );
};