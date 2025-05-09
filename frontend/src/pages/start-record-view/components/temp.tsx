  // 정확도에 따른 색상 클래스 얻기
  const getAccuracyColorClass = () => {
    if (!accuracy) return 'text-gray-400';
    
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-blue-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // 정확도에 따른 메시지 얻기
  const getAccuracyMessage = () => {
    if (!accuracy) return '';
    
    if (accuracy >= 90) return '매우 정확해요!';
    if (accuracy >= 70) return '좋은 발음이에요!';
    if (accuracy >= 50) return '꾸준히 연습하세요';
    return '더 연습이 필요해요';
  };