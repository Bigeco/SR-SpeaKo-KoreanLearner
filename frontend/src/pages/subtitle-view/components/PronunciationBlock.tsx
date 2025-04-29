import { Volume2 } from 'lucide-react';
import { AudioWaveform } from '../../../components/common/AudioWavefrom';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Score 관련 상수 및 타입 정의
const SCORE_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
} as const;

const GRADIENT_COLORS = {
  HIGH: 'from-blue-500 to-blue-600',
  MEDIUM: 'from-yellow-500 to-yellow-600',
  LOW: 'from-red-500 to-red-600',
} as const;

const FEEDBACK_MESSAGES = {
  HIGH: '정확히 발음했어요!',
  MEDIUM: '좋은 시도였어요!',
  LOW: '다시 시도해 보세요',
} as const;

const FEEDBACK_ICONS = {
  HIGH: <CheckCircle size={16} className="text-white mr-1" />,
  MEDIUM: <AlertCircle size={16} className="text-white mr-1" />,
  LOW: <XCircle size={16} className="text-white mr-1" />,
} as const;

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
  const getScoreLevel = (score: number) => {
    if (score >= SCORE_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= SCORE_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  };

  const getPhraseGradient = () => score ? GRADIENT_COLORS[getScoreLevel(score)] : 'from-blue-50 to-blue-100';
  const getFeedbackMessage = () => score ? FEEDBACK_MESSAGES[getScoreLevel(score)] : '';
  const getFeedbackIcon = () => score ? FEEDBACK_ICONS[getScoreLevel(score)] : null;

  return (
    <div className={`bg-gradient-to-r ${getPhraseGradient()} p-5 rounded-2xl shadow-sm`}>
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
        <div className="flex items-center mt-6">
          {getFeedbackIcon()}
          <span className="text-sm text-blue-100">
            {getFeedbackMessage()}
          </span>
        </div>
      )}
    </div>
  );
}; 