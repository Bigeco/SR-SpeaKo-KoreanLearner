import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';
import { getDiffRomanizations } from '../../../utils/romanizer_api';
import { textToSpeech, checkServerHealth } from '../../../utils/cosyvoice2_api';

interface TranscriptionCardProps {
  recordingState: 'idle' | 'recording' | 'completed';
  transcribedText: string;
  correctedText: string;
  isPlaying: boolean;
  onPlayAudio: () => void;
  renderHighlightedCorrections: () => React.ReactNode;
  wrongRomanizations?: string[];
  correctRomanizations?: string[];
  g2pkText?: string;
  recordedAudioBlob?: Blob;
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
  g2pkText,
  recordedAudioBlob
}) => {
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // 디버그 로깅 추가
  console.log('🎵 TranscriptionCard 렌더링:', {
    hasAudioBlob: !!recordedAudioBlob,
    audioBlobSize: recordedAudioBlob?.size,
    recordingState,
    transcribedText,
    correctedText
  });

  const handleTtsPlay = async () => {
    console.log('🎯 handleTtsPlay 함수 시작');
    if (!recordedAudioBlob || !correctedText) {
      console.log('❌ TTS 재생 실패: 필요한 데이터가 없습니다', {
        hasAudioBlob: !!recordedAudioBlob,
        hasCorrectedText: !!correctedText,
        audioBlobSize: recordedAudioBlob?.size,
        correctedText
      });
      return;
    }

    try {
      setIsTtsPlaying(true);
      setTtsError(null);

      console.log('🔍 TTS 서버 상태 확인 중...');
      // Check server health first
      const isServerAvailable = await checkServerHealth();
      if (!isServerAvailable) {
        throw new Error('음성 합성 서버에 연결할 수 없습니다.');
      }
      console.log('✅ TTS 서버 연결 성공');

      // Convert Blob to File
      const audioFile = new File([recordedAudioBlob], 'prompt.wav', { type: 'audio/wav' });
      console.log('📁 오디오 파일 준비 완료:', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type
      });

      console.log('🎤 TTS API 호출 시작:', {
        promptText: transcribedText,
        targetText: correctedText
      });

      // Call TTS API
      const result = await textToSpeech(
        audioFile,
        transcribedText,  // Use transcribed text as prompt text
        correctedText     // Use corrected text as target text
      );

      console.log('📥 TTS API 응답 수신:', {
        hasAudio: !!result.audio,
        audioLength: result.audio?.length,
        error: result.error
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.audio) {
        throw new Error('음성 데이터가 없습니다.');
      }

      // Play the audio
      console.log('🔊 오디오 재생 시작');
      const audio = new Audio(`data:audio/wav;base64,${result.audio}`);
      
      audio.onended = () => {
        console.log('✅ 오디오 재생 완료');
        setIsTtsPlaying(false);
      };
      
      audio.onerror = (error) => {
        console.error('❌ 오디오 재생 오류:', error);
        setIsTtsPlaying(false);
        setTtsError('오디오 재생 중 오류가 발생했습니다.');
      };

      try {
        await audio.play();
        console.log('▶️ 오디오 재생 시작됨');
      } catch (playError) {
        console.error('❌ 오디오 재생 실패:', playError);
        throw new Error('오디오 재생을 시작할 수 없습니다.');
      }
    } catch (error) {
      console.error('💥 TTS 처리 중 오류 발생:', error);
      setIsTtsPlaying(false);
      setTtsError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

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
          <div className="mt-2 flex flex-col items-center gap-2">
            {/* Original audio playback button */}
            <button 
              onClick={onPlayAudio}
              className="flex items-center text-gray-500 text-sm"
            >
              <span className="flex items-center">
                <Volume2 size={16} className="mr-1 relative top-[1px]" />
              </span>
              <span className="leading-none">
                {isPlaying ? '재생 중...' : '교정된 음성 듣기'}
              </span>
            </button>

            {/* TTS playback button */}
            {recordedAudioBlob ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  alert('TTS 버튼 클릭됨');  // 기본적인 클릭 확인
                  console.log('🎯 TTS 버튼 클릭됨 - 버튼 이벤트');
                  handleTtsPlay();
                }}
                disabled={isTtsPlaying}
                className="flex items-center text-blue-500 text-sm disabled:opacity-50"
              >
                <span className="flex items-center">
                  <Volume2 size={16} className="mr-1 relative top-[1px]" />
                </span>
                <span className="leading-none">
                  {isTtsPlaying ? '음성 합성 중...' : '교정된 발음 듣기'}
                </span>
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                Debug: recordedAudioBlob 없음
              </div>
            )}

            {/* Error message */}
            {ttsError && (
              <p className="text-red-500 text-xs mt-1">{ttsError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionCard;