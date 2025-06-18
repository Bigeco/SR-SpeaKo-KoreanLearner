import { ArrowLeft, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '../../components/common/AudioRecorder';
import RecordControls from '../../components/common/RecordControls';
import { NavBar } from '../../components/layout/NavBar';
import { convertToG2pk } from '../../utils/g2pk_api';
import { analyzeIncorrectPhonemes } from '../../utils/phoneme_analysis';
import { getRomanizationAlignments } from '../../utils/romanizer_api';
import {
  analyzeAudioBlob,
  checkWav2Vec2ServerHealth,
  transcribeAudioWithSubmit,
  transcribeAudioWithWav2Vec2,
  validateAudioFile,
  validateAudioSize
} from '../../utils/wav2vec2_api';
import { ScoreDisplay } from './components/ScoreDisplay';
import { SproutScore } from './components/SproutScore';
import TranscriptionCard from './components/TranscriptionCard';
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
  // Add this line near the top with other refs
  const audioRef = useRef<HTMLAudioElement>(null);

  // @ts-ignore
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const navigate = useNavigate();
  
  // 상태 관리
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'completed'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // const romanizationProcessedRef = useRef(false);
  
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
  
  // 틀린 음소들 - 실제 분석 결과로 설정
  const [incorrectPhonemes, setIncorrectPhonemes] = useState<string[]>([]);
  
  // Web Speech API 관련
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Wav2Vec2 서버 상태
  const [wav2vec2ServerReady, setWav2vec2ServerReady] = useState<boolean>(false);
  const [isProcessingWav2Vec2, setIsProcessingWav2Vec2] = useState<boolean>(false);

  // recordingState를 ref로 추적
  const recordingStateRef = useRef(recordingState);
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);
  
  // 로마자 정렬 관련
  const [romanizationAlignments, setRomanizationAlignments] = useState<{ wrong: string[], correct: string[] } | null>(null);
  
  // G2PK 변환 결과 상태 추가
  const [g2pkText, setG2pkText] = useState<string>(''); // g2pk 상태 추가

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
    // 문장부호 제거 함수 추가
    const removePunctuation = (text: string): string => {
      return text.replace(/[^\w\s가-힣]/g, '');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (recordingStateRef.current !== 'recording') {
        console.log('녹음 중지 상태이므로 음성 인식 결과 무시');
        return;
      }

      // 가장 최신의 결과만 사용
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult) return;

      // 현재 말하고 있는 내용에서 문장부호 제거
      const currentTranscript = removePunctuation(lastResult[0].transcript);

      if (lastResult.isFinal) {
        // 최종 결과인 경우: 누적
        console.log('최종 결과 추가:', currentTranscript);
        setAccumulatedWebSpeechText(prev => {
          // 이전 텍스트가 있으면 공백을 추가하여 연결
          return prev ? `${prev} ${currentTranscript}` : currentTranscript;
        });
        setInterimText(''); // 중간 결과 초기화
      } else {
        // 중간 결과인 경우: 현재 말하고 있는 부분만 보여주기
        console.log('중간 결과 업데이트:', currentTranscript);
        setInterimText(currentTranscript);
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
        incorrectPhonemes: incorrectPhonemes.length > 0 ? incorrectPhonemes : []
      }
    });
  };
  
  // 발음 정확도 계산
  // 텍스트 전처리 함수
  const preprocessText = (text: string | undefined | null, removeSpaces = true, removePunctuation = true): string => {
    // null, undefined, 빈 문자열 체크
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    let result = text.trim();
    
    if (removePunctuation) {
      result = result.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g, ''); // 한글, 영어, 숫자 제외
    }
    
    if (removeSpaces) {
      result = result.replace(/\s+/g, '');
    }
    
    return result;
  };

  // 안전한 레벤슈타인 거리 계산 함수
  const calculateLevenshtein = (u: string[], v: string[]): {
    distance: number;
    substitutions: number;
    deletions: number;
    insertions: number;
  } => {
    // 입력 배열 유효성 검사
    if (!Array.isArray(u) || !Array.isArray(v)) {
      console.error('calculateLevenshtein: 입력이 배열이 아닙니다', { u, v });
      return { distance: 0, substitutions: 0, deletions: 0, insertions: 0 };
    }

    // 빈 배열 처리
    if (u.length === 0 && v.length === 0) {
      return { distance: 0, substitutions: 0, deletions: 0, insertions: 0 };
    }
    if (u.length === 0) {
      return { distance: v.length, substitutions: 0, deletions: 0, insertions: v.length };
    }
    if (v.length === 0) {
      return { distance: u.length, substitutions: 0, deletions: u.length, insertions: 0 };
    }

    const prev: number[] = Array(v.length + 1).fill(0).map((_, i) => i);
    let curr: number[] = new Array(v.length + 1);
    const prevOps: [number, number, number][] = Array(v.length + 1).fill(null).map((_, i) => [0, 0, i]);
    let currOps: [number, number, number][] = new Array(v.length + 1);

    for (let x = 1; x <= u.length; x++) {
      curr[0] = x;
      currOps[0] = [0, x, 0];
      
      for (let y = 1; y <= v.length; y++) {
        const delCost = prev[y] + 1;
        const insCost = curr[y - 1] + 1;
        const subCost = prev[y - 1] + (u[x - 1] !== v[y - 1] ? 1 : 0);

        if (subCost <= delCost && subCost <= insCost) {
          curr[y] = subCost;
          const [s, d, i] = prevOps[y - 1];
          currOps[y] = [s + (u[x - 1] !== v[y - 1] ? 1 : 0), d, i];
        } else if (delCost < insCost) {
          curr[y] = delCost;
          const [s, d, i] = prevOps[y];
          currOps[y] = [s, d + 1, i];
        } else {
          curr[y] = insCost;
          const [s, d, i] = currOps[y - 1];
          currOps[y] = [s, d, i + 1];
        }
      }
      
      // 배열 복사
      for (let i = 0; i <= v.length; i++) {
        prev[i] = curr[i];
        prevOps[i] = [...currOps[i]]; // 깊은 복사
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

  // 안전한 정확도 계산 함수
  const calculateAccuracyScore = (
    recognizedText: string | undefined | null,
    correctedText: string | undefined | null
  ): number => {
    console.log('정확도 계산 시작:', { recognizedText, correctedText });
    
    // 입력값 유효성 검사
    if (!recognizedText || !correctedText) {
      console.warn('정확도 계산: 입력 텍스트가 없습니다');
      return 0;
    }

    try {
      const hyp = preprocessText(recognizedText, true, true);
      const ref = preprocessText(correctedText, true, true);
      
      console.log('전처리 결과:', { hyp, ref });

      if (!hyp || !ref) {
        console.warn('정확도 계산: 전처리 후 텍스트가 비어있습니다');
        return 0;
      }

      const hypChars = Array.from(hyp);
      const refChars = Array.from(ref);
      
      console.log('문자 배열:', { hypChars, refChars });

      if (!Array.isArray(hypChars) || !Array.isArray(refChars)) {
        console.error('정확도 계산: Array.from() 실패');
        return 0;
      }

      const { substitutions, deletions, insertions } = calculateLevenshtein(hypChars, refChars);
      const hits = refChars.length - substitutions - deletions;
      const total = substitutions + deletions + insertions + hits;

      console.log('레벤슈타인 결과:', { substitutions, deletions, insertions, hits, total });

      if (total === 0) {
        return 100;
      }

      const cer = (substitutions + deletions + insertions) / total;
      const crr = 1 - cer;
      const accuracy = Math.max(0, Math.min(100, Math.round(crr * 100)));
      
      console.log('최종 정확도:', accuracy);
      return accuracy;
      
    } catch (error) {
      console.error('정확도 계산 중 오류:', error);
      return 0;
    }
  };
  
  const processAudioWithWav2Vec2 = async (audioBlob: Blob) => {
    console.log('🎤 Wav2Vec2 처리 시작:', { size: audioBlob.size, type: audioBlob.type });
    
    try {
      setIsProcessingWav2Vec2(true);
      
      // 디버깅: 오디오 분석
      await analyzeAudioBlob(audioBlob);
      
      // 디버깅: 파일 다운로드 (비교용)
      //await downloadAudioForAnalysis(audioBlob, 'app-recording.wav');
      
      // 파일 검증
      if (!validateAudioFile(audioBlob)) {
        throw new Error('지원되지 않는 오디오 형식입니다.');
      }
      
      if (!validateAudioSize(audioBlob, 10)) {
        throw new Error('오디오 파일이 너무 큽니다. (최대 10MB)');
      }
      
      // 일반 API 방식 테스트
      console.log('앱 방식 (/transcribe) 테스트 중...');
      const result = await transcribeAudioWithWav2Vec2(audioBlob, 'recording.wav');
      
      // 웹 UI 방식도 테스트 (비교용)
      console.log('웹 UI 방식 (/submit) 테스트 중...');
      try {
        const webResult = await transcribeAudioWithSubmit(audioBlob, 'recording.wav');
        console.log('결과 비교:', {
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
        console.log('완전 실패, 빈 텍스트 반환');
        setTranscribedText('');
        return '';
      }
    } finally {
      setIsProcessingWav2Vec2(false);
    }
  };

  // 녹음 시작/중지 처리
  const handleRecordingToggle = async (isRecording: boolean) => {
    if (!isSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    
    if (isRecording) {
      // 녹음 시작 - 상태 초기화
      console.log('🎙️ 녹음 시작');
      setRecordingState('recording');
      setTranscribedText('');
      setAccumulatedWebSpeechText('');
      setCorrectedText('');
      setInterimText('');
      setAccuracy(null);
      setIncorrectPhonemes([]);
      setG2pkText('');
      
      try {
        recognitionRef.current?.start();
        console.log(' Web Speech API 시작됨');
      } catch (error) {
        console.error('음성 인식 시작 오류:', error);
      }
    } else {
      // 녹음 중지
      console.log('녹음 중지');
      setRecordingState('completed');
      
      try {
        recognitionRef.current?.stop();
        console.log('Web Speech API 중지됨');
        
        // 중지 후 잠시 대기하여 최종 결과 수집
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalWebSpeechResult = accumulatedWebSpeechTextRef.current || interimText;
        
        console.log('최종 Web Speech API 결과:', {
          accumulated: accumulatedWebSpeechTextRef.current,
          interim: interimText,
          final: finalWebSpeechResult
        });
        
        if (finalWebSpeechResult) {
          setCorrectedText(finalWebSpeechResult);
          
          // G2PK 변환
          try {
            const g2pkResult = await convertToG2pk(finalWebSpeechResult);
            setG2pkText(g2pkResult);
            console.log('즉시 G2PK 변환 완료:', g2pkResult);
          } catch (error) {
            console.error('즉시 G2PK 변환 실패:', error);
          }
        } else {
          console.warn('Web Speech API에서 결과를 받지 못했습니다');
        }
        
        setInterimText('');
      } catch (error) {
        console.error('음성 인식 중지 오류:', error);
      }
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

          {/* 녹음 안내 문구 - idle 상태일 때만 표시 */}
          {recordingState === 'idle' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">녹음 안내</h3>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    🔴 <strong>녹음 버튼이 빨간색으로 변하면</strong> 말씀해주세요.<br/>
                    💬 말씀 완료 후 <strong>약 3초 정도 기다린 다음</strong> 녹음 완료 버튼을 눌러주세요.<br/>
                    🎯 더 정확한 분석을 위해 <strong>명확하고 천천히</strong> 발음해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

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
            onPlayAudio={togglePlayback}
            renderHighlightedCorrections={renderHighlightedCorrections}
            wrongRomanizations={romanizationAlignments?.wrong}
            correctRomanizations={romanizationAlignments?.correct}
            g2pkText={g2pkText}
            recordedAudioBlob={recordedAudioBlob || undefined}
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
          
          {/* 분석된 틀린 음소 미리보기 (completed 상태일 때만, 그리고 음소가 있을 때만) */}
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
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleOralStructureView}
                  className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all duration-200 hover:scale-110"
                  title="구강 구조 학습하기"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}

          {/* 숨겨진 오디오 요소 */}
          <audio ref={audioRef} className="hidden" />

          {/* 녹음 컨트롤 - 컴포넌트 가장 아래로 이동 */}
          <div className="mt-8 flex justify-center">
            <AudioRecorder
              onRecordingComplete={async (audioUrl, audioBlob) => {
                console.log('🎤 새로운 녹음 완료:', { audioUrl, audioBlobSize: audioBlob?.size });
                if (audioBlob) {
                  try {
                    // 녹음된 오디오 블롭 저장
                    setRecordedAudioBlob(audioBlob);
                    console.log('💾 녹음된 오디오 블롭 저장됨:', audioBlob.size);

                    // 1. Wav2Vec2 처리 (사용자가 실제 발음한 것)
                    console.log('🎤 Wav2Vec2 처리 시작');
                    const wav2vecRaw = await processAudioWithWav2Vec2(audioBlob);
                    
                    // 2. Web Speech API 결과 가져오기
                    console.log('⏳ Web Speech API 결과 수집 중...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    let webSpeechRaw = accumulatedWebSpeechTextRef.current || interimText || '';
                    
                    if (!webSpeechRaw && wav2vecRaw) {
                      console.log('⚠️ Web Speech API 결과 없음, Wav2Vec2 결과를 교정된 문장으로 사용');
                      webSpeechRaw = wav2vecRaw;
                    }

                    // 3. 표시용 텍스트 (띄어쓰기 정규화, 문장부호 유지)
                    const normalizeSpacing = (text: string): string => {
                      return text
                        .replace(/[^\w\s가-힣]/g, '')  // 문장부호만 제거
                        .replace(/\s+/g, ' ')          // 연속 공백을 한 칸으로
                        .trim();                       // 앞뒤 공백 제거
                    };

                    const wav2vecDisplay = normalizeSpacing(wav2vecRaw);
                    const webSpeechDisplay = normalizeSpacing(webSpeechRaw);

                    const wav2vecResult = preprocessText(wav2vecRaw, true, true); // 공백 제거, 문장부호 제거
                    const webSpeechResult = preprocessText(webSpeechRaw, true, true); // 공백 제거, 문장부호 제거
                    
                    // 3. G2PK 변환
                    let correctG2pk = '';
                    let correctG2pkDis = '';
                    if (webSpeechDisplay) {
                      try {
                        console.log('🔄 G2PK 변환 시작 - 교정된 문장:', webSpeechDisplay);
                        correctG2pkDis = await convertToG2pk(webSpeechDisplay);
                        correctG2pk = preprocessText(correctG2pkDis, true, true);
                        console.log('✅ G2PK 변환 완료:', correctG2pk);
                      } catch (error) {
                        console.error('❌ G2PK 변환 실패:', error);
                        correctG2pk = webSpeechResult;
                      }
                    }
                    
                    // 4. 정확도 계산
                    let finalAccuracy = 0;
                    if (wav2vecResult && correctG2pk) {
                      if (wav2vecResult !== correctG2pk) {
                        finalAccuracy = calculateAccuracyScore(wav2vecResult, correctG2pk);
                      } else {
                        finalAccuracy = 100;
                      }
                    }
                    
                    // 5. 틀린 음소 분석
                    let analyzedPhonemes: string[] = [];
                    if (finalAccuracy < 100 && wav2vecResult && correctG2pk) {
                      analyzedPhonemes = analyzeIncorrectPhonemes(wav2vecResult, correctG2pk);
                    }
                    
                    // 6. 로마자 정렬
                    let romanizations: { wrong: string[], correct: string[] } | null = null;
                    if (wav2vecDisplay && correctG2pkDis && wav2vecResult !== correctG2pk) {
                      try {
                        console.log('🔤 로마자 정렬 시작:', { wav2vecDisplay, correctG2pkDis });
                        romanizations = await getRomanizationAlignments(wav2vecDisplay, correctG2pkDis);
                        console.log('✅ 로마자 정렬 완료:', romanizations);
                      } catch (error) {
                        console.error('❌ 로마자 정렬 실패:', error);
                      }
                    }
                    
                    console.log('🎯 최종 처리 결과:', {
                      '실제발음_wav2vec': wav2vecDisplay,
                      '교정된문장_webspeech': webSpeechDisplay,
                      '교정된문장_g2pk': correctG2pkDis,
                      '정확도': finalAccuracy,
                      '틀린음소': analyzedPhonemes,
                      '로마자정렬': romanizations
                    });
                    
                    // 7. 🔥 핵심: React.startTransition으로 배치 업데이트
                    React.startTransition(() => {
                      setTranscribedText(wav2vecDisplay);
                      setCorrectedText(webSpeechDisplay);
                      setG2pkText(correctG2pkDis);
                      setAccuracy(finalAccuracy);
                      setIncorrectPhonemes(analyzedPhonemes);
                      setRomanizationAlignments(romanizations);
                    });
                    
                    console.log('✅ 모든 상태 업데이트 완료 (배치 처리)');
                    
                  } catch (error) {
                    console.error('💥 전체 처리 실패:', error);
                  }
                }
              }}
              autoDownload={false}
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
        </div>
      </div>

      {/* 하단 네비게이션 바 - 고정 위치 */}
      <div className="fixed bottom-0 left-0 right-0 w-full">
        <NavBar />
      </div>
    </div>
  );
};

export default StartRecordView;