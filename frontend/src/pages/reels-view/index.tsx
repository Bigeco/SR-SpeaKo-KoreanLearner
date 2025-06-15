import React, { useState, useEffect } from 'react';
import { ReelsText } from './components/ReelsText';
import { ReelsControls } from './components/ReelsControls';
import './styles/reels.css';

const WORDS = ['사과', '공룡', '안녕', '김치', '한국'];
const SPRITE_IMAGES = [
  '/images/sprout/sprout_stage_1_seed.png',
  '/images/sprout/sprout_stage_2_first_leaf.png',
  '/images/sprout/sprout_stage_3_two_leaves.png',
  '/images/sprout/sprout_stage_4_stem_growth.png',
  '/images/sprout/sprout_stage_5_bud.png'
];

const Index: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [cardState, setCardState] = useState<'idle' | 'moving' | 'failed' | 'passed' | 'retrying' | 'moving-from-retry'>('idle');
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');

  const handleGameStart = () => {
    setGameStarted(true);
  };

  useEffect(() => {
  if ((cardState === 'moving' || cardState === 'moving-from-retry') &&
      isRecording) {
    const timeout = setTimeout(() => {
      const isCorrect = Math.random() > 0.3;
      if (isCorrect) {
        setCardState('passed');
        setRetryMessage('');
        setTimeout(() => {
          if (currentIndex < WORDS.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setCardState('idle');
            setIsRecording(false);
          } else {
            setFinished(true);
          }
        }, 800);
      } else {
        setCardState('failed');
        setRetryMessage(`다시 "${WORDS[currentIndex]}" 발음을 시도하세요!`);
        setIsRecording(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }
}, [cardState, isRecording, currentIndex]);

// 여기서 handleStart 함수 선언 (useEffect 밖)
const handleStart = () => {
  if (cardState === 'failed') {
    setCardState('retrying'); // 1. 카드를 60% → 50%로 이동
  } else if (cardState === 'retrying') {
    setCardState('moving-from-retry'); // 2. 60%에서 시작하는 새로운 상태 추가
    setIsRecording(true);
    setRetryMessage('');
  } else if (cardState === 'idle') {
    setCardState('moving');
    setIsRecording(true);
    setRetryMessage('');
  }
};

if (!gameStarted) {
    return (
      <div className="reels-container">
        <div className="reels-start-screen">
          <img
            src="/images/sprout/sprout_stage_6_flower_bloom.png"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 24px auto'
            }}
          />
          <div className="start-title">🌱 한국어 발음 게임 🌱</div>
          <div className="start-subtitle">꽃을 피워보세요!</div>
          <div className="start-progress">1 / 5</div>
          <button className="start-button" onClick={handleGameStart}>
            시작
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="reels-container">
      {!finished ? (
        <>
          <div className="reels-grass-road" />
          {retryMessage && (
            <div
              className="retry-message"
              style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#ff4d6d',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                zIndex: 15,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0 0 6px #ff4d6d'
              }}
            >
              {retryMessage}
            </div>
          )}
          <div className="reels-ball">
            <img
              src={SPRITE_IMAGES[currentIndex]} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          <div
            className={`reels-card
              ${cardState === 'moving' ? 'card-slide' : ''}
              ${cardState === 'moving-from-retry' ? 'card-retry-slide' : ''} 
              ${cardState === 'failed' ? 'card-fail-shift' : ''}
              ${cardState === 'retrying' ? 'card-retry-shift' : ''}
              ${cardState === 'passed' ? 'card-pass' : ''}
            `}
          >
            <ReelsText word={WORDS[currentIndex]} />
          </div>
          <ReelsControls
            currentIndex={currentIndex}
            totalWords={WORDS.length}
            isRecording={isRecording}
            onMicClick={handleStart}
          />
        </>
      ) : (
        <div className="reels-congrats">
          <img
            src="/images/sprout/sprout_stage_6_flower_bloom.png"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 24px auto'
            }}
          />
          🎉 축하합니다! 🎉
        </div>
      )}
    </div>
  );
};

export default Index;
