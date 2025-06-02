import { ArrowLeft, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '../../components/common/AudioRecorder';
import RecordControls from '../../components/common/RecordControls';
import { NavBar } from '../../components/layout/NavBar';
import { ScoreDisplay } from './components/ScoreDisplay';
import { SproutScore } from './components/SproutScore';
import TranscriptionCard from './components/TranscriptionCard';
import { useWhisperLive } from '../../hooks/useWhisperLive'; // 새로 만든 hook
import './styles/start-record.css';

const StartRecordView: React.FC = () => {
  const navigate = useNavigate();
  
  // Whisper Live Hook 사용
  const {
    transcript: transcribedText,
    correctedText,
    isConnected,
    isRecording: whisperIsRecording,
    startRecording: startWhisperRecording,
    stopRecording: stopWhisperRecording
  } = useWhisperLive();
  
  // 상태 관리
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // 발음 정확도 - 녹음 완료 시에만 설정
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // 틀린 음소들 (실제로는 AI 분석 결과에서 가져올 데이터)
  const [incorrectPhonemes, setIncorrectPhonemes] = useState<string[]>([]);
  
  // 오디오 요소 참조
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 페이지 이벤트 핸들러
  const handleGoBack = () => navigate(-1);
  
  // 구강 구조 페이지로 이동
  const handleOralStructureView = () => {
    navigate('/oral-structure', {
      state: {
        incorrectPhonemes: incorrectPhonemes.length > 0 ? incorrectPhonemes : ['ㄱ', 'ㅓ', 'ㄹ'] // 예시 데이터
      }
    });
  };
  
  // 발음 정확도 계산 (두 텍스트 간의 유사도 기반)
  const calculateAccuracy = (original: string, corrected: string): number => {
    if (!original || !corrected) return 0;
    
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    const minLength = Math.min(originalWords.length, correctedWords.length);
    if (minLength === 0) return 0;
    
    let matchCount = 0;
    for (let i = 0; i < minLength; i++) {
      if (originalWords[i] === correctedWords[i]) {
        matchCount++;
      }
    }
    
    const accuracyValue = (matchCount / minLength) * 100;
    return Math.round(accuracyValue * 10) / 10;
  };
  
  // 틀린 음소 분석
  const analyzeIncorrectPhonemes = (original: string, corrected: string): string[] => {
    const incorrectPhonemes: string[] = [];
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    for (let i = 0; i < originalWords.length; i++) {
      if (originalWords[i] !== correctedWords[i]) {
        if (originalWords[i] === '배오고' && correctedWords[i] === '배우고') {
          incorrectPhonemes.push('ㅗ', 'ㅜ');
        }
        if (originalWords[i] === '있서요' && correctedWords[i] === '있어요') {
          incorrectPhonemes.push('ㅅ', 'ㅇ');
        }
      }
    }
    
    const uniquePhonemes = [...new Set(incorrectPhonemes)];
    return uniquePhonemes.length > 0 ? uniquePhonemes : ['ㄱ', 'ㅓ', 'ㄹ'];
  };
  
  // 녹음 시작/중지 처리 - Whisper API 연동
  const handleRecordingToggle = async (isRecording: boolean) => {
    if (isRecording) {
      setRecordingState('recording');
      setAccuracy(null);
      setIncorrectPhonemes([]);
      
      // Whisper 녹음 시작
      await startWhisperRecording();
    } else {
      // 녹음 중지
      stopWhisperRecording();
      
      // 결과 처리
      if (transcribedText && correctedText) {
        setAccuracy(calculateAccuracy(transcribedText, correctedText));
        setIncorrectPhonemes(analyzeIncorrectPhonemes(transcribedText, correctedText));
      }
      
      setRecordingState('completed');
    }
  };
  
  // 오디오 재생 토글
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };
  
  // 전사 결과에서 교정된 부분 하이라이트
  const renderHighlightedCorrections = () => {
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
                    → {correctedWords[idx]}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const toggleHelp = () => setShowHelp((prev) => !prev);

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <button 
          onClick={handleGoBack}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center font-medium">발음 확인</div>
        <div className="flex items-center">
          {/* Whisper 연결 상태 표시 */}
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div className="w-5"></div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center px-6 py-4 overflow-auto pb-44">
        <div className="w-full max-w-md">
          {/* 새싹 캐릭터 UI */}
          <div className="flex flex-col items-center mb-6 mt-9">
            <div className={`transition-all duration-500 
              ${recordingState === 'recording' ? 'opacity-60 grayscale' : 'opacity-100 grayscale-0'}`}>
              <SproutScore score={accuracy ?? 0} size={120} />
            </div>
          </div>  

          {/* 안내 텍스트 및 정확도 표시 */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {recordingState === 'idle' && '당신의 발음을 확인해 보세요'}
              {recordingState === 'recording' && '말하는 중...'}
              {recordingState === 'completed' && '인식이 완료되었습니다'}
            </h2>
            <p className="text-gray-600 mb-2">
              {recordingState === 'idle' && (isConnected ? '마이크 버튼을 누르고 자유롭게 말해보세요.' : 'Whisper 서버에 연결 중...')}
              {recordingState === 'recording' && '실시간으로 음성을 인식하고 있습니다.'}
              {recordingState === 'completed' && '인식된 문장과 교정된 문장을 확인하세요.'}
            </p>
            {recordingState === 'completed' && accuracy !== null && (
              <ScoreDisplay score={accuracy} />
            )}
          </div>

          {/* 전사 결과 카드 */}
          <TranscriptionCard
            recordingState={recordingState}
            transcribedText={transcribedText}
            correctedText={correctedText}
            isPlaying={isPlaying}
            onPlayAudio={togglePlayback}
            renderHighlightedCorrections={renderHighlightedCorrections}
          />
          
          {/* 추가 안내 (idle 상태일 때) */}
          {recordingState === 'idle' && (
            <div className="bg-blue-50 rounded-lg p-4 text-center text-sm text-blue-700">
              <p>자연스럽게 한국어로 말해보세요. 발음이 자동으로 교정됩니다.</p>
              <p className="mt-2">예시: "안녕하세요", "날씨가 좋네요", "한국어 공부가 재미있어요" 등</p>
              {!isConnected && (
                <p className="mt-2 text-orange-600">⚠️ 서버 연결 중입니다...</p>
              )}
            </div>
          )}
          
          {/* 분석된 틀린 음소 미리보기 */}
          {recordingState === 'completed' && incorrectPhonemes.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-semibold text-orange-700 mb-2">개선이 필요한 발음</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {incorrectPhonemes.map((phoneme, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-orange-200 text-orange-800 px-2 py-1 rounded text-sm font-medium"
                  >
                    {phoneme}
                  </span>
                ))}
              </div>
              <p className="text-orange-600 text-xs">
                구강 구조 학습을 통해 정확한 발음법을 익혀보세요!
              </p>
            </div>
          )}
          
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      {/* 구강 구조 학습 버튼 */}
      {recordingState === 'completed' && (
        <button
          onClick={handleOralStructureView}
          className="fixed bottom-44 right-6 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all duration-200 hover:scale-110 z-20"
          title="구강 구조 학습하기"
        >
          <Plus size={20} />
        </button>
      )}

      {/* 녹음 컨트롤 */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center mb-4">
        <AudioRecorder
          onRecordingComplete={(audioUrl) => {
            handleRecordingToggle(false);
            console.log('녹음된 오디오 URL:', audioUrl);
          }}
          autoDownload={false} // Whisper로 처리하므로 자동 다운로드 비활성화
          fileName="start-recording.wav"
        >
          {({ isRecording, startRecording, stopRecording }) => (
            <RecordControls
              isRecording={whisperIsRecording} // Whisper 녹음 상태 사용
              showHelp={showHelp}
              onToggleRecording={() => {
                handleRecordingToggle(!whisperIsRecording);
                // AudioRecorder는 내부적으로만 사용 (파일 저장용)
                if (whisperIsRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              onToggleHelp={toggleHelp}
              disabled={!isConnected} // 연결되지 않으면 비활성화
            />
          )}
        </AudioRecorder>
      </div>

      {/* 하단 네비게이션 바 */}
      <div className="fixed bottom-0 left-0 right-0 w-full">
        <NavBar />
      </div>
    </div>
  );
};

export default StartRecordView;