import React, { useState, useEffect, useRef } from 'react';
import { ReelsText } from './components/ReelsText';
import { NavBar } from '../../components/layout/NavBar';
import './styles/reels.css';

import { AudioRecorder } from '../../components/common/AudioRecorder';
import { transcribeAudioWithWav2Vec2 } from '../../utils/wav2vec2_api';
import { calculateAccuracyScore } from '../start-record-view/recordUtils';

const WORDS_DATASET = [
  "사과", "공룡", "안녕", "김치", "한국", "바나나", "토끼", "바다", "구름", "나무",
  "호랑이", "자동차", "비행기", "도서관", "학교", "병원", "우유", "치즈", "강아지", "고양이",
  "햄버거", "피자", "감자", "고구마", "달걀", "우산", "모자", "장갑", "컵", "책상",
  "의자", "컴퓨터", "전화기", "텔레비전", "시계", "자전거", "버스", "기차", "지하철", "엘리베이터",
  "계단", "창문", "문", "벽", "바닥", "천장", "냉장고", "에어컨", "선풍기", "라디오"
];

const WORDS_PRONUNCIATION = ["사과", "공뇽", "안녕", "김치", "한국", "바나나", "토끼", "바다", "구름", "나무",
"호랑이", "자동차", "비행기", "도서관", "학꾜", "병원", "우유", "치즈", "강아지", "고양이",
"햄버거", "피자", "감자", "고구마", "달걀", "우산", "모자", "장갑", "컵", "책쌍",
"의자", "컴퓨터", "전화기", "텔레비전", "시계", "자전거", "버스", "기차", "지하철", "엘리베이터",
"계단", "창문", "문", "벽", "바닥", "천장", "냉장고", "에어컨", "선풍기", "라디오"];


const SPRITE_IMAGES = [
  '/images/sprout/sprout_stage_1_seed.png',
  '/images/sprout/sprout_stage_2_first_leaf.png',
  '/images/sprout/sprout_stage_3_two_leaves.png',
  '/images/sprout/sprout_stage_5_bud.png',
  '/images/sprout/sprout_stage_6_flower_bloom.png'
];


const Index: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [WORDS, setWORDS] = useState<string[]>([]);
  const [pronunciations, setPronunciations] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<'idle' | 'moving' | 'failed' | 'passed' | 'retrying' | 'moving-from-retry'>('idle');
  const [finished, setFinished] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');
  const [isBackgroundMoving, setIsBackgroundMoving] = useState(false);
  const [_transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [_transcribedResults, setTranscribedResults] = useState<string[]>([]);
  const cardStateRef = useRef(cardState);
  


  const handleGameStart = () => {
  const getRandomIndices = (count: number, max: number): number[] => {
    const indices = new Set<number>();
    while (indices.size < count) {
      const rand = Math.floor(Math.random() * max);
      indices.add(rand);
    }
    return Array.from(indices);
  };

  const randomIndices = getRandomIndices(5, 50); // 0~49 중 5개 인덱스
  setWORDS(randomIndices.map(index => WORDS_DATASET[index]));
  const selectedPronunciations = randomIndices.map(index => WORDS_PRONUNCIATION[index]);
  
  setPronunciations(selectedPronunciations);
  setCurrentIndex(0);
  //setCardState('idle'); // 초기 상태 설정
  setGameStarted(true);

  setTimeout(() => {
    setCardState('moving');
    setIsBackgroundMoving(true);
  }, 100);
};


  console.log('Recording complete called with cardState:', cardState);

  const handleRecordingComplete = async (_audioUrl: string, audioBlob?: Blob) => {

  console.log('✅ handleRecordingComplete 실행:', cardState);

  if (!audioBlob) return;
  if (!(cardState === 'moving' || cardState === 'moving-from-retry' || cardState === 'failed')) return;

  setIsProcessing(true);

  try {
    const targetWord = pronunciations[currentIndex];
    const result = await transcribeAudioWithWav2Vec2(audioBlob);
    const transcription = result.transcription;

    setTranscribedResults(prev => {
      const updated = [...prev];
      updated[currentIndex] = transcription;
      return updated;
    });

    setTranscribedText(transcription);

    const accuracy = calculateAccuracyScore(transcription, targetWord);

    setTimeout(() => {
      const isCorrect = accuracy >= 70;
      if (isCorrect) {
        setCardState('passed');
        setRetryMessage('');
        console.log(currentIndex, WORDS.length);

        setTimeout(() => {
          if (currentIndex < WORDS.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setCardState('idle');
            setIsProcessing(false);
          } else {
            setFinished(true);
          }
        }, 800);
      } else {
        setIsProcessing(false);
        setCardState('failed');
        setIsBackgroundMoving(true);
        setRetryMessage(`다시 "${targetWord}" 발음을 시도하세요! (정확도: ${accuracy}%)`);

        setTranscribedText('');
        
      }
    }, 3000); 
  } catch (error) {
    console.error('음성 인식 오류:', error);
    setIsProcessing(false);
    setCardState('failed');
    setRetryMessage('음성 인식에 실패했습니다. 다시 시도해 주세요.');
  }
};

useEffect(() => {
  cardStateRef.current = cardState;
}, [cardState]);


useEffect(() => {
  setTranscribedText('');
  setIsProcessing(false);
}, [currentIndex]);
  
   
useEffect(() => {
  setCardState('moving');
}, [currentIndex]);




// 여기서 handleStart 함수 선언 (useEffect 밖)
useEffect(() => {
  if (cardState === 'retrying') {
    setCardState('moving-from-retry');
    setIsBackgroundMoving(true);
  } else if (cardState === 'idle') {
    setCardState('moving');
    setRetryMessage('');
    setIsBackgroundMoving(true);
  }
}, [cardState]);

// 실패 메시지(retryMessage) 표시 시 배경 멈춤
useEffect(() => {
  if (retryMessage) setIsBackgroundMoving(false);
}, [retryMessage]);


// 게임 시작 시 배경은 멈춤 상태로 초기화
useEffect(() => {
  if (gameStarted) setIsBackgroundMoving(false);
}, [gameStarted]);


if (!gameStarted || WORDS.length !== 5) {
    return (
      <div className="reels-outer-container reels-onboarding-bg">
        <div className="reels-container centered reels-onboarding-layout">
          <div className="reels-start-screen">
            <div className="reels-start-texts">
              <div className="start-title">한국어 발음 게임</div>
              <div className="start-subtitle">꽃을 피워보세요!</div>
              <div className="start-progress">1 / 5</div>
            </div>
          </div>
          <button className="start-button reels-start-bottom-btn" onClick={handleGameStart}>
            시작
          </button>
        </div>
        <div className="fixed bottom-0 left-0 right-0 w-full z-50">
          <NavBar />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`reels-outer-container${gameStarted ? ' reels-grass-animate-bg' : ''}${gameStarted && !isBackgroundMoving ? ' reels-grass-paused-bg' : ''}${!gameStarted ? ' reels-onboarding-bg' : ''}`}>
      <div className="reels-container">
        {!finished ? (
          <>
            {/* 진행상황 뱃지 이미지 (가로 일렬, 현재 단계만 강조) */}
            <div className="reels-progress-badges">
              {[1,2,3,4,5].map((n) => (
                <img
                  key={n}
                  src={`/images/sprout/badge/complete_${n}.png`}
                  alt={`progress badge ${n}`}
                  className={`progress-badge${currentIndex + 1 === n ? ' active' : ''}`}
                />
              ))}
            </div>
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
                  textShadow: '0 0 6px rgba(255, 77, 110, 0.15)'
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
              <div className="reels-controls-bottom">
              <AudioRecorder
              //key={`${currentIndex}-${retryCount}`}
              onRecordingComplete={handleRecordingComplete}
              fileName={`reels_${currentIndex}_${Date.now()}.wav`}
              autoDownload={false}
            >
              {({ isRecording: rec, startRecording, stopRecording }) => (
                <button
                  className={`mic-button${rec ? ' recording' : ''}`}
                  onClick={async () => {
                    if (rec) {
                      stopRecording();
                      
                    } else {
                      setTranscribedText('');
                      startRecording();
                      if (cardState === 'failed') {
                        setCardState('moving-from-retry');
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        setTimeout(() => {
                          stopRecording();
                        }, 3000);
                      }
                    }
                  }}
                  disabled={isProcessing}
                >
                  {rec ? '⏹ 중지' : '🎤 시작'}
                </button>
              )}
            </AudioRecorder>

              </div>
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
      <div className="fixed bottom-0 left-0 right-0 w-full z-50">
        <NavBar />
      </div>
      <div className="reels-grass-road" />
    </div>
  );
};


export default Index;