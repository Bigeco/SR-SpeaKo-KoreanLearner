import { ArrowLeft, ArrowRight, ArrowLeft as PrevIcon, Volume2 } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from '../../components/layout/NavBar';
import { getPhonemeType } from '../../utils/phoneme_analysis';
import './styles/oral-structure.css';

// 한국어 음소 데이터
const consonantData = [
  {
    jamo: 'ㄱ',
    name: '기역',
    description: '혀의 뒤쪽을 연구개에 닿게 하여 공기의 흐름을 막았다가 갑자기 놓아서 내는 소리입니다.',
    imagePath: '/images/jamo/giyok.png',
    tips: ['혀끝이 아닌 혀 뒤쪽을 사용하세요', '목구멍 깊은 곳에서 소리를 내세요']
  },
  {
    jamo: 'ㄲ',
    name: '쌍기역',
    description: '기역을 더 강하게 발음하는 된소리입니다. 목에 힘을 주어 발음합니다.',
    imagePath: '/images/jamo/ssanggiyok.png',
    tips: ['목에 힘을 주고 발음하세요', '일반 ㄱ보다 더 강하게 소리내세요']
  },
  {
    jamo: 'ㄴ',
    name: '니은',
    description: '혀끝을 잇몸에 닿게 하고 입을 통해 공기가 나가지 못하게 막으면서 코로 소리를 내는 비음입니다.',
    imagePath: '/images/jamo/nieun.png',
    tips: ['혀끝을 윗잇몸에 가볍게 닿게 하세요', '코로 숨을 내쉬며 소리를 내세요']
  },
  {
    jamo: 'ㄷ',
    name: '디귿',
    description: '혀끝을 잇몸에 닿게 하여 공기의 흐름을 막았다가 갑자기 놓아서 내는 소리입니다.',
    imagePath: '/images/jamo/digeut.png',
    tips: ['혀끝을 윗잇몸에 확실히 닿게 하세요', '공기를 한번에 터뜨리듯 내보내세요']
  },
  {
    jamo: 'ㄸ',
    name: '쌍디귿',
    description: '디귿을 더 강하게 발음하는 된소리입니다.',
    imagePath: '/images/jamo/ssangdigeut.png',
    tips: ['목에 힘을 주고 발음하세요', '일반 ㄷ보다 더 강하게 소리내세요']
  },
  {
    jamo: 'ㄹ',
    name: '리을',
    description: '혀끝을 잇몸에 가볍게 닿았다 떼었다 하면서 내는 탄음입니다.',
    imagePath: '/images/jamo/rieul.png',
    tips: ['혀끝을 가볍게 튕기듯 움직이세요', '너무 강하게 누르지 마세요']
  },
  {
    jamo: 'ㅁ',
    name: '미음',
    description: '입술을 닫고 코로 소리를 내는 비음입니다.',
    imagePath: '/images/jamo/mieum.png',
    tips: ['입술을 자연스럽게 닫으세요', '코로 진동을 느끼며 소리내세요']
  },
  {
    jamo: 'ㅂ',
    name: '비읍',
    description: '입술을 닫았다가 터뜨리면서 내는 소리입니다.',
    imagePath: '/images/jamo/bieup.png',
    tips: ['입술을 완전히 닫았다가 터뜨리세요', '공기를 한번에 내보내세요']
  },
  {
    jamo: 'ㅃ',
    name: '쌍비읍',
    description: '비읍을 더 강하게 발음하는 된소리입니다.',
    imagePath: '/images/jamo/ssangbieup.png',
    tips: ['목에 힘을 주고 발음하세요', '일반 ㅂ보다 더 강하게 소리내세요']
  },
  {
    jamo: 'ㅅ',
    name: '시옷',
    description: '혀끝을 잇몸 근처에 가까이 하여 공기가 마찰되면서 나는 소리입니다.',
    imagePath: '/images/jamo/siot.png',
    tips: ['혀끝을 잇몸에 가까이 대세요', '공기가 혀와 잇몸 사이로 나가게 하세요']
  },
  {
    jamo: 'ㅆ',
    name: '쌍시옷',
    description: '시옷을 더 강하게 발음하는 된소리입니다.',
    imagePath: '/images/jamo/ssangsiot.png',
    tips: ['목에 힘을 주고 발음하세요', '일반 ㅅ보다 더 강하게 소리내세요']
  },
  {
    jamo: 'ㅇ',
    name: '이응',
    description: '목구멍에서 나는 소리로, 초성에서는 무음이고 종성에서는 콧소리입니다.',
    imagePath: '/images/jamo/ieung.png',
    tips: ['목구멍을 자연스럽게 열어두세요', '종성일 때는 코로 소리를 내세요']
  },
  {
    jamo: 'ㅈ',
    name: '지읒',
    description: '혀끝을 잇몸에 닿게 한 후 공기를 마찰시켜 내는 소리입니다.',
    imagePath: '/images/jamo/jieut.png',
    tips: ['혀끝을 잇몸에 닿게 한 후 떼세요', '공기가 마찰되도록 하세요']
  },
  {
    jamo: 'ㅉ',
    name: '쌍지읒',
    description: '지읒을 더 강하게 발음하는 된소리입니다.',
    imagePath: '/images/jamo/ssangjieut.png',
    tips: ['목에 힘을 주고 발음하세요', '일반 ㅈ보다 더 강하게 소리내세요']
  },
  {
    jamo: 'ㅊ',
    name: '치읓',
    description: '지읒에 공기를 더 세게 내보내는 거센소리입니다.',
    imagePath: '/images/jamo/chieut.png',
    tips: ['혀끝을 잇몸에 닿게 한 후 강하게 떼세요', '공기를 세게 내보내세요']
  },
  {
    jamo: 'ㅋ',
    name: '키읔',
    description: '기역에 공기를 더 세게 내보내는 거센소리입니다.',
    imagePath: '/images/jamo/kieuk.png',
    tips: ['혀 뒤쪽을 연구개에 닿게 한 후 강하게 떼세요', '공기를 세게 내보내세요']
  },
  {
    jamo: 'ㅌ',
    name: '티읕',
    description: '디귿에 공기를 더 세게 내보내는 거센소리입니다.',
    imagePath: '/images/jamo/tieut.png',
    tips: ['혀끝을 잇몸에 닿게 한 후 강하게 떼세요', '공기를 세게 내보내세요']
  },
  {
    jamo: 'ㅍ',
    name: '피읖',
    description: '비읍에 공기를 더 세게 내보내는 거센소리입니다.',
    imagePath: '/images/jamo/pieup.png',
    tips: ['입술을 닫았다가 강하게 터뜨리세요', '공기를 세게 내보내세요']
  },
  {
    jamo: 'ㅎ',
    name: '히읗',
    description: '목구멍에서 공기가 마찰되면서 나는 소리입니다.',
    imagePath: '/images/jamo/hieut.png',
    tips: ['목구멍을 좁혀 공기가 마찰되게 하세요', '숨을 내쉬며 소리를 내세요']
  }
];

const vowelData = [
  {
    jamo: 'ㅏ',
    name: '아',
    description: '입을 크게 벌리고 혀를 아래쪽 앞으로 위치시켜 내는 소리입니다.',
    imagePath: '/images/jamo/a.png',
    tips: ['입을 세로로 크게 벌리세요', '혀를 자연스럽게 아래로 내리세요']
  },
  {
    jamo: 'ㅐ',
    name: '애',
    description: '아보다 입을 조금 덜 벌리고 혀를 앞쪽으로 위치시켜 내는 소리입니다.',
    imagePath: '/images/jamo/ae.png',
    tips: ['입을 ㅏ보다 조금 덜 벌리세요', '혀를 앞쪽으로 위치시키세요']
  },
  {
    jamo: 'ㅑ',
    name: '야',
    description: '이 소리를 먼저 내고 이어서 아 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/ya.png',
    tips: ['이 소리부터 시작하세요', '빠르게 아 소리로 이어가세요']
  },
  {
    jamo: 'ㅒ',
    name: '얘',
    description: '이 소리를 먼저 내고 이어서 애 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/yae.png',
    tips: ['이 소리부터 시작하세요', '빠르게 애 소리로 이어가세요']
  },
  {
    jamo: 'ㅓ',
    name: '어',
    description: '입을 중간 정도 벌리고 혀를 중간 위치에서 뒤쪽으로 당겨 내는 소리입니다.',
    imagePath: '/images/jamo/eo.png',
    tips: ['입을 ㅏ보다 작게 벌리세요', '혀를 약간 뒤로 당기세요']
  },
  {
    jamo: 'ㅔ',
    name: '에',
    description: '어보다 입을 조금 덜 벌리고 혀를 앞쪽으로 위치시켜 내는 소리입니다.',
    imagePath: '/images/jamo/e.png',
    tips: ['입을 ㅓ보다 조금 덜 벌리세요', '혀를 앞쪽으로 위치시키세요']
  },
  {
    jamo: 'ㅕ',
    name: '여',
    description: '이 소리를 먼저 내고 이어서 어 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/yeo.png',
    tips: ['이 소리부터 시작하세요', '빠르게 어 소리로 이어가세요']
  },
  {
    jamo: 'ㅖ',
    name: '예',
    description: '이 소리를 먼저 내고 이어서 에 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/ye.png',
    tips: ['이 소리부터 시작하세요', '빠르게 에 소리로 이어가세요']
  },
  {
    jamo: 'ㅗ',
    name: '오',
    description: '입술을 둥글게 모으고 혀를 뒤쪽으로 당겨 내는 소리입니다.',
    imagePath: '/images/jamo/o.png',
    tips: ['입술을 동그랗게 모으세요', '혀를 뒤로 당기며 소리내세요']
  },
  {
    jamo: 'ㅘ',
    name: '와',
    description: '우 소리를 먼저 내고 이어서 아 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/wa.png',
    tips: ['우 소리부터 시작하세요', '빠르게 아 소리로 이어가세요']
  },
  {
    jamo: 'ㅙ',
    name: '왜',
    description: '우 소리를 먼저 내고 이어서 애 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/wae.png',
    tips: ['우 소리부터 시작하세요', '빠르게 애 소리로 이어가세요']
  },
  {
    jamo: 'ㅚ',
    name: '외',
    description: '오 소리와 이 소리를 동시에 내는 복합모음입니다.',
    imagePath: '/images/jamo/oe.png',
    tips: ['입술을 둥글게 모으면서 이 소리를 내세요', '오와 이의 중간 소리를 내세요']
  },
  {
    jamo: 'ㅛ',
    name: '요',
    description: '이 소리를 먼저 내고 이어서 오 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/yo.png',
    tips: ['이 소리부터 시작하세요', '빠르게 오 소리로 이어가세요']
  },
  {
    jamo: 'ㅜ',
    name: '우',
    description: '입술을 더욱 둥글게 모으고 혀를 뒤쪽 높은 위치에서 내는 소리입니다.',
    imagePath: '/images/jamo/u.png',
    tips: ['입술을 앞으로 내밀며 모으세요', 'ㅗ보다 더 둥글게 만드세요']
  },
  {
    jamo: 'ㅝ',
    name: '워',
    description: '우 소리를 먼저 내고 이어서 어 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/weo.png',
    tips: ['우 소리부터 시작하세요', '빠르게 어 소리로 이어가세요']
  },
  {
    jamo: 'ㅞ',
    name: '웨',
    description: '우 소리를 먼저 내고 이어서 에 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/we.png',
    tips: ['우 소리부터 시작하세요', '빠르게 에 소리로 이어가세요']
  },
  {
    jamo: 'ㅟ',
    name: '위',
    description: '우 소리와 이 소리를 동시에 내는 복합모음입니다.',
    imagePath: '/images/jamo/wi.png',
    tips: ['입술을 둥글게 모으면서 이 소리를 내세요', '우와 이의 중간 소리를 내세요']
  },
  {
    jamo: 'ㅠ',
    name: '유',
    description: '이 소리를 먼저 내고 이어서 우 소리를 내는 복합모음입니다.',
    imagePath: '/images/jamo/yu.png',
    tips: ['이 소리부터 시작하세요', '빠르게 우 소리로 이어가세요']
  },
  {
    jamo: 'ㅡ',
    name: '으',
    description: '입을 거의 닫은 상태에서 혀를 뒤쪽 높은 위치에서 내는 소리입니다.',
    imagePath: '/images/jamo/eu.png',
    tips: ['입을 거의 닫고 가로로 살짝 벌리세요', '혀를 뒤로 최대한 당기세요']
  },
  {
    jamo: 'ㅢ',
    name: '의',
    description: '으 소리와 이 소리를 연결하여 내는 복합모음입니다.',
    imagePath: '/images/jamo/ui.png',
    tips: ['으 소리부터 시작하세요', '빠르게 이 소리로 이어가세요']
  },
  {
    jamo: 'ㅣ',
    name: '이',
    description: '입술을 옆으로 벌리고 혀를 앞쪽 높은 위치에서 내는 소리입니다.',
    imagePath: '/images/jamo/i.png',
    tips: ['입꼬리를 양쪽으로 당기세요', '혀를 앞으로 높이 올리세요']
  }
];

const OralStructureView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL params나 state에서 틀린 음소 정보를 받아옵니다
  const incorrectPhonemes = location.state?.incorrectPhonemes || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState<'consonant' | 'vowel'>('consonant');
  
  // 틀린 음소만 필터링하고 자음/모음으로 분류
  const filteredConsonants = consonantData.filter(item => 
    incorrectPhonemes.includes(item.jamo) && getPhonemeType(item.jamo) === 'consonant'
  );
  const filteredVowels = vowelData.filter(item => 
    incorrectPhonemes.includes(item.jamo) && getPhonemeType(item.jamo) === 'vowel'
  );
  
  const currentData = currentTab === 'consonant' ? filteredConsonants : filteredVowels;
  const currentItem = currentData[currentIndex];

  const handleGoBack = () => navigate(-1);
  
  const handleNext = () => {
    if (currentIndex < currentData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (currentTab === 'consonant' && filteredVowels.length > 0) {
      setCurrentTab('vowel');
      setCurrentIndex(0);
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentTab === 'vowel' && filteredConsonants.length > 0) {
      setCurrentTab('consonant');
      setCurrentIndex(filteredConsonants.length - 1);
    }
  };

  const handleTabChange = (tab: 'consonant' | 'vowel') => {
    setCurrentTab(tab);
    setCurrentIndex(0);
  };

  // 전체 진행률 계산
  const totalItems = filteredConsonants.length + filteredVowels.length;
  const currentProgress = currentTab === 'consonant' 
    ? currentIndex + 1 
    : filteredConsonants.length + currentIndex + 1;

  if (totalItems === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <button onClick={handleGoBack} className="p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center font-medium">구강 구조 학습</div>
          <div className="w-5"></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-600 mb-2">학습할 음소가 없습니다</h2>
            <p className="text-gray-500">모든 발음이 정확해요! 🎉</p>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 w-full">
          <NavBar />
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <button onClick={handleGoBack} className="p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center font-medium">구강 구조 학습</div>
          <div className="w-5"></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-600 mb-2">현재 탭에 학습할 음소가 없습니다</h2>
            <p className="text-gray-500">다른 탭을 확인해보세요.</p>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 w-full">
          <NavBar />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <button onClick={handleGoBack} className="p-1 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center font-medium">구강 구조 학습</div>
        <div className="w-5"></div>
      </div>

      {/* 진행률 표시 */}
      <div className="px-6 py-4 bg-blue-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg text-blue-600 font-bold">
            {currentProgress} / {totalItems}
          </span>
          <span className="text-lg text-blue-600 font-semibold">
            {Math.round((currentProgress / totalItems) * 100)}% 완료
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(currentProgress / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-100">
        <button
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${
            currentTab === 'consonant' 
              ? 'text-blue-600 border-b-3 border-blue-600' 
              : 'text-gray-500'
          }`}
          onClick={() => handleTabChange('consonant')}
          disabled={filteredConsonants.length === 0}
        >
          자음 ({filteredConsonants.length})
        </button>
        <button
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${
            currentTab === 'vowel' 
              ? 'text-blue-600 border-b-3 border-blue-600' 
              : 'text-gray-500'
          }`}
          onClick={() => handleTabChange('vowel')}
          disabled={filteredVowels.length === 0}
        >
          모음 ({filteredVowels.length})
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto pb-24">
        <div className="p-4">
          {/* 음소 카드 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* 음소 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 text-center">
              <div className="text-8xl font-bold mb-3">{currentItem.jamo}</div>
              <div className="text-2xl font-bold">{currentItem.name}</div>
            </div>

            {/* 입모양 이미지 */}
            <div className="p-6 text-center bg-gray-50">
              <div className="inline-block bg-white rounded-xl p-6 shadow-lg">
                <img 
                  src={currentItem.imagePath}
                  alt={`${currentItem.name} 발음 입모양`}
                  className="w-56 h-56 object-contain mx-auto"
                  onError={(e) => {
                    // 이미지 로드 실패 시 대체 이미지 또는 텍스트 표시
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const container = target.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="w-56 h-56 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span class="text-gray-500 text-lg">이미지 준비중</span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>

            {/* 발음 설명 */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">발음 방법</h3>
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                {currentItem.description}
              </p>

              <h4 className="text-lg font-bold text-gray-800 mb-3">발음 팁</h4>
              <ul className="space-y-3">
                {currentItem.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-gray-700 text-lg">
                    <span className="text-blue-500 mr-3 mt-1 text-xl">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 연습 안내 */}
          <div className="bg-blue-50 rounded-lg p-6 text-center mt-4">
            <p className="text-blue-700 text-lg font-medium">
              거울을 보며 입모양을 따라해보고, 여러 번 반복해서 연습해보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 컨트롤 */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100 shadow-lg">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 && currentTab === 'consonant'}
          className={`flex items-center px-6 py-3 rounded-lg font-bold text-lg transition-all ${
            currentIndex === 0 && currentTab === 'consonant'
              ? 'text-gray-400 cursor-not-allowed bg-gray-100'
              : 'text-blue-600 hover:bg-blue-50 bg-blue-50'
          }`}
        >
          <PrevIcon size={20} className="mr-2" />
          이전
        </button>

        <div className="text-lg font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
          {currentItem.jamo} ({currentIndex + 1}/{currentData.length})
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === currentData.length - 1 && currentTab === 'vowel'}
          className={`flex items-center px-6 py-3 rounded-lg font-bold text-lg transition-all ${
            currentIndex === currentData.length - 1 && currentTab === 'vowel'
              ? 'text-gray-400 cursor-not-allowed bg-gray-100'
              : 'text-blue-600 hover:bg-blue-50 bg-blue-50'
          }`}
        >
          다음
          <ArrowRight size={20} className="ml-2" />
        </button>
      </div>

      {/* 하단 네비게이션 바 */}
      <div className="fixed bottom-0 left-0 right-0 w-full">
        <NavBar />
      </div>
    </div>
  );
};

export default OralStructureView;