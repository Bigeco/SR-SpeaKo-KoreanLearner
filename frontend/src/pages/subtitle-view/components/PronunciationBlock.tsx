import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';
import { ScoreDisplay } from './ScoreDisplay';

interface PronunciationBlockProps {
  type: 'model' | 'user';
  text: string;
  score?: number;
  isPlaying?: boolean;
  isRecording?: boolean;
  onToggleAudio?: () => void;
}

export const PronunciationBlock = ({
  type,
  text,
  score,
  isPlaying = false,
  isRecording = false,
  onToggleAudio,
}: PronunciationBlockProps) => {
  return (
    <div className={`bg-gradient-to-r ${type === 'model' ? 'from-blue-500 to-blue-600' : 'from-yellow-500 to-yellow-600'} p-5 rounded-2xl shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm ${type === 'model' ? 'text-gray-500' : 'text-blue-200'}`}>
          [{type === 'model' ? 'Correct' : 'Your'}]
        </div>
        <div className="flex items-center">
          {type === 'model' && (
            <button 
              onClick={onToggleAudio}
              className="flex items-center text-blue-600 mr-2"
            >
              <Volume2 size={20} />
            </button>
          )}
          <div className="h-8">
            <AudioWaveform 
              isActive={type === 'model' ? isPlaying : isRecording} 
              color={type === 'model' ? '#3B82F6' : '#ffffff'} 
            />
          </div>
        </div>
      </div>
      
      <div className={`font-medium text-center mb-3 ${type === 'user' ? 'text-white' : ''}`}>
        {text}
      </div>

      {type === 'user' && score && (
        <ScoreDisplay score={score} type="user" />
      )}
    </div>
  );
}; 