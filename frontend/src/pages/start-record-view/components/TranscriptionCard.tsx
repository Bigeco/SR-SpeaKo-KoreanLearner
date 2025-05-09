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

// Add a helper function for character-level diff highlighting
function highlightDiffChars(original: string, corrected: string, type: 'transcribed' | 'corrected') {
  const maxLen = Math.max(original.length, corrected.length);
  const originalChars = original.split('');
  const correctedChars = corrected.split('');
  return Array.from({ length: maxLen }).map((_, i) => {
    const o = originalChars[i] || '';
    const c = correctedChars[i] || '';
    if (o !== c) {
      if (type === 'transcribed' && o) {
        return <span key={i} className="text-red-500 line-through">{o}</span>;
      }
      if (type === 'corrected' && c) {
        return <span key={i} className="text-green-600 font-semibold">{c}</span>;
      }
    }
    // unchanged
    return <span key={i}>{type === 'transcribed' ? o : c}</span>;
  });
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  recordingState,
  transcribedText,
  correctedText,
  isPlaying,
  onPlayAudio
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
          {(() => {
            if (recordingState !== 'completed' || !transcribedText || !correctedText) {
              return transcribedText || (recordingState === 'idle' ? '아직 녹음되지 않았습니다' : '인식 중...');
            }
            const transcribedWords = transcribedText.split(' ');
            const correctedWords = correctedText.split(' ');
            return transcribedWords.map((word, idx) => {
              const isChanged = word !== correctedWords[idx];
              if (isChanged) {
                return (
                  <span key={idx} className="mr-1">
                    {highlightDiffChars(word, correctedWords[idx] || '', 'transcribed')}
                  </span>
                );
              }
              return <span key={idx} className="mr-1">{word}</span>;
            });
          })()}
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
          <p className="text-gray-800 text-lg">
            {(() => {
              const transcribedWords = transcribedText.split(' ');
              const correctedWords = correctedText.split(' ');
              return correctedWords.map((word, idx) => {
                const isChanged = word !== transcribedWords[idx];
                if (isChanged) {
                  return (
                    <span key={idx} className="mr-1">
                      {highlightDiffChars(transcribedWords[idx] || '', word, 'corrected')}
                    </span>
                  );
                }
                return <span key={idx} className="mr-1">{word}</span>;
              });
            })()}
          </p>
          <div className="mt-2">
            <button 
              onClick={onPlayAudio}
              className="flex items-center text-gray-500 text-sm"
            >
              <span className="flex items-center">
                <Volume2 size={16} className="mr-1 relative top-[1px]" />
              </span>
              <span className="leading-none">
                {isPlaying ? '재생 중...' : '들어보기'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionCard; 