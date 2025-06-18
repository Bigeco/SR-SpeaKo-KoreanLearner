import React, { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';
import { getDiffRomanizations } from '../../../utils/romanizer_api';
import { textToSpeech, checkServerHealth } from '../../../utils/cosyvoice2_api';

interface TranscriptionCardProps {
  recordingState: 'idle' | 'recording' | 'completed';
  transcribedText: string;
  correctedText: string;
  // isPlaying: boolean;
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

// WAV 헤더를 추가하는 함수
async function blobToWav(blob: Blob, sampleRate = 16000): Promise<Blob> {
  const audioCtx = new AudioContext({ sampleRate });
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0); // mono
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  const buffer = new ArrayBuffer(44 + channelData.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + channelData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); // byteRate
  view.setUint16(32, blockAlign, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  writeString(36, 'data');
  view.setUint32(40, channelData.length * 2, true);

  // PCM 16bit signed little endian으로 복사
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(44 + i * 2, sample * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  recordingState,
  transcribedText,
  correctedText,
  // isPlaying,
  onPlayAudio,
  wrongRomanizations,
  correctRomanizations,
  g2pkText,
  recordedAudioBlob
}) => {
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isOriginalPlaying, setIsOriginalPlaying] = useState(false);
  const [isTtsAudioPlaying, setIsTtsAudioPlaying] = useState(false); // TTS 오디오 재생 상태
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasClicked, setHasClicked] = React.useState(false);

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
    console.log('🔍 TTS 입력 데이터 확인:', {
      transcribedText: `"${transcribedText}"`,
      correctedText: `"${correctedText}"`,
      hasAudioBlob: !!recordedAudioBlob
    });

    if (!recordedAudioBlob || !correctedText) {
      console.log('❌ TTS 재생 실패: 필요한 데이터가 없습니다');
      setTtsError('필요한 데이터가 없습니다.');
      return;
    }

    try {
      setIsTtsPlaying(true);
      setTtsError(null);

      console.log('🔍 TTS 서버 상태 확인 중...');
      const isServerAvailable = await checkServerHealth();
      if (!isServerAvailable) {
        throw new Error('음성 합성 서버에 연결할 수 없습니다.');
      }
      console.log('✅ TTS 서버 연결 성공');

      // Blob을 ArrayBuffer로 변환
      const arrayBuffer = await recordedAudioBlob.arrayBuffer();
      console.log('📊 원본 오디오 데이터:', {
        size: arrayBuffer.byteLength,
        type: recordedAudioBlob.type
      });

      // WAV 헤더 추가 (서버에서 인식할 수 있도록)
      const wavBlob = await blobToWav(recordedAudioBlob);

      // 새로운 WAV Blob 생성
      const audioFile = new File([wavBlob], 'prompt.wav', { type: 'audio/wav' });
      
      console.log('📁 오디오 파일 준비 완료:', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type
      });

      // ✅ 핵심 수정: 둘 다 correctedText 사용
      console.log('🎤 TTS API 호출 시작 - 수정된 로직:', {
        promptText: correctedText,  // 정확한 발음
        targetText: correctedText   // 정확한 발음
      });

      // Call TTS API - 둘 다 correctedText 사용
      const result = await textToSpeech(
        audioFile,
        correctedText,  // promptText: 정확한 발음
        correctedText   // targetText: 정확한 발음
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
      

      audio.onplay = () => {
        console.log('▶️ TTS 오디오 재생 시작');
        setIsTtsAudioPlaying(true);
      };
      
      audio.onended = () => {
        console.log('✅ TTS 오디오 재생 완료');
        setIsTtsPlaying(false);
        setIsTtsAudioPlaying(false);
      };
      
      audio.onerror = (error) => {
        console.error('❌ TTS 오디오 재생 오류:', error);
        setIsTtsPlaying(false);
        setIsTtsAudioPlaying(false);
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
      setIsTtsAudioPlaying(false);
      setTtsError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // ✅ WebKit 호환성을 위한 원본 음성 재생 함수 완전 재작성
  const handleOriginalAudioPlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎵 원본 발음 듣기 버튼 클릭됨');
    
    if (!recordedAudioBlob) {
      console.error('❌ 원본 음성 재생 실패: recordedAudioBlob이 없습니다');
      return;
    }

    // 이미 재생 중이면 정지
    if (isOriginalPlaying && audioRef.current) {
      console.log('⏸️ 재생 중지');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsOriginalPlaying(false);
      onPlayAudio();
      return;
    }

    try {
      console.log('🔄 음성 재생 준비 시작');
      setIsOriginalPlaying(true);
      onPlayAudio();

      // 이전 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
        audioRef.current = null;
      }

      // ArrayBuffer를 통한 방식 (WebKit 호환성 개선)
      const arrayBuffer = await recordedAudioBlob.arrayBuffer();
      console.log('📊 오디오 데이터 분석:', {
        size: arrayBuffer.byteLength,
        type: recordedAudioBlob.type
      });

      // Base64로 변환 (Blob URL 대신 사용)
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:${recordedAudioBlob.type || 'audio/wav'};base64,${base64}`;
      
      console.log('🔗 Data URL 생성 완료:', {
        dataUrlLength: dataUrl.length,
        mimeType: recordedAudioBlob.type
      });

      // 새로운 Audio 객체 생성
      const audio = new Audio();
      audioRef.current = audio;

      // 모든 이벤트 리스너를 Promise로 래핑
      const audioLoadPromise = new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => {
          console.log('✅ 오디오 재생 준비 완료');
          resolve();
        }, { once: true });

        audio.addEventListener('error', (e) => {
          console.error('❌ 오디오 로드 오류:', e, audio.error);
          reject(new Error(`오디오 로드 실패: ${audio.error?.message || 'Unknown error'}`));
        }, { once: true });

        // 타임아웃 설정 (10초)
        setTimeout(() => {
          reject(new Error('오디오 로드 타임아웃'));
        }, 10000);
      });

      // 재생 완료 및 오류 처리
      audio.addEventListener('ended', () => {
        console.log('✅ 원본 음성 재생 완료');
        setIsOriginalPlaying(false);
        onPlayAudio();
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ 원본 음성 재생 중 오류:', e, audio.error);
        setIsOriginalPlaying(false);
        onPlayAudio();
        audioRef.current = null;
      });

      // 재생 진행 모니터링
      audio.addEventListener('timeupdate', () => {
        if (audio.currentTime > 0.1) { // 0.1초 이상 재생되면 성공으로 간주
          console.log('▶️ 재생 진행 중:', `${audio.currentTime.toFixed(1)}s / ${audio.duration.toFixed(1)}s`);
        }
      });

      // 오디오 설정
      audio.preload = 'auto';
      audio.volume = 1.0;
      audio.src = dataUrl;

      console.log('⏳ 오디오 로딩 시작...');
      
      // 로드 완료까지 기다림
      await audioLoadPromise;
      
      console.log('🎯 재생 시작 시도...');
      await audio.play();
      console.log('▶️ 재생 시작 성공!');

    } catch (error) {
      console.error('💥 원본 음성 재생 실패:', error);
      setIsOriginalPlaying(false);
      onPlayAudio();
      
      // 사용자에게 알림
      alert(`음성 재생에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* 1. 교정된 텍스트 (completed 상태일 때만 표시) */}
      {recordingState === 'completed' && correctedText && (
        <div className="p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">이 문장을 말하려고 했나요?</span>
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
              isActive={isOriginalPlaying} // 원본 음성 재생 중일 때 활성화
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

        {/* 원본 발음 듣기 버튼을 이 섹션으로 이동 */}
        {recordingState === 'completed' && recordedAudioBlob && (
          <div className="mt-3 flex justify-start">
            <button 
              onClick={handleOriginalAudioPlay}
              className="flex items-center text-gray-500 text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
              disabled={!recordedAudioBlob}
            >
              <span className="flex items-center">
                <Volume2 size={16} className="mr-1 relative top-[1px]" />
              </span>
              <span className="leading-none">
                {isOriginalPlaying ? '재생 중...' : '원본 발음 듣기'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. G2PK 발음 표기 */}
      {recordingState === 'completed' && g2pkText && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">이렇게 발음해보세요(g2pk)</span>
            <div className="flex items-center h-8">
              <AudioWaveform 
                isActive={isTtsAudioPlaying} // TTS 재생 중일 때 활성화
                color="#3B82F6" 
              />
            </div>
          </div>
          <p className="text-gray-800 text-lg text-center">{g2pkText}</p>
          
          
          {/* 교정된 발음 듣기 버튼 */}
          {recordedAudioBlob && (
            <div className="mt-3 flex justify-start">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 TTS 버튼 클릭됨');
                  handleTtsPlay();
                  setHasClicked(true);
                }}
                disabled={isTtsPlaying}
                className={`flex items-center text-sm hover:text-blue-700 transition-colors ${
                  isTtsPlaying && !isTtsAudioPlaying 
                    ? 'text-gray-400' // 음성 합성 중일 때만 연한 색
                    : 'text-blue-500' // 기본 상태와 재생 중일 때는 파란색 유지
                }`}
              >
                <span className="flex items-center">
                  <Volume2 size={16} className="mr-1 relative top-[1px]" />
                </span>
                <span className="leading-none">
                  {isTtsPlaying ? (isTtsAudioPlaying ? '재생 중...' : '음성 합성 중...') : '교정된 발음 듣기'}
                </span>
              </button>
            </div>
          )}

          {/* Error message */}
          {ttsError && (
            <p className="text-red-500 text-xs mt-2">{ttsError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionCard;