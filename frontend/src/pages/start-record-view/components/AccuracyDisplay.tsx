import React from 'react';

interface AccuracyDisplayProps {
  accuracy: number | null;
  isVisible: boolean;
}

const AccuracyDisplay: React.FC<AccuracyDisplayProps> = ({ accuracy, isVisible }) => {
  // 정확도에 따른 메시지 얻기
  const getAccuracyMessage = () => {
    if (!accuracy) return '';
    if (accuracy >= 90) return '매우 정확해요!';
    if (accuracy >= 70) return '좋은 발음이에요!';
    if (accuracy >= 50) return '꾸준히 연습하세요';
    return '더 연습이 필요해요';
  };
  
  // 정확도에 따른 색상 클래스 얻기
  const getColorClass = () => {
    if (!accuracy) return '';
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-blue-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // 정확도 바의 배경색 클래스 얻기
  const getBarColorClass = () => {
    if (!accuracy) return '';
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 70) return 'bg-blue-500';
    if (accuracy >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (!isVisible || accuracy === null) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-16 left-0 right-0 w-full bg-white shadow-md border-t border-gray-100 py-2 px-4 z-10 ${isVisible ? 'result-fade-in' : 'hidden'}`}>
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div>
          <span className="text-gray-600 text-sm">발음 정확도</span>
          <div className="flex items-baseline">
            <span className={`text-2xl font-bold ${getColorClass()} accuracy-score`}>
              {accuracy}%
            </span>
            <span className={`ml-2 text-sm ${getColorClass()}`}>
              {getAccuracyMessage()}
            </span>
          </div>
        </div>
        
        {/* 정확도 바 */}
        <div className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden accuracy-bar">
          <div 
            className={`h-full accuracy-bar-fill ${getBarColorClass()}`}
            style={{ width: `${accuracy}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyDisplay;