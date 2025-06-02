import { useCallback, useRef, useState, useEffect } from 'react';

interface WhisperResult {
  text: string;
  confidence: number;
  language?: string;
  error?: string;
}

export const useWhisperLive = () => {
  const [transcript, setTranscript] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebSocket 연결
  const connect = useCallback(async () => {
    try {
      const ws = new WebSocket('wss://bigeco-speako-whisper-server.hf.space/ws');
      
      ws.onopen = () => {
        console.log('Whisper WebSocket 연결됨');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const result: WhisperResult = JSON.parse(event.data);
          console.log('Whisper 결과:', result);
          
          if (result.text) {
            setTranscript(result.text);
            // 교정된 텍스트 시뮬레이션 (실제로는 서버에서 처리)
            setCorrectedText(correctText(result.text));
          }
          
          if (result.error) {
            console.error('Whisper 에러:', result.error);
          }
        } catch (error) {
          console.error('WebSocket 메시지 파싱 에러:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket 연결 종료');
        setIsConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket 에러:', error);
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }, []);

  // 간단한 텍스트 교정 함수 (예시)
  const correctText = (text: string): string => {
    return text
      .replace(/배오고/g, '배우고')
      .replace(/있서요/g, '있어요')
      .replace(/머거요/g, '먹어요')
      .replace(/가르키다/g, '가리키다');
  };

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // WebSocket으로 오디오 데이터 전송
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Blob을 ArrayBuffer로 변환 후 전송
            event.data.arrayBuffer().then(buffer => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(buffer);
              }
            });
          }
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('녹음 중지됨');
      };
      
      // 500ms마다 데이터 전송 (실시간성 확보)
      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      // 초기 상태 리셋
      setTranscript('');
      setCorrectedText('');
      
    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  }, []);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
  }, [stopRecording]);

  // 컴포넌트 마운트시 자동 연결
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    transcript,
    correctedText,
    isConnected,
    isRecording,
    connect,
    disconnect,
    startRecording,
    stopRecording
  };
}