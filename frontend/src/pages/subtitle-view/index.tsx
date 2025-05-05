import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NavBar } from '../../components/layout/NavBar';
import { ScoreDisplay } from './components/ScoreDisplay';
import { PronunciationBlock } from './components/PronunciationBlock';
import { Controls } from './components/Controls';
import { AudioRecorder } from '../../components/common/AudioRecorder';
import './styles/subtitle.css';

const SubtitleView = () => {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [score] = useState(83.33);
  const [isPlaying, setIsPlaying] = useState(false);

  // 이벤트 핸들러
  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handleGoBack = () => navigate(-1);
  const toggleHelp = () => setShowHelp(!showHelp);

  const handleRecordingComplete = (audioUrl: string) => {
    console.log('녹음이 완료되었습니다:', audioUrl);
    // TODO: 여기에 녹음된 오디오 처리 로직 추가
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <button 
          onClick={handleGoBack}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center font-medium">스픽코님, 반갑습니다.</div>
        <div className="w-5"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-8 py-4 overflow-auto">
        <ScoreDisplay score={score} />

        {/* Practice Phrases */}
        <div className="w-full space-y-4 mb-8">
          <PronunciationBlock
            type="model"
            text="안녕하세요 오늘 날씨가 참 좋아요"
            isPlaying={isPlaying}
            onToggleAudio={toggleAudio}
          />

          <PronunciationBlock
            type="user"
            text="안녕하세요 오늘 날씨가 잠 좋아요"
            score={score}
            isRecording={recording}
          />
        </div>
      </div>

      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        autoDownload={true}
        fileName="subtitle-recording.wav"
      >
        {({ isRecording, startRecording, stopRecording }) => (
          <Controls
            isRecording={isRecording}
            showHelp={showHelp}
            onToggleRecording={isRecording ? stopRecording : startRecording}
            onToggleHelp={toggleHelp}
          />
        )}
      </AudioRecorder>

      <NavBar />
    </div>
  );
};

export default SubtitleView;
