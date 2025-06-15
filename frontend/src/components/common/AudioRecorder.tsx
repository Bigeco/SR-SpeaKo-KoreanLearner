import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete?: (audioUrl: string, audioBlob?: Blob) => void; // audioBlob 매개변수 추가
  autoDownload?: boolean;
  fileName?: string;
  children?: (props: {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    audioUrl: string | null;
    audioBlob: Blob | null; // audioBlob 추가
  }) => React.ReactNode;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  autoDownload = true,
  fileName = 'recording.wav',
  children
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null); // audioBlob 상태 추가
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunksRef.current = [];
      setIsRecording(true);
      
      // 새 녹음 시작 시 이전 데이터 초기화
      setAudioUrl(null);
      setAudioBlob(null);

      recorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const newAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const newAudioUrl = URL.createObjectURL(newAudioBlob);
        
        setAudioUrl(newAudioUrl);
        setAudioBlob(newAudioBlob); // audioBlob 상태 업데이트

        if (onRecordingComplete) {
          onRecordingComplete(newAudioUrl, newAudioBlob); // audioBlob도 함께 전달
        }

        if (autoDownload) {
          const downloadLink = document.createElement('a');
          downloadLink.href = newAudioUrl;
          downloadLink.download = fileName;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        setIsRecording(false);
        console.log(newAudioBlob.type);
      };

      recorder.start();
      console.log('녹음 시작');

      audioContextRef.current = new AudioContext();
    } catch (error) {
      console.error('오류 발생:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      console.log('녹음 정지');
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <>
      {children?.({ isRecording, startRecording, stopRecording, audioUrl, audioBlob })}
    </>
  );
};