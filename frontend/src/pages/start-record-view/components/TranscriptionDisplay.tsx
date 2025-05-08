import { Volume2 } from 'lucide-react';
import React from 'react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';

interface TranscriptionDisplayProps {
  recordingState: 'idle' | 'recording' | 'completed';
  transcribedText: string;
  correctedText: string;
  isPlaying: boolean;
  onPlayAudio: () => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  recordingState,
  transcribedText,
  correctedText,
  isPlaying,
  onPlayAudio
}) => {
  
  // 원본 텍스트와 교정된 텍스트의 차이점 시각화
  const renderDifferences = () => {
    if (!transcribedText || !correctedText) return null;
    
    const transcribedWords = transcribedText.split(' ');
    const correctedWords = correctedText.split(' ');
    
    return (
      <div className="mt-3 pt-3 border-t border-green-100">
        <p className="text-sm text-gray-600">교정된 부분:</p>
        <div className="mt-1 text-sm">
          {transcribedWords.map((word, idx) => {
            const isChanged = word !== correctedWords[idx];
            
            return (
              <span key={idx} className={`inline-block mr-2 ${isChanged ? 'line-through text-red-500' : ''}`}>
                {word}
                {isChanged && (
                  <span className="inline-block ml-1 text-green-500 no-underline">
                    <span className="correction-arrow mx-1">→</span>
                    {correctedWords[idx]}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* 원본 전사 텍스트 */}
      <div className={`p-4 ${recordingState === 'completed' || correctedText ? 'bg-gray-50 border-b' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">인식된 문장</span>
          <div className="flex items-center h-8">
            <AudioWaveform 
              isActive={recordingState === 'recording' || isPlaying} 
              color="#4B5563" 
            />
          </div>
        </div>
        
        <p className={`text-gray-800 text-lg ${recordingState === 'recording' ? 'typing-animation' : ''}`}>
          {transcribedText || (recordingState === 'idle' ? '아직 녹음되지 않았습니다' : '인식 중...')}
        </p>
        
        {recordingState === 'completed' && (
          <div className="mt-2">
            <button 
              onClick={onPlayAudio}
              className="flex items-center text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              <Volume2 size={16} className="mr-1" />
              {isPlaying ? '재생 중...' : '들어보기'}
            </button>
          </div>
        )}
      </div>
      
      {/* 교정된 텍스트 (전사된 텍스트가 있을 때만 표시) */}
      {correctedText && (
        <div className="p-4 bg-green-50 result-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">교정된 문장</span>
            {recordingState === 'recording' && (
              <div className="text-xs text-green-600 animate-pulse">실시간 교정 중...</div>
            )}
          </div>
          
          <p className="text-gray-800 text-lg">{correctedText}</p>
          
          {/* 비교 표시: 잘못된 부분 하이라이트 (completed 상태에서만) */}
          {recordingState === 'completed' && transcribedText !== correctedText && renderDifferences()}
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;