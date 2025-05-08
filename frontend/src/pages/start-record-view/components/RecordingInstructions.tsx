import { Activity, Check, Info } from 'lucide-react';
import React from 'react';

interface RecordingInstructionsProps {
  recordingState: 'idle' | 'recording' | 'completed';
}

const RecordingInstructions: React.FC<RecordingInstructionsProps> = ({ recordingState }) => {
  // 녹음 상태에 따른 아이콘 렌더링
  const renderIcon = () => {
    switch (recordingState) {
      case 'idle':
        return <Info size={24} className="text-blue-500" />;
      case 'recording':
        return <Activity size={24} className="text-red-500 animate-pulse" />;
      case 'completed':
        return <Check size={24} className="text-green-500" />;
      default:
        return null;
    }
  };

  // 녹음 상태에 따른 제목 텍스트
  const getTitle = () => {
    switch (recordingState) {
      case 'idle':
        return '당신의 발음을 확인해 보세요';
      case 'recording':
        return '말하는 중...';
      case 'completed':
        return '인식이 완료되었습니다';
      default:
        return '';
    }
  };

  // 녹음 상태에 따른 설명 텍스트
  const getDescription = () => {
    switch (recordingState) {
      case 'idle':
        return '마이크 버튼을 누르고 자유롭게 말해보세요.';
      case 'recording':
        return '실시간으로 음성을 인식하고 있습니다.';
      case 'completed':
        return '인식된 문장과 교정된 문장을 확인하세요.';
      default:
        return '';
    }
  };

  // 녹음 상태에 따른 색상
  const getStateColor = () => {
    switch (recordingState) {
      case 'idle':
        return 'blue';
      case 'recording':
        return 'red';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const color = getStateColor();

  return (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-3">
        {renderIcon()}
      </div>
      
      <h2 className={`text-xl font-bold text-${color}-600 mb-2`}>
        {getTitle()}
      </h2>
      
      <p className="text-gray-600 mb-4">
        {getDescription()}
      </p>
      
      {/* 추가 안내 (idle 상태일 때만) */}
      {recordingState === 'idle' && (
        <div className="bg-blue-50 rounded-lg p-4 text-center text-sm text-blue-700 mt-4">
          <p>자연스럽게 한국어로 말해보세요. 발음이 자동으로 교정됩니다.</p>
          <div className="mt-2 flex flex-col gap-1">
            <p>예시 문장:</p>
            <p>"안녕하세요, 저는 한국어를 배우고 있어요."</p>
            <p>"오늘 날씨가 정말 좋네요."</p>
            <p>"한국 음식 중에 김치찌개가 제일 좋아요."</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingInstructions;