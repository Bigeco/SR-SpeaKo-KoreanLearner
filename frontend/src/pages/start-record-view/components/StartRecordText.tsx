import React, { useEffect, useRef, useState } from 'react';

export const StartRecordText: React.FC = () => {
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false); // 녹음 상태 관리

  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationId: number | null = null;

    const startButton = startButtonRef.current;
    const stopButton = stopButtonRef.current;
    const audioElement = audioRef.current;

    if (!startButton || !stopButton || !audioElement) return;

    startButton.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        setIsRecording(true); // 녹음 상태를 true로 설정

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          if (animationId !== null) {
            cancelAnimationFrame(animationId);
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // <audio> 태그에 재생용 URL 설정
          audioElement.src = audioUrl;

          // 자동 다운로드 처리
          const downloadLink = document.createElement('a');
          downloadLink.href = audioUrl;
          downloadLink.download = 'recording.wav';
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false); // 녹음 상태를 false로 설정
        };

        mediaRecorder.start();
        console.log('녹음 시작');

        // 무음 감지를 위한 설정
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        detectSilence();
      } catch (error) {
        console.error('오류 발생:', error);
        setIsRecording(false); // 오류 발생 시 녹음 상태 초기화
      }
    };

    function detectSilence() {
      if (!analyser || !dataArray) return;

      const threshold = 5;
      let silenceStart = Date.now();

      const checkSilence = () => {
        analyser!.getByteFrequencyData(dataArray!);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (volume < threshold) {
          if (Date.now() - silenceStart > 5000) {
            console.log('5초간 정적 - 자동 녹음 종료');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            return;
          }
        } else {
          silenceStart = Date.now(); // 소리 감지되면 타이머 초기화
        }

        animationId = requestAnimationFrame(checkSilence);
      };

      animationId = requestAnimationFrame(checkSilence);
    }

    stopButton.onclick = () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('녹음 정지');
        setIsRecording(false); // 녹음 상태를 false로 설정
      }
    };

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  return (
    <div className="start-record-text">
      <h2>녹음 시작</h2>
      <button
        id="start"
        ref={startButtonRef}
        onClick={() => console.log('녹음 시작 버튼 클릭')}
        disabled={isRecording} // 녹음 중일 때 비활성화
      >
        시작
      </button>
      <button
        id="stop"
        ref={stopButtonRef}
        onClick={() => console.log('녹음 정지 버튼 클릭')}
        disabled={!isRecording} // 녹음 중이 아닐 때 비활성화
      >
        정지
      </button>
      <audio id="audio" ref={audioRef} controls />
    </div>
  );
};