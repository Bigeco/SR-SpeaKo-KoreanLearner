import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Score 관련 상수 및 타입 정의
export const SCORE_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
} as const;

export const FEEDBACK_MESSAGES = {
  HIGH: '매우 정확해요!',
  MEDIUM: '좋은 발음이에요!',
  LOW: '꾸준히 연습하세요',
} as const;

export const FEEDBACK_ICONS = {
  HIGH: <CheckCircle size={16} className="mr-1 text-green-600" />,
  MEDIUM: <AlertCircle size={16} className="mr-1 text-orange-500" />,
  LOW: <XCircle size={16} className="mr-1 text-red-600" />,
} as const;

export const TEXT_COLORS = {
  HIGH: 'text-green-600',
  MEDIUM: 'text-orange-500',
  LOW: 'text-red-600',
} as const;

interface ScoreDisplayProps {
  score: number;
  type?: 'user' | 'model';
}

export const getScoreLevel = (score: number) => {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

export const ScoreDisplay = ({ score, type }: ScoreDisplayProps) => {
  const getScoreColor = () => TEXT_COLORS[getScoreLevel(score)];

  return (
    <div className="text-center mb-3 mt-3">
      <div className={`text-4xl font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}%
      </div>
      <div className="flex items-center justify-center mt-1">
        {FEEDBACK_ICONS[getScoreLevel(score)]}
        <span className={`text-sm ml-1 ${TEXT_COLORS[getScoreLevel(score)]}`}>
          {FEEDBACK_MESSAGES[getScoreLevel(score)]}
        </span>
      </div>
    </div>
  );
}; 