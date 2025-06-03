// useWebSpeech.ts
import { useCallback, useRef, useState, useEffect } from 'react';

interface WebSpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export const useWebSpeech = () => {
  const [transcript, setTranscript] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // 브라우저 지원 확인
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // 텍스트 교정 함수
  const correctText = useCallback((text: string): string => {
    return text
      .replace(/배오고/g, '배우고')
      .replace(/있서요/g, '있어요')
      .replace(/머거요/g, '먹어요')
      .replace(/가르키다/g, '가리키다')
      .replace(/너와서/g, '어서와')
      .replace(/singles/g, '싱글스')
      .replace(/오늘/g, '오늘')
      .replace(/날시/g, '날씨')
      .replace(/안녕히세요/g, '안녕하세요');
  }, []);

  // 실시간 텍스트 업데이트
  useEffect(() => {
    const fullText = finalTranscriptRef.current + interimTranscriptRef.current;
    setTranscript(fullText);
    setCorrectedText(correctText(fullText));
  }, [correctText]);

  // 음성 인식 시작
  const startRecording = useCallback(() => {
    if (!isSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    
    // 설정
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 음성 인식 시작');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          final += transcriptText;
          setConfidence(confidence || 0.9);
          console.log('✅ 최종 결과:', transcriptText);
        } else {
          interim += transcriptText;
        }
      }
      
      interimTranscriptRef.current = interim;
      
      if (final) {
        finalTranscriptRef.current += final + ' ';
        
        // 침묵 감지 타이머 리셋
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        // 3초 침묵 후 자동 정지
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, 3000);
      }
      
      // 실시간 업데이트 트리거
      const fullText = finalTranscriptRef.current + interim;
      setTranscript(fullText);
      setCorrectedText(correctText(fullText));
    };

    recognition.onerror = (event: any) => {
      console.error('❌ 음성 인식 오류:', event.error);
      if (event.error === 'no-speech') {
        console.log('음성이 감지되지 않음');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      interimTranscriptRef.current = '';
      console.log('🔇 음성 인식 종료');
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, correctText]);

  // 음성 인식 정지
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    setIsListening(false);
    interimTranscriptRef.current = '';
  }, []);

  // 초기화
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setCorrectedText('');
    setConfidence(0);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
  }, []);

  // TTS 재생
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  // 정확도 계산
  const getAccuracy = useCallback(() => {
    if (!confidence) return 0;
    return Math.round(confidence * 100);
  }, [confidence]);

  // 컴포넌트 언마운트시 정리
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    transcript,
    correctedText,
    isListening,
    isSupported,
    confidence: getAccuracy(),
    startRecording,
    stopRecording,
    resetTranscript,
    speakText
  };
};