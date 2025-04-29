import React from 'react';

interface AudioWaveformProps {
  isActive?: boolean;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  isActive = false, 
  color = 'currentColor' 
}) => {
  return (
    <div className="flex items-center justify-center h-8 space-x-1">
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={`waveform-bar w-1 rounded-full ${
            isActive ? '' : 'bg-gray-300'
          }`}
          style={{ 
            '--delay': bar,
            height: `${Math.random() * 16 + 4}px`,
            backgroundColor: isActive ? color : undefined
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};