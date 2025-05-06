import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete?: (audioUrl: string) => void;
  autoDownload?: boolean;
  fileName?: string;
  children?: (props: {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
  }) => React.ReactNode;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  autoDownload = true,
  fileName = 'recording.wav',
  children
}) => {
  const [isRecording, setIsRecording] = useState(false);
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

      recorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (onRecordingComplete) {
          onRecordingComplete(audioUrl);
        }

        if (autoDownload) {
          const downloadLink = document.createElement('a');
          downloadLink.href = audioUrl;
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

  return <>{children?.({ isRecording, startRecording, stopRecording })}</>;
};
