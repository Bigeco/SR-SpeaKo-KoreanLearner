import { ArrowLeft, Mic, MicOff, RefreshCw, Volume2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioWaveform } from '../../components/common/AudioWavefrom';
import { NavBar } from '../../components/layout/NavBar';
import './styles/start-record.css';

const StartRecordView: React.FC = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 전사 및 교정 텍스트
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [correctedText, setCorrectedText] = useState<string>('');
  
  // 발음 정확도 - 녹음 완료 시에만 설정
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // 오디오 요소 참조
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 페이지 이벤트 핸들러
  const handleGoBack = () => navigate(-1);
  
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
  
  // 녹음 시작/중지 처리
  const toggleRecording = () => {
    if (recordingState === 'recording') {
      // 녹음 중지 처리
      setRecordingState('completed');
      
      // 실제로는 여기서 Whisper 모델의 최종 결과를 저장
      // 시뮬레이션 용도로 약간의 오타가 있는 텍스트와 교정된 텍스트 설정
      const finalTranscribed = "저는 한국어를 배오고 있서요. 발음이 정확한지 확인하고 싶습니다.";
      const finalCorrected = "저는 한국어를 배우고 있어요. 발음이 정확한지 확인하고 싶습니다.";
      
      setTranscribedText(finalTranscribed);
      setCorrectedText(finalCorrected);
      
      // 최종 정확도 계산 - 이 시점에서만 정확도 설정
      setAccuracy(87.7);
    } else {
      // 녹음 시작 처리
      setRecordingState('recording');
      setTranscribedText('');
      setCorrectedText('');
      setAccuracy(null); // 녹음 시작 시 정확도 초기화
      
      // Whisper 모델이 실시간으로 전사하는 것을 시뮬레이션
      simulateRealTimeTranscription();
    }
  };
  
  // 실시간 전사 시뮬레이션 (실제로는 Whisper API와 연결 필요)
  const simulateRealTimeTranscription = () => {
    // 시뮬레이션용 전사 데이터
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
    
    // 교정 데이터
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
    
    // 단계별로 전사 및 교정 결과 업데이트
    const interval = setInterval(() => {
      if (currentIndex < transcriptionSteps.length) {
        setTranscribedText(transcriptionSteps[currentIndex]);
        setCorrectedText(correctionSteps[currentIndex]);
        
        // 실시간 정확도 계산 부분 제거
        // 녹음 완료 시에만 정확도 표시
        
        currentIndex++;
      } else {
        clearInterval(interval);
        // 전사가 완료되면 자동으로 녹음 완료 상태로 전환
        setRecordingState('completed');
        // 최종 정확도 설정
        setAccuracy(calculateAccuracy(transcriptionSteps[transcriptionSteps.length - 1], correctionSteps[correctionSteps.length - 1]));
      }
    }, 800); // 0.8초마다 업데이트
    
    return () => clearInterval(interval);
  };
  
  // 정확도에 따른 색상 클래스 얻기
  const getAccuracyColorClass = () => {
    if (!accuracy) return 'text-gray-400';
    
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-blue-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // 정확도에 따른 메시지 얻기
  const getAccuracyMessage = () => {
    if (!accuracy) return '';
    
    if (accuracy >= 90) return '매우 정확해요!';
    if (accuracy >= 70) return '좋은 발음이에요!';
    if (accuracy >= 50) return '꾸준히 연습하세요';
    return '더 연습이 필요해요';
  };
  
  // 정확도 바의 배경색 클래스 얻기
  const getAccuracyBarColorClass = () => {
    if (!accuracy) return '';
    
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 70) return 'bg-blue-500';
    if (accuracy >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // 오디오 재생 토글 (실제로는 녹음된 오디오 재생)
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    // 시뮬레이션을 위해 3초 후 재생 상태 해제
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };
  
  // 다시 녹음하기
  const handleRerecord = () => {
    setRecordingState('idle');
    setTranscribedText('');
    setCorrectedText('');
    setAccuracy(null); // 정확도 초기화
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
          {/* 안내 텍스트 */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {recordingState === 'idle' && '당신의 발음을 확인해 보세요'}
              {recordingState === 'recording' && '말하는 중...'}
              {recordingState === 'completed' && '인식이 완료되었습니다'}
            </h2>
            <p className="text-gray-600 mb-4">
              {recordingState === 'idle' && '마이크 버튼을 누르고 자유롭게 말해보세요.'}
              {recordingState === 'recording' && '실시간으로 음성을 인식하고 있습니다.'}
              {recordingState === 'completed' && '인식된 문장과 교정된 문장을 확인하세요.'}
            </p>
          </div>

          {/* 전사 결과 카드 */}
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
                </div>
                
                <p className="text-gray-800 text-lg">{correctedText}</p>
                
                {/* 비교 표시: 잘못된 부분 하이라이트 */}
                {transcribedText !== correctedText && renderHighlightedCorrections()}

                <div className="mt-2">
                  <button 
                    onClick={togglePlayback}
                    className="flex items-center text-gray-500 text-sm"
                  >
                    <Volume2 size={16} className="mr-1" />
                    {isPlaying ? '재생 중...' : '들어보기'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 추가 안내 (idle 상태일 때) */}
          {recordingState === 'idle' && (
            <div className="bg-blue-50 rounded-lg p-4 text-center text-sm text-blue-700">
              <p>자연스럽게 한국어로 말해보세요. 발음이 자동으로 교정됩니다.</p>
              <p className="mt-2">예시: "안녕하세요", "날씨가 좋네요", "한국어 공부가 재미있어요" 등</p>
            </div>
          )}
          
          {/* 숨겨진 오디오 요소 */}
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      {/* 발음 정확도 표시 - 녹음 완료 상태일 때만 표시 */}
      {recordingState === 'completed' && accuracy !== null && (
        <div className="fixed bottom-16 left-0 right-0 w-full bg-white shadow-md border-t border-gray-100 py-2 px-4 z-10 result-fade-in">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div>
              <span className="text-gray-600 text-sm">발음 정확도</span>
              <div className="flex items-baseline">
                <span className={`text-2xl font-bold ${getAccuracyColorClass()} accuracy-score`}>
                  {accuracy}%
                </span>
                <span className={`ml-2 text-sm ${getAccuracyColorClass()}`}>
                  {getAccuracyMessage()}
                </span>
              </div>
            </div>
            
            {/* 정확도 바 */}
            <div className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getAccuracyBarColorClass()} transition-all duration-500 ease-out`}
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 녹음 컨트롤 - 고정 위치 */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center mb-4">
        <button 
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
            recordingState === 'recording' ? 'bg-red-500 mic-button-active' : 'bg-gradient-to-br from-blue-500 to-blue-700'
          }`} 
          onClick={toggleRecording}
          disabled={recordingState === 'completed'}
        >
          {recordingState === 'recording' ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* 작업 버튼 - 녹음 완료 상태일 때만 표시 */}
      {recordingState === 'completed' && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center">
          <button 
            onClick={handleRerecord}
            className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            다시 녹음
          </button>
        </div>
      )}

      {/* 하단 네비게이션 바 - 고정 위치 */}
      <div className="fixed bottom-0 left-0 right-0 w-full">
        <NavBar />
      </div>
    </div>
  );
};

export default StartRecordView;