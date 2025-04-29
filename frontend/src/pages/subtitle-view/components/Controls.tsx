import { Mic, HelpCircle } from 'lucide-react';

interface ControlsProps {
  isRecording: boolean;
  showHelp: boolean;
  onToggleRecording: () => void;
  onToggleHelp: () => void;
}

export const Controls = ({
  isRecording,
  showHelp,
  onToggleRecording,
  onToggleHelp,
}: ControlsProps) => {
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

      <button 
        className="absolute right-8 bg-yellow-400 w-10 h-10 rounded-full flex items-center justify-center shadow-md help-button-bounce" 
        onClick={onToggleHelp}
      >
        <HelpCircle size={20} className="text-white" />
      </button>

      {showHelp && (
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-yellow-100 p-3 rounded-xl shadow-md">
          <div className="text-xs text-gray-800 max-w-xs">
            버튼을 누르고 예제 문장을 발음해보세요. 발음 정확도와 피드백을
            받을 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}; 