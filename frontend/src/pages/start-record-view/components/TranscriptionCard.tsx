import React from 'react';
import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';
import { getDiffRomanizations } from '../../../utils/romanizer_api';

interface TranscriptionCardProps {
  recordingState: 'idle' | 'recording' | 'completed';
  transcribedText: string;
  correctedText: string;
  isPlaying: boolean;
  onPlayAudio: () => void;
  renderHighlightedCorrections: () => React.ReactNode;
  wrongRomanizations?: string[];
  correctRomanizations?: string[];
  g2pkText?: string;  // 추가
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
  onPlayAudio,
  wrongRomanizations,
  correctRomanizations,
  g2pkText
}) => {
  // 콘솔 출력 추가
  console.log('transcribedText:', transcribedText);
  console.log('correctedText:', correctedText);
  console.log('wrongRomanizations:', wrongRomanizations);
  console.log('correctRomanizations:', correctRomanizations);
  console.log('g2pkText:', g2pkText);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* 1. 교정된 텍스트 (completed 상태일 때만 표시) */}
      {recordingState === 'completed' && correctedText && (
        <div className="p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">이 문장을 말하려고 했나요?</span>
            <div className="flex items-center h-8">
              <AudioWaveform 
                isActive={isPlaying} 
                color="#059669" 
              />
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {(() => {
              const transcribedWords = transcribedText.split(' ');
              const correctedWords = correctedText.split(' ');
              return correctedWords.map((word, idx) => {
                const transcribedWord = transcribedWords[idx] || '';
                if (word !== transcribedWord && correctRomanizations && correctRomanizations[idx]) {
                  // 음절 단위로 분리
                  const userSylls = transcribedWord.split('');
                  const correctSylls = word.split('');
                  const romanSylls = correctRomanizations[idx].split('-');
                  const diffRomans = getDiffRomanizations(correctSylls, userSylls, romanSylls);
                  const diffSpans = highlightDiffChars(transcribedWord, word, 'corrected');
                  return (
                    <div key={idx} className="flex flex-col items-center min-w-[1.5em]">
                      <div className="flex">
                        {diffSpans.map((syllSpan, sidx) => (
                          <div key={sidx} className="flex flex-col items-center">
                            <span className="text-lg">{syllSpan}</span>
                            {diffRomans[sidx] && (
                              <span className="text-xs text-green-600 font-semibold mt-0.5">{diffRomans[sidx]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  // unchanged word
                  return (
                    <div key={idx} className="flex flex-col items-center min-w-[1.5em]">
                      <span className="text-gray-800 text-lg">{word}</span>
                    </div>
                  );
                }
              });
            })()}
          </div>
        </div>
      )}

      {/* 2. 원본 전사 텍스트 */}
      <div className={`p-4 ${recordingState === 'completed' ? 'bg-gray-50 border-b' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">이렇게 발음했어요(wav2vec2)</span>
          <div className="flex items-center h-8">
            <AudioWaveform 
              isActive={recordingState === 'recording'} 
              color="#4B5563" 
            />
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {(() => {
            if (recordingState !== 'completed' || !transcribedText || !correctedText) {
              return <p className="text-gray-800 text-lg">{transcribedText || (recordingState === 'idle' ? '아직 녹음되지 않았습니다' : '인식 중...')}</p>;
            }
            const transcribedWords = transcribedText.split(' ');
            const correctedWords = correctedText.split(' ');
            return transcribedWords.map((word, idx) => {
              const correctedWord = correctedWords[idx] || '';
              if (word !== correctedWord && wrongRomanizations && wrongRomanizations[idx]) {
                // 음절 단위로 분리
                const userSylls = word.split('');
                const correctSylls = correctedWord.split('');
                const romanSylls = wrongRomanizations[idx].split('-');
                const diffRomans = getDiffRomanizations(userSylls, correctSylls, romanSylls);
                const diffSpans = highlightDiffChars(word, correctedWord, 'transcribed');
                return (
                  <div key={idx} className="flex flex-col items-center min-w-[1.5em]">
                    <div className="flex">
                      {diffSpans.map((syllSpan, sidx) => (
                        <div key={sidx} className="flex flex-col items-center">
                          <span className="text-lg">{syllSpan}</span>
                          {diffRomans[sidx] && (
                            <span className="text-xs text-red-500 font-semibold mt-0.5">{diffRomans[sidx]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                // unchanged word
                return (
                  <div key={idx} className="flex flex-col items-center min-w-[1.5em]">
                    <span className="text-gray-800 text-lg">{word}</span>
                  </div>
                );
              }
            });
          })()}
        </div>
      </div>

      {/* 3. G2PK 발음 표기 */}
      {recordingState === 'completed' && g2pkText && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">이렇게 발음해보세요(g2pk)</span>
          </div>
          <p className="text-gray-800 text-lg text-center">{g2pkText}</p>
          {/* 들어보기 버튼을 여기로 이동 */}
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