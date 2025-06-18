import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Score 관련 상수 및 타입 정의
export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GREAT: 80,
  GOOD: 70,
  FAIR: 60,
  NEEDS_WORK: 40,
} as const;

export const FEEDBACK_MESSAGES = {
  EXCELLENT: '완벽한 발음이에요!',
  GREAT: '매우 정확해요!',
  GOOD: '잘 하고 있어요!',
  FAIR: '조금만 더 연습해봐요!',
  NEEDS_WORK: '발음이 조금 부족해요',
  LOW: '꾸준히 연습하세요',
} as const;

export const FEEDBACK_ICONS = {
  EXCELLENT: <CheckCircle size={16} className="mr-1 text-emerald-600" />,
  GREAT: <CheckCircle size={16} className="mr-1 text-green-600" />,
  GOOD: <CheckCircle size={16} className="mr-1 text-lime-600" />,
  FAIR: <AlertCircle size={16} className="mr-1 text-yellow-500" />,
  NEEDS_WORK: <AlertCircle size={16} className="mr-1 text-orange-500" />,
  LOW: <XCircle size={16} className="mr-1 text-red-600" />,
} as const;

export const TEXT_COLORS = {
  EXCELLENT: 'text-emerald-600',
  GREAT: 'text-green-600',
  GOOD: 'text-lime-600',
  FAIR: 'text-yellow-500',
  NEEDS_WORK: 'text-orange-500',
  LOW: 'text-red-600',
} as const;

interface ScoreDisplayProps {
  score: number;
  type?: 'user' | 'model';
}

export const getScoreLevel = (score: number) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= SCORE_THRESHOLDS.GREAT) return 'GREAT';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'FAIR';
  if (score >= SCORE_THRESHOLDS.NEEDS_WORK) return 'NEEDS_WORK';
  return 'LOW';
};

export const ScoreDisplay = ({ score, type: _type }: ScoreDisplayProps) => {
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