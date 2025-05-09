import React from 'react';
import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';

interface TranscriptionCardProps {
  recordingState: 'idle' | 'recording' | 'completed';
  transcribedText: string;
  correctedText: string;
  isPlaying: boolean;
  onPlayAudio: () => void;
  renderHighlightedCorrections: () => React.ReactNode;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  recordingState,
  transcribedText,
  correctedText,
  isPlaying,
  onPlayAudio,
  renderHighlightedCorrections,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* 원본 전사 텍스트 */}
      <div className={`p-4 ${recordingState === 'completed' ? 'bg-gray-50 border-b' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">인식된 문장</span>
          <div className="flex items-center h-8">
            <AudioWaveform 
              isActive={recordingState === 'recording'} 
              color="#4B5563" 
            />
          </div>
        </div>
        <p className="text-gray-800 text-lg">
          {transcribedText || (recordingState === 'idle' ? '아직 녹음되지 않았습니다' : '인식 중...')}
        </p>
      </div>
      {/* 교정된 텍스트 (completed 상태일 때만 표시) */}
      {recordingState === 'completed' && correctedText && (
        <div className="p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">교정된 문장</span>
            <div className="flex items-center h-8">
              <AudioWaveform 
                isActive={isPlaying} 
                color="#059669" 
              />
            </div>
          </div>
          <p className="text-gray-800 text-lg">{correctedText}</p>
          {/* 비교 표시: 잘못된 부분 하이라이트 */}
          {renderHighlightedCorrections()}
          <div className="mt-2">
            <button 
              onClick={onPlayAudio}
              className="flex items-center text-gray-500 text-sm"
            >
              <Volume2 size={16} className="mr-1" />
              {isPlaying ? '재생 중...' : '들어보기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionCard; 