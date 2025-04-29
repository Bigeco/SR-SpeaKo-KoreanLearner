// 점수 표시 컴포넌트

import { SproutScore } from './SproutScore';

// Score 관련 상수 및 타입 정의
const SCORE_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
} as const;

const TEXT_COLORS = {
  HIGH: 'text-blue-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-red-600',
} as const;

interface ScoreDisplayProps {
  score: number;
}

export const ScoreDisplay = ({ score }: ScoreDisplayProps) => {
  const getScoreLevel = (score: number) => {
    if (score >= SCORE_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= SCORE_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  };

  const getScoreColor = () => TEXT_COLORS[getScoreLevel(score)];

  return (
    <div className="text-center mb-8">
      <SproutScore score={score} size={120} className="mb-4" />
      <div className="text-gray-600">발음 정확도</div>
      <div className={`text-4xl font-bold ${getScoreColor()}`}>
        {score.toFixed(1)}%
      </div>
    </div>
  );
}; 