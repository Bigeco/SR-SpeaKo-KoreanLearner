/**
 * 음소 분석 및 비교 유틸리티
 */

// 한글 자모 분해 함수
function decomposeHangul(char: string): { initial?: string; medial?: string; final?: string } {
  const code = char.charCodeAt(0);
  
  // 한글 완성형 범위 확인 (가-힣)
  if (code < 0xAC00 || code > 0xD7A3) {
    return {};
  }
  
  // 초성, 중성, 종성 추출
  const base = code - 0xAC00;
  const initial = Math.floor(base / 588);
  const medial = Math.floor((base % 588) / 28);
  const final = base % 28;
  
  // 자모 매핑 테이블
  const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  const result: { initial?: string; medial?: string; final?: string } = {};
  
  if (initials[initial]) result.initial = initials[initial];
  if (medials[medial]) result.medial = medials[medial];
  if (final > 0 && finals[final]) result.final = finals[final];
  
  return result;
}

// 문장에서 모든 음소 추출
function extractPhonemes(text: string): string[] {
  const phonemes: string[] = [];
  
  console.log('extractPhonemes 입력:', text);
  
  for (const char of text) {
    if (char.match(/[가-힣]/)) {
      const decomposed = decomposeHangul(char);
      console.log(`문자 "${char}" 분해:`, decomposed);
      if (decomposed.initial) phonemes.push(decomposed.initial);
      if (decomposed.medial) phonemes.push(decomposed.medial);
      if (decomposed.final) phonemes.push(decomposed.final);
    }
  }
  
  console.log('추출된 음소들:', phonemes);
  return phonemes;
}

// 단순한 문자 단위 비교 함수 (디버깅용)
function simpleCharacterDiff(userText: string, correctText: string): string[] {
  const userChars = Array.from(userText);
  const correctChars = Array.from(correctText);
  const incorrectPhonemes: string[] = [];
  
  console.log('simpleCharacterDiff:', { userChars, correctChars });
  
  const maxLen = Math.max(userChars.length, correctChars.length);
  
  for (let i = 0; i < maxLen; i++) {
    const userChar = userChars[i] || '';
    const correctChar = correctChars[i] || '';
    
    if (userChar !== correctChar) {
      console.log(`차이 발견: 위치 ${i}, "${userChar}" vs "${correctChar}"`);
      
      // 잘못된 음소 (사용자가 발음한 것)의 음소들 추출
      if (userChar && userChar.match(/[가-힣]/)) {
        const userPhonemes = extractPhonemes(userChar);
        incorrectPhonemes.push(...userPhonemes);
      }
      
      // 올바른 음소 추가 (학습해야 할 것)
      if (correctChar && correctChar.match(/[가-힣]/)) {
        const correctPhonemes = extractPhonemes(correctChar);
        incorrectPhonemes.push(...correctPhonemes);
      }
    }
  }
  
  return [...new Set(incorrectPhonemes)]; // 중복 제거
}

/**
 * 사용자 발음과 정확한 발음을 비교하여 잘못 발음한 음소들을 찾습니다.
 * @param userText 사용자가 실제 발음한 텍스트 (Wav2Vec2 결과)
 * @param correctText 정확한 발음 텍스트 (G2PK 변환 결과)
 * @returns 잘못 발음한 음소들의 배열
 */
export function analyzeIncorrectPhonemes(userText: string, correctText: string): string[] {
  console.log('🔍 analyzeIncorrectPhonemes 시작:', { userText, correctText });
  
  if (!userText || !correctText) {
    console.log('❌ 입력 텍스트가 없음');
    return [];
  }
  
  // 텍스트 전처리 - 공백만 제거, 한글은 유지
  const cleanUserText = userText.replace(/\s+/g, '');
  const cleanCorrectText = correctText.replace(/\s+/g, '');
  
  console.log('🧹 전처리 결과:', { cleanUserText, cleanCorrectText });
  
  if (!cleanUserText || !cleanCorrectText) {
    console.log('❌ 전처리 후 텍스트가 비어있음');
    return [];
  }
  
  // 텍스트가 동일한 경우
  if (cleanUserText === cleanCorrectText) {
    console.log('✅ 텍스트가 동일함, 틀린 음소 없음');
    return [];
  }
  
  // 단순한 문자 단위 비교 사용
  const incorrectPhonemes = simpleCharacterDiff(cleanUserText, cleanCorrectText);
  
  console.log('🎯 최종 틀린 음소들:', incorrectPhonemes);
  return incorrectPhonemes;
}

/**
 * 음소가 자음인지 모음인지 판별합니다.
 * @param phoneme 판별할 음소
 * @returns 'consonant' | 'vowel' | 'unknown'
 */
export function getPhonemeType(phoneme: string): 'consonant' | 'vowel' | 'unknown' {
  const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  
  if (consonants.includes(phoneme)) return 'consonant';
  if (vowels.includes(phoneme)) return 'vowel';
  return 'unknown';
}