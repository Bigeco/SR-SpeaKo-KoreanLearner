import { ArrowLeft, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '../../components/common/AudioRecorder';
import RecordControls from '../../components/common/RecordControls';
import { NavBar } from '../../components/layout/NavBar';
import { ScoreDisplay } from './components/ScoreDisplay';
import { SproutScore } from './components/SproutScore';
import TranscriptionCard from './components/TranscriptionCard';
import { getRomanizationAlignments } from '../../utils/romanizer_api';
import { 
  transcribeAudioWithWav2Vec2, 
  checkWav2Vec2ServerHealth,
  validateAudioFile,
  validateAudioSize,
  transcribeAudioWithSubmit,
  downloadAudioForAnalysis,
  analyzeAudioBlob
} from '../../utils/wav2vec2_api';
import './styles/start-record.css';

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const StartRecordView: React.FC = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // 전사 및 교정 텍스트
  const [transcribedText, setTranscribedText] = useState<string>(''); // Wav2Vec2 결과 (인식된 문장)
  const [correctedText, setCorrectedText] = useState<string>('');     // Web Speech API 결과 (교정된 문장)
  const [interimText, setInterimText] = useState<string>('');         // Web Speech API 중간 결과
  
  // 누적된 최종 텍스트 관리를 위한 새로운 상태
  const [accumulatedWebSpeechText, setAccumulatedWebSpeechText] = useState<string>('');
  const accumulatedWebSpeechTextRef = useRef('');
  useEffect(() => { accumulatedWebSpeechTextRef.current = accumulatedWebSpeechText; }, [accumulatedWebSpeechText]);
  
  // 발음 정확도 - 녹음 완료 시에만 설정
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // 틀린 음소들 (실제로는 AI 분석 결과에서 가져올 데이터)
  const [incorrectPhonemes, setIncorrectPhonemes] = useState<string[]>([]);
  
  // Web Speech API 관련
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // 오디오 요소 참조
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  
  // Wav2Vec2 서버 상태
  const [wav2vec2ServerReady, setWav2vec2ServerReady] = useState<boolean>(false);
  const [isProcessingWav2Vec2, setIsProcessingWav2Vec2] = useState<boolean>(false);

  // recordingState를 ref로 추적
  const recordingStateRef = useRef(recordingState);
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);
  
  // 로마자 정렬 관련
  const [romanizationAlignments, setRomanizationAlignments] = useState<{ wrong: string[], correct: string[] } | null>(null);
  
  // Web Speech API 지원 확인 및 권한 요청
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupSpeechRecognition();
      
      // 마이크 권한 미리 확인
      checkMicrophonePermission();
    } else {
      setIsSupported(false);
      console.warn('Web Speech API가 지원되지 않는 브라우저입니다.');
    }
  
    // Wav2Vec2 서버 상태 확인
    checkWav2Vec2ServerHealth()
      .then(setWav2vec2ServerReady)
      .catch(() => setWav2vec2ServerReady(false));
  }, []);
  
  // 마이크 권한 확인
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 스트림 즉시 정지
      setMicPermission('granted');
    } catch (error) {
      console.log('마이크 권한이 거부되었거나 사용할 수 없습니다.');
      setMicPermission('denied');
    }
  };
  
  // Speech Recognition 설정
  const setupSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    
    const recognition = recognitionRef.current;
    
    // 기본 설정
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR'; // 한국어 설정
    
    // 음성 인식 시작
    recognition.onstart = () => {
      console.log('음성 인식이 시작되었습니다.');
    };
    
    // 음성 인식 결과
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // 녹음이 중지된 상태면 결과 처리하지 않음
      if (recordingStateRef.current !== 'recording') {
        console.log('녹음 중지 상태이므로 음성 인식 결과 무시');
        return;
      }
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      console.log('Web Speech API 결과 받음:', event.results.length);
      
      // 모든 결과 처리
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(`결과 ${i}: "${transcript}", isFinal: ${event.results[i].isFinal}`);
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // 최종 결과가 있을 때 누적 (녹음 중일 때만)
      if (finalTranscript && recordingStateRef.current === 'recording') {
        console.log('Web Speech API 최종 텍스트 (교정된 문장):', `"${finalTranscript}"`);
        
        // 기존 누적 텍스트에 새로운 최종 텍스트 추가
        setAccumulatedWebSpeechText(prev => {
          const newAccumulated = prev ? `${prev} ${finalTranscript}`.trim() : finalTranscript;
          console.log('누적된 Web Speech API 텍스트:', `"${newAccumulated}"`);
          return newAccumulated;
        });
      }
      
      // 중간 결과 업데이트 (실시간 표시용, 녹음 중일 때만)
      if (interimTranscript && recordingStateRef.current === 'recording') {
        console.log('중간 결과 업데이트:', `"${interimTranscript}"`);
        setInterimText(interimTranscript);
      }
    };
    
    // 음성 인식 종료
    recognition.onend = () => {
      console.log('음성 인식이 종료되었습니다.');
      if (recordingStateRef.current === 'recording') {
        // 자동으로 다시 시작 (continuous를 위해)
        try {
          recognition.start();
        } catch (error) {
          console.log('음성 인식 재시작 중 오류:', error);
        }
      }
    };
    
    // 오류 처리
    recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error);
      if (event.error === 'not-allowed') {
        alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      }
    };
  };
  
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
  
  // 텍스트 정규화 함수 (구두점 제거 및 공백 정리)
  const normalizeText = (text: string): string => {
    return text
      .replace(/[.,!?;:]/g, '') // 구두점 제거
      .replace(/\s+/g, ' ')     // 연속 공백을 하나로
      .trim();                  // 앞뒤 공백 제거 (toLowerCase 제거)
  };
  
  // 텍스트 전처리
  const preprocessText = (
    text: string,
    removeSpaces = true,
    removePunctuation = true
  ): string => {
    if (removePunctuation) {
      text = text.replace(/[^\w\sㄱ-ㅎ가-힣]/g, ''); // 문장부호 제거
    }
    if (removeSpaces) {
      text = text.replace(/\s+/g, '');
    }
    return text;
  };

  // 레벤슈타인 거리 계산
  const calculateLevenshtein = (
    u: string[],
    v: string[]
  ): { distance: number; substitutions: number; deletions: number; insertions: number } => {
    const prev: number[] = Array(v.length + 1)
      .fill(0)
      .map((_, i) => i);
    const prevOps: [number, number, number][] = Array(v.length + 1)
      .fill(0)
      .map((_, i) => [0, 0, i]);

    let curr: number[] = [];
    let currOps: [number, number, number][] = [];

    for (let x = 1; x <= u.length; x++) {
      curr = [x, ...Array(v.length).fill(0)];
      currOps = [[0, x, 0], ...Array(v.length).fill([0, 0, 0])];

      for (let y = 1; y <= v.length; y++) {
        const delCost = prev[y] + 1;
        const addCost = curr[y - 1] + 1;
        const subCost = prev[y - 1] + (u[x - 1] !== v[y - 1] ? 1 : 0);

        curr[y] = Math.min(subCost, delCost, addCost);

        if (curr[y] === subCost) {
          const [s, d, i] = prevOps[y - 1];
          currOps[y] = [s + (u[x - 1] !== v[y - 1] ? 1 : 0), d, i];
        } else if (curr[y] === delCost) {
          const [s, d, i] = prevOps[y];
          currOps[y] = [s, d + 1, i];
        } else {
          const [s, d, i] = currOps[y - 1];
          currOps[y] = [s, d, i + 1];
        }
      }

      for (let i = 0; i < curr.length; i++) {
        prev[i] = curr[i];
        prevOps[i] = currOps[i];
      }
    }

    const [substitutions, deletions, insertions] = currOps[v.length];
    return {
      distance: curr[v.length],
      substitutions,
      deletions,
      insertions
    };
  };

  // 정확도(CRR) 계산 함수
  const calculateAccuracy = (
    original: string,
    corrected: string,
    removeSpaces = true,
    removePunctuation = true
  ): number => {
    console.log('=== 정확도(CRR) 계산 시작 ===');
    console.log('원본:', original);
    console.log('교정:', corrected);

    if (!original || !corrected || original.trim() === '' || corrected.trim() === '') {
      console.log('❌ 입력이 비어 있음');
      return 0;
    }

    const ref = preprocessText(original, removeSpaces, removePunctuation);
    const hyp = preprocessText(corrected, removeSpaces, removePunctuation);

    if (!ref || !hyp) {
      console.log('❌ 정규화 후 비어 있음');
      return 0;
    }

    const refChars = ref.split('');
    const hypChars = hyp.split('');

    const { substitutions, deletions, insertions } = calculateLevenshtein(hypChars, refChars);

    const hits = refChars.length - (substitutions + deletions);
    const total = substitutions + deletions + insertions + hits;

    const cer = total > 0 ? (substitutions + deletions + insertions) / total : 0;
    const crr = Math.max(0, Math.min(1 - cer, 1));

    const finalResult = Math.round(crr * 1000) / 10; // 소수점 1자리까지 (%)
    console.log('📊 결과:', {
      substitutions,
      deletions,
      insertions,
      crr: `${finalResult}%`
    });

    return finalResult;
  };

  
  const processAudioWithWav2Vec2 = async (audioBlob: Blob) => {
    console.log('🎤 Wav2Vec2 처리 시작:', { size: audioBlob.size, type: audioBlob.type });
    
    try {
      setIsProcessingWav2Vec2(true);
      
      // 디버깅: 오디오 분석
      await analyzeAudioBlob(audioBlob);
      
      // 디버깅: 파일 다운로드 (비교용)
      await downloadAudioForAnalysis(audioBlob, 'app-recording.wav');
      
      // 파일 검증
      if (!validateAudioFile(audioBlob)) {
        throw new Error('지원되지 않는 오디오 형식입니다.');
      }
      
      if (!validateAudioSize(audioBlob, 10)) {
        throw new Error('오디오 파일이 너무 큽니다. (최대 10MB)');
      }
      
      // 일반 API 방식 테스트
      console.log('📱 앱 방식 (/transcribe) 테스트 중...');
      const result = await transcribeAudioWithWav2Vec2(audioBlob, 'recording.wav');
      
      // 웹 UI 방식도 테스트 (비교용)
      console.log('🌐 웹 UI 방식 (/submit) 테스트 중...');
      try {
        const webResult = await transcribeAudioWithSubmit(audioBlob, 'recording.wav');
        console.log('🔄 결과 비교:', {
          앱결과: result.transcription,
          웹결과: webResult.transcription,
          동일함: result.transcription === webResult.transcription
        });
      } catch (webError) {
        console.warn('웹 UI 방식 테스트 실패:', webError);
      }
      
      setTranscribedText(result.transcription);
      return result.transcription;
      
    } catch (error) {
      console.error('Wav2Vec2 처리 오류:', error);
      
      // 기존 fallback 로직...
      const fallbackText = accumulatedWebSpeechTextRef.current || interimText;
      if (fallbackText) {
        console.log('Wav2Vec2 실패, Web Speech API 결과로 fallback:', fallbackText);
        setTranscribedText(fallbackText);
        return fallbackText;
      } else {
        const testText = "수학을 배오고 있어요";
        console.log('완전 실패, 테스트 데이터 사용:', testText);
        setTranscribedText(testText);
        return testText;
      }
    } finally {
      setIsProcessingWav2Vec2(false);
    }
  };

  // 틀린 음소 분석 (시뮬레이션 - 실제로는 AI가 분석)
  const analyzeIncorrectPhonemes = (original: string, corrected: string): string[] => {
    const incorrectPhonemes: string[] = [];
    
    // 간단한 단어별 비교
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    for (let i = 0; i < originalWords.length; i++) {
      if (originalWords[i] !== correctedWords[i]) {
        // 예시: '배오고' vs '배우고' -> 'ㅗ' vs 'ㅜ' 차이
        if (originalWords[i]?.includes('배오고') && correctedWords[i]?.includes('배우고')) {
          incorrectPhonemes.push('ㅗ', 'ㅜ');
        }
        // 예시: '있서요' vs '있어요' -> 'ㅅ' vs 'ㅇ' 차이  
        if (originalWords[i]?.includes('있서요') && correctedWords[i]?.includes('있어요')) {
          incorrectPhonemes.push('ㅅ', 'ㅇ');
        }
      }
    }
    
    // 중복 제거 및 기본값
    const uniquePhonemes = [...new Set(incorrectPhonemes)];
    return uniquePhonemes.length > 0 ? uniquePhonemes : ['ㄱ', 'ㅓ', 'ㄹ'];
  };
  
  // 녹음 시작/중지 처리
  const handleRecordingToggle = async (isRecording: boolean) => {
    if (!isSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome, Safari, Edge를 사용해주세요.');
      return;
    }
    
    if (isRecording) {
      // 마이크 권한이 거부된 경우 다시 요청
      if (micPermission === 'denied') {
        await checkMicrophonePermission();
        if (micPermission === 'denied') {
          alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
          return;
        }
      }
      
      // 녹음 시작 - 모든 상태 초기화
      setRecordingState('recording');
      setTranscribedText('');
      setAccumulatedWebSpeechText('');
      setCorrectedText('');
      setInterimText('');
      setAccuracy(null);
      setIncorrectPhonemes([]);
      setRecordedAudioBlob(null);
      
      // Web Speech API 시작
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('음성 인식 시작 오류:', error);
      }
    } else {
      // 녹음 중지
      console.log('녹음 중지 시작 - 상태 변경');
      setRecordingState('completed'); // 먼저 상태 변경하여 추가 onresult 이벤트 차단
      
      recognitionRef.current?.stop();
      
      // 더 긴 지연으로 Web Speech API 최종 결과 대기
      setTimeout(async () => {
        // Web Speech API 최종 결과를 교정된 문장으로 설정
        const webSpeechResult = accumulatedWebSpeechTextRef.current || interimText;
        
        console.log('녹음 중지 후 Web Speech API 결과 (교정된 문장):', `"${webSpeechResult}"`);
        
        if (webSpeechResult) {
          setCorrectedText(webSpeechResult);
        }
        
        // Wav2Vec2로 최종 인식 처리 (녹음된 오디오 있는 경우)
        if (recordedAudioBlob) {
          console.log('녹음된 오디오로 Wav2Vec2 처리 시작');
          const wav2vecResult = await processAudioWithWav2Vec2(recordedAudioBlob);
          
          // 정확도 계산 (Wav2Vec2 결과 vs Web Speech API 결과)
          const finalCorrectedText = webSpeechResult || "수학을 배우고 있어요"; // fallback
          const finalAccuracy = calculateAccuracy(wav2vecResult, finalCorrectedText);
          
          setAccuracy(finalAccuracy);
          setIncorrectPhonemes(analyzeIncorrectPhonemes(wav2vecResult, finalCorrectedText));
        } else {
          console.warn('녹음된 오디오 없음, Wav2Vec2 처리 스킵');
          
          // Wav2Vec2 처리 없이 Web Speech API 결과만으로 처리
          if (webSpeechResult) {
            setTranscribedText(webSpeechResult); // 임시로 동일하게 설정
            setAccuracy(100); // Web Speech API 결과가 정답이므로 100%
          }
        }
        
        setInterimText(''); // 중간 텍스트 제거
      }, 1000);
    }
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
    const originalText = transcribedText;
    const correctionText = correctedText;
    
    if (!originalText || !correctionText) return null;
    
    const transcribedWords = originalText.trim().split(/\s+/);
    const correctedWords = correctionText.trim().split(/\s+/);
    
    return (
      <div className="mt-3 pt-3 border-t border-green-100">
        <p className="text-sm text-gray-600">교정된 부분:</p>
        <div className="mt-1 text-sm">
          {transcribedWords.map((word, idx) => {
            const correctedWord = correctedWords[idx];
            const isChanged = word !== correctedWord;
            
            return (
              <span key={idx} className="inline-block mr-2">
                <span className={isChanged ? 'line-through text-red-500' : ''}>
                  {word}
                </span>
                {isChanged && correctedWord && (
                  <span className="inline-block ml-1 text-green-500">
                    → {correctedWord}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // 현재 표시할 텍스트 (녹음 중: 누적된 최종 텍스트 + 중간 텍스트, 완료: 최종 텍스트)
  const getCurrentDisplayText = () => {
    if (recordingState === 'recording') {
      // 녹음 중일 때: 누적된 최종 텍스트 + 현재 중간 텍스트
      const baseText = accumulatedWebSpeechText;
      const currentText = interimText;
      return baseText && currentText ? `${baseText} ${currentText}` : (baseText || currentText);
    }
    // 완료 상태일 때: transcribedText 사용
    return transcribedText;
  };

  // Add toggleHelp handler
  const toggleHelp = () => setShowHelp((prev) => !prev);

  // recordingState가 completed가 되고, transcribedText와 correctedText가 모두 있을 때 로마자 정렬 호출
  useEffect(() => {
    if (
      recordingState === 'completed' &&
      transcribedText &&
      correctedText
    ) {
      // 비동기 호출
      getRomanizationAlignments(transcribedText, correctedText)
        .then(setRomanizationAlignments)
        .catch(() => setRomanizationAlignments(null));
    } else {
      setRomanizationAlignments(null);
    }
  }, [recordingState, transcribedText, correctedText]);

  return (
    <div className="start-record-container">
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

      {/* Web Speech API 지원 확인 알림 */}
      {!isSupported && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                이 브라우저는 음성 인식을 지원하지 않습니다. 
                Chrome, Safari, Edge 브라우저를 사용해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

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

          {/* Wav2Vec2 처리 중 알림 */}
          {isProcessingWav2Vec2 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    🎤 Wav2Vec2로 음성을 분석하고 있습니다...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 전사 결과 카드 */}
          <TranscriptionCard
            recordingState={recordingState}
            transcribedText={getCurrentDisplayText()}
            correctedText={correctedText}
            isPlaying={isPlaying}
            onPlayAudio={togglePlayback}
            renderHighlightedCorrections={renderHighlightedCorrections}
            wrongRomanizations={romanizationAlignments?.wrong}
            correctRomanizations={romanizationAlignments?.correct}
          />
          
          {/* 추가 안내 (idle 상태일 때) */}
          {recordingState === 'idle' && (
            <div className="bg-blue-50 rounded-lg p-4 text-center text-sm text-blue-700">
              <p>자연스럽게 한국어로 말해보세요. 발음이 자동으로 교정됩니다.</p>
              <p className="mt-2">예시: "안녕하세요", "날씨가 좋네요", "한국어 공부가 재미있어요" 등</p>
              {!isSupported && (
                <p className="mt-2 text-red-600">
                  ⚠️ 현재 브라우저에서는 음성 인식이 지원되지 않습니다.
                </p>
              )}
              {!wav2vec2ServerReady && (
                <p className="mt-2 text-orange-600">
                  ⚠️ Wav2Vec2 서버에 연결할 수 없어 Web Speech API만 사용됩니다.
                </p>
              )}
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
          onRecordingComplete={(audioUrl, audioBlob) => {
            console.log('녹음 완료:', { audioUrl, audioBlobSize: audioBlob?.size });
            if (audioBlob) {
              setRecordedAudioBlob(audioBlob);
            }
          }}
          autoDownload={false} // 자동 다운로드 비활성화
          fileName="start-recording.wav"
        >
          {({ isRecording, startRecording, stopRecording }) => (
            <RecordControls
              isRecording={isRecording}
              showHelp={showHelp}
              onToggleRecording={async () => {
                await handleRecordingToggle(!isRecording);
                if (isRecording) {
                  stopRecording();
                } else {
                  // AudioRecorder는 권한이 이미 있을 때만 시작
                  if (micPermission === 'granted') {
                    startRecording();
                  }
                }
              }}
              onToggleHelp={toggleHelp}
              disabled={!isSupported || micPermission === 'denied'} // 권한 거부 시 비활성화
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