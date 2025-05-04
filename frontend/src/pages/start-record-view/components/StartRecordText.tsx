import React, { useEffect, useRef, useState } from 'react';

export const StartRecordText: React.FC = () => {
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    let audioChunks: Blob[] = [];
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        audioChunks = [];
        setIsRecording(true);

        recorder.ondataavailable = (event: BlobEvent) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);

          if (audioRef.current) {
            audioRef.current.src = audioUrl;
          }

          const downloadLink = document.createElement('a');
          downloadLink.href = audioUrl;
          downloadLink.download = 'recording.wav';
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          setIsRecording(false);
        };

        recorder.start();
        console.log('녹음 시작');

        audioContext = new AudioContext();
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

    if (startButtonRef.current) {
      startButtonRef.current.onclick = startRecording;
    }
    if (stopButtonRef.current) {
      stopButtonRef.current.onclick = stopRecording;
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [mediaRecorder]);

  return (
    <div className="start-record-text">
      <h2>녹음</h2>
      <button
        id="start"
        ref={startButtonRef}
        disabled={isRecording}
      >
        시작
      </button>
      <button
        id="stop"
        ref={stopButtonRef}
        disabled={!isRecording}
      >
        정지
      </button>
      <audio id="audio" ref={audioRef} controls />
      {isRecording && <p>녹음 중</p>}
    </div>
  );
};
