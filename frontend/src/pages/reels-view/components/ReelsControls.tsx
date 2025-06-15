// components/ReelsControls.tsx
import React from 'react';

interface ReelsControlsProps {
  currentIndex: number;
  totalWords: number;
  isRecording: boolean;
  onMicClick: () => void;
}

export const ReelsControls: React.FC<ReelsControlsProps> = ({
  currentIndex,
  totalWords,
  isRecording,
  onMicClick
}) => {
  return (
    <div className="reels-controls">
      <div className="progress">
        {currentIndex + 1} / {totalWords}
      </div>
      <button 
        className={`mic-button ${isRecording ? 'recording' : ''}`} 
        onClick={onMicClick}
        disabled={isRecording}
      >
        {isRecording ? '녹음 중...' : '🎤 시작'}
      </button>
    </div>
  );
};
