import { ArrowLeft, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '../../components/common/AudioRecorder';
import RecordControls from '../../components/common/RecordControls';
import { NavBar } from '../../components/layout/NavBar';
import { ScoreDisplay } from './components/ScoreDisplay';
import { SproutScore } from './components/SproutScore';
import TranscriptionCard from './components/TranscriptionCard';
import './styles/start-record.css';

const StartRecordView: React.FC = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // 전사 및 교정 텍스트
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [correctedText, setCorrectedText] = useState<string>('');
  
  // 발음 정확도 - 녹음 완료 시에만 설정
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // 틀린 음소들 (실제로는 AI 분석 결과에서 가져올 데이터)
  const [incorrectPhonemes, setIncorrectPhonemes] = useState<string[]>([]);
  
  // 오디오 요소 참조
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // recordingState를 ref로 추적
  const recordingStateRef = useRef(recordingState);
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);
  
  // 시뮬레이션 interval을 ref로 저장
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // 마지막 인덱스 추적
  const lastIndexRef = useRef(0);
  
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
    // 실제 구현에서는 더 정교한 알고리즘 사용 가능
    // 여기서는 간단히 단어 단위 비교
    
    if (!original || !corrected) return 0;
    
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    // 최소 길이 확인
    const minLength = Math.min(originalWords.length, correctedWords.length);
    if (minLength === 0) return 0;
    
    // 일치하는 단어 수 계산
    let matchCount = 0;
    for (let i = 0; i < minLength; i++) {
      if (originalWords[i] === correctedWords[i]) {
        matchCount++;
      }
    }
    
    // 정확도 계산 (퍼센트)
    const accuracyValue = (matchCount / minLength) * 100;
    
    // 소수점 한 자리까지 반올림
    return Math.round(accuracyValue * 10) / 10;
  };
  
  // 틀린 음소 분석 (시뮬레이션 - 실제로는 AI가 분석)
  const analyzeIncorrectPhonemes = (original: string, corrected: string): string[] => {
    // 실제 구현에서는 더 정교한 음성학적 분석이 필요
    // 여기서는 간단한 예시로 시뮬레이션
    
    /*
    const phonemeMap: { [key: string]: string[] } = {
      '배오고': ['ㅂ', 'ㅐ', 'ㅇ', 'ㅗ', 'ㄱ', 'ㅗ'],
      '배우고': ['ㅂ', 'ㅐ', 'ㅇ', 'ㅜ', 'ㄱ', 'ㅗ'],
      '있서요': ['ㅇ', 'ㅣ', 'ㅅ', 'ㅅ', 'ㅓ', 'ㅇ', 'ㅛ'],
      '있어요': ['ㅇ', 'ㅣ', 'ㅅ', 'ㅅ', 'ㅓ', 'ㅇ', 'ㅛ']
    };
    */
   
    const incorrectPhonemes: string[] = [];
    
    // 간단한 단어별 비교
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    for (let i = 0; i < originalWords.length; i++) {
      if (originalWords[i] !== correctedWords[i]) {
        // 예시: '배오고' vs '배우고' -> 'ㅗ' vs 'ㅜ' 차이
        if (originalWords[i] === '배오고' && correctedWords[i] === '배우고') {
          incorrectPhonemes.push('ㅗ', 'ㅜ');
        }
        // 예시: '있서요' vs '있어요' -> 'ㅅ' vs 'ㅇ' 차이  
        if (originalWords[i] === '있서요' && correctedWords[i] === '있어요') {
          incorrectPhonemes.push('ㅅ', 'ㅇ');
        }
      }
    }
    
    // 중복 제거 및 기본값
    const uniquePhonemes = [...new Set(incorrectPhonemes)];
    return uniquePhonemes.length > 0 ? uniquePhonemes : ['ㄱ', 'ㅓ', 'ㄹ'];
  };
  
  // 녹음 시작/중지 처리
  const handleRecordingToggle = (isRecording: boolean) => {
    if (isRecording) {
      setRecordingState('recording');
      setTranscribedText('');
      setCorrectedText('');
      setAccuracy(null);
      setIncorrectPhonemes([]);
      simulateRealTimeTranscription();
    } else {
      // 녹음 중지 처리: 시뮬레이션 interval을 멈추고, 그 시점의 텍스트로 결과 화면을 띄움
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      // 마지막 인덱스의 텍스트로 결과 설정
      const transcriptionSteps = [
        '저는',
        '저는 한국어를',
        '저는 한국어를 배',
        '저는 한국어를 배오고',
        '저는 한국어를 배오고 있',
        '저는 한국어를 배오고 있서요.',
        '저는 한국어를 배오고 있서요. 발음이',
        '저는 한국어를 배오고 있서요. 발음이 정확한지',
        '저는 한국어를 배오고 있서요. 발음이 정확한지 확인하고',
        '저는 한국어를 배오고 있서요. 발음이 정확한지 확인하고 싶습니다.'
      ];
      const correctionSteps = [
        '저는',
        '저는 한국어를',
        '저는 한국어를 배',
        '저는 한국어를 배우고',
        '저는 한국어를 배우고 있',
        '저는 한국어를 배우고 있어요.',
        '저는 한국어를 배우고 있어요. 발음이',
        '저는 한국어를 배우고 있어요. 발음이 정확한지',
        '저는 한국어를 배우고 있어요. 발음이 정확한지 확인하고',
        '저는 한국어를 배우고 있어요. 발음이 정확한지 확인하고 싶습니다.'
      ];
      const idx = lastIndexRef.current > 0 ? lastIndexRef.current - 1 : 0;
      const finalTranscribed = transcriptionSteps[idx];
      const finalCorrected = correctionSteps[idx];
      
      setTranscribedText(finalTranscribed);
      setCorrectedText(finalCorrected);
      setAccuracy(calculateAccuracy(finalTranscribed, finalCorrected));
      setIncorrectPhonemes(analyzeIncorrectPhonemes(finalTranscribed, finalCorrected));
      setRecordingState('completed');
    }
  };
  
  // 실시간 전사 시뮬레이션 (실제로는 Whisper API와 연결 필요)
  const simulateRealTimeTranscription = () => {
    const transcriptionSteps = [
      '저는',
      '저는 한국어를',
      '저는 한국어를 배',
      '저는 한국어를 배오고',
      '저는 한국어를 배오고 있',
      '저는 한국어를 배오고 있서요.',
      '저는 한국어를 배오고 있서요. 발음이',
      '저는 한국어를 배오고 있서요. 발음이 정확한지',
      '저는 한국어를 배오고 있서요. 발음이 정확한지 확인하고',
      '저는 한국어를 배오고 있서요. 발음이 정확한지 확인하고 싶습니다.'
    ];
    const correctionSteps = [
      '저는',
      '저는 한국어를',
      '저는 한국어를 배',
      '저는 한국어를 배우고',
      '저는 한국어를 배우고 있',
      '저는 한국어를 배우고 있어요.',
      '저는 한국어를 배우고 있어요. 발음이',
      '저는 한국어를 배우고 있어요. 발음이 정확한지',
      '저는 한국어를 배우고 있어요. 발음이 정확한지 확인하고',
      '저는 한국어를 배우고 있어요. 발음이 정확한지 확인하고 싶습니다.'
    ];
    let currentIndex = 0;
    lastIndexRef.current = 0;
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    simulationIntervalRef.current = setInterval(() => {
      if (recordingStateRef.current !== 'recording') {
        clearInterval(simulationIntervalRef.current!);
        simulationIntervalRef.current = null;
        return;
      }
      if (currentIndex < transcriptionSteps.length) {
        setTranscribedText(transcriptionSteps[currentIndex]);
        setCorrectedText(correctionSteps[currentIndex]);
        lastIndexRef.current = currentIndex;
        currentIndex++;
      } else {
        clearInterval(simulationIntervalRef.current!);
        simulationIntervalRef.current = null;
      }
    }, 800);
  };
  
  // 오디오 재생 토글 (실제로는 녹음된 오디오 재생)
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    // 시뮬레이션을 위해 3초 후 재생 상태 해제
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

  // Add toggleHelp handler
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
        <div className="w-5"></div>
      </div>

      {/* 메인 콘텐츠 - 하단 요소들 공간 확보를 위한 패딩 추가 */}
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
              {recordingState === 'idle' && '마이크 버튼을 누르고 자유롭게 말해보세요.'}
              {recordingState === 'recording' && '실시간으로 음성을 인식하고 있습니다.'}
              {recordingState === 'completed' && '인식된 문장과 교정된 문장을 확인하세요.'}
            </p>
            {/* 정확도 수치와 피드백 메시지 */}
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
            </div>
          )}
          
          {/* 분석된 틀린 음소 미리보기 (completed 상태일 때만) */}
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
          
          {/* 숨겨진 오디오 요소 */}
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      {/* 구강 구조 학습 버튼 - completed 상태일 때만 표시 */}
      {recordingState === 'completed' && (
        <button
          onClick={handleOralStructureView}
          className="fixed bottom-44 right-6 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all duration-200 hover:scale-110 z-20"
          title="구강 구조 학습하기"
        >
          <Plus size={20} />
        </button>
      )}

      {/* 녹음 컨트롤 - 고정 위치 */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center mb-4">
        <AudioRecorder
          onRecordingComplete={(audioUrl) => {
            handleRecordingToggle(false);
            console.log('녹음된 오디오 URL:', audioUrl);
          }}
          autoDownload={true}
          fileName="start-recording.wav"
        >
          {({ isRecording, startRecording, stopRecording }) => (
            <RecordControls
              isRecording={isRecording}
              showHelp={showHelp}
              onToggleRecording={() => {
                handleRecordingToggle(!isRecording);
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              onToggleHelp={toggleHelp}
            />
          )}
        </AudioRecorder>
      </div>

      {/* 하단 네비게이션 바 - 고정 위치 */}
      <div className="fixed bottom-0 left-0 right-0 w-full">
        <NavBar />
      </div>
    </div>
  );
};

export default StartRecordView;