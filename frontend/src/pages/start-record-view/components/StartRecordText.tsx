import React from 'react';
import { AudioRecorder } from '../../../components/common/AudioRecorder';

export const StartRecordText: React.FC = () => {
  const handleRecordingComplete = (audioUrl: string) => {
    console.log('녹음이 완료되었습니다:', audioUrl);
  };

  return (
    <div className="start-record-text">
      <h2>녹음</h2>
      <AudioRecorder 
        onRecordingComplete={handleRecordingComplete}
        className="start-record-audio-recorder"
      />
    </div>
  );
};
