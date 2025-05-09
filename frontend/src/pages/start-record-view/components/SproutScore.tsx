import React from 'react';

// 점수에 따른 새싹 이미지를 보여주는 컴포넌트
interface SproutScoreProps {
  score: number;
  className?: string;
  size?: number; // 이미지 컨테이너 크기 (px 단위)
}

export const SproutScore: React.FC<SproutScoreProps> = ({ 
  score, 
  className = '',
  size = 120 // 기본 크기 120px
}) => {
  // 점수를 5개 구간으로 나누기
  const getSproutImage = () => {
    if (score < 20) {
      return '/images/sprout/sprout_stage_1_seed.png'; // 첫 번째 이미지 (갈색 씨앗)
    } else if (score < 40) {
      return '/images/sprout/sprout_stage_2_first_leaf.png'; // 두 번째 이미지 (초록 새싹)
    } else if (score < 60) {
      return '/images/sprout/sprout_stage_3_two_leaves.png'; // 세 번째 이미지 (분홍 꽃봉오리 새싹)
    } else if (score < 80) {
      return '/images/sprout/sprout_stage_5_bud.png'; // 네 번째 이미지 (초록 잎새싹)
    } else {
      return '/images/sprout/sprout_stage_6_flower_bloom.png'; // 다섯 번째 이미지 (분홍 꽃 핀 새싹)
    }
  };

  const sproutImage = getSproutImage();

  // 컨테이너 크기 설정
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        style={containerStyle} 
        className="relative flex items-center justify-center overflow-hidden"
      >
        <img 
          src={sproutImage} 
          alt="Score Indicator" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
};