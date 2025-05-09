import { Mic } from 'lucide-react';
import React from 'react';

interface RecordControlsProps {
  isRecording: boolean;
  showHelp: boolean;
  onToggleRecording: () => void;
  onToggleHelp: () => void;
}

const RecordControls: React.FC<RecordControlsProps> = ({
  isRecording,
  onToggleRecording,
}) => {
  return (
    <div className="flex justify-center mb-8 relative">
      <button 
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isRecording ? 'bg-red-500 mic-button-active' : 'bg-gradient-to-br from-blue-500 to-blue-700'
        }`} 
        onClick={onToggleRecording}
      >
        <Mic size={24} className="text-white" />
      </button>
    </div>
  );
};

export default RecordControls; 