import React, { useRef } from 'react';
import { AudioRecorder } from '../../../components/common/AudioRecorder';

export const StartRecordText: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="start-record-text">
      <h2>녹음</h2>
      <AudioRecorder
        onRecordingComplete={(audioUrl) => {
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
          }
          console.log('녹음이 완료되었습니다:', audioUrl);
        }}
      >
        {({ isRecording, startRecording, stopRecording }) => (
          <div className="start-record-audio-recorder">
            <button
              id="start"
              onClick={startRecording}
              disabled={isRecording}
            >
              시작
            </button>
            <button
              id="stop"
              onClick={stopRecording}
              disabled={!isRecording}
            >
              정지
            </button>
            <audio id="audio" ref={audioRef} controls />
            {isRecording && <p>녹음 중</p>}
          </div>
        )}
      </AudioRecorder>
    </div>
  );
};
