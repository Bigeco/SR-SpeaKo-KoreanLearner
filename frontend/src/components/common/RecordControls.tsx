import { Mic } from 'lucide-react';
import React from 'react';

interface RecordControlsProps {
  isRecording: boolean;
  showHelp: boolean;
  onToggleRecording: () => void;
  onToggleHelp: () => void;
  disabled?: boolean; // ← 이 줄 추가
}

const RecordControls: React.FC<RecordControlsProps> = ({
  isRecording,
  onToggleRecording,
  disabled = false // ← 기본값 추가
}) => {
  return (
    <div className="flex justify-center mb-8 relative">
      <button 
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isRecording ? 'bg-red-500 mic-button-active' : 'bg-gradient-to-br from-blue-500 to-blue-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`} // ← disabled 스타일 추가
        onClick={onToggleRecording}
        disabled={disabled} // ← disabled prop 추가
      >
        <Mic size={24} className="text-white" />
      </button>
    </div>
  );
};

export default RecordControls;