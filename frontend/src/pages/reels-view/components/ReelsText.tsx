import React from 'react';

interface ReelsTextProps {
  word: string;
}

export const ReelsText: React.FC<ReelsTextProps> = ({ word }) => {
  return (
    <div className="reels-text-circle">
      {word}
    </div>
  );
};