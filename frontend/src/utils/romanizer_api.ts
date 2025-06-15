/**
 * Parses a LLaMA3 romanization result string of the form "(wrong)->(correct)"
 * and returns an object with wrong and correct romanizations.
 * @param result The result string from LLaMA3, e.g. "(phaak-chi)->(bal-ki)"
 */
const LLAMA_SERVER_URL = 'https://speako-llama-server.hf.space';

export function parseLLaMA3RomanizationResult(result: string): { wrong: string, correct: string } | null {
  const match = result.match(/^\(([^)]+)\)->\(([^)]+)\)$/);
  if (!match) return null;
  return {
    wrong: match[1],
    correct: match[2]
  };
}

/**
 * 두 문장을 비교해 다른 부분 쌍을 추출하고, 각 쌍마다 llama3 API를 호출해 로마자 표기를 받아 배열로 반환합니다.
 * @param userInput 인식된 문장
 * @param correctInput 교정된 문장
 * @returns 각 단어/음절별 wrong/correct 로마자 표기 배열
 */
export async function getRomanizationAlignments(
  userInput: string,
  correctInput: string
): Promise<{ wrong: string[], correct: string[] }> {
  // 1. 띄어쓰기 단위로 분리 (음절 단위로 하려면 .split('') 사용)
  const userWords = userInput.split(' ');
  const correctWords = correctInput.split(' ');
  const maxLen = Math.max(userWords.length, correctWords.length);

  // 2. 다른 부분 쌍 추출
  const diffPairs: { idx: number, user: string, correct: string }[] = [];
  for (let i = 0; i < maxLen; i++) {
    const u = userWords[i] || '';
    const c = correctWords[i] || '';
    if (u !== c) {
      diffPairs.push({ idx: i, user: u, correct: c });
    }
  }

  // 3. llama3 API 호출 (HuggingFace Space 서버 사용)
  const results: { idx: number, wrong: string, correct: string }[] = await Promise.all(
    diffPairs.map(async ({ idx, user, correct }) => {
      const response = await fetch(`${LLAMA_SERVER_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ user_input: user, correct_input: correct })
      });
      const data = await response.json();
      // data.result가 "(phaak)->(bal)" 형태라고 가정
      const parsed = parseLLaMA3RomanizationResult(data.result);
      return {
        idx,
        wrong: parsed?.wrong || '',
        correct: parsed?.correct || ''
      };
    })
  );

  // 4. 결과를 원래 문장 길이에 맞게 배열로 매핑
  const wrongArr = Array(maxLen).fill('');
  const correctArr = Array(maxLen).fill('');
  results.forEach(({ idx, wrong, correct }) => {
    wrongArr[idx] = wrong;
    correctArr[idx] = correct;
  });

  return { wrong: wrongArr, correct: correctArr };
}

/**
 * Returns an array of romanizations only for differing syllables between user and correct, otherwise empty string.
 * @param userSyllables 한글 음절 배열 (예: ['구','학','을'])
 * @param correctSyllables 정답 한글 음절 배열 (예: ['수','학','을'])
 * @param romanizationSyllables 로마자 표기 배열 (예: ['gu','hak','eul'])
 * @returns string[] (예: ['gu', '', ''])
 */
export function getDiffRomanizations(
  userSyllables: string[],
  correctSyllables: string[],
  romanizationSyllables: string[]
): string[] {
  return userSyllables.map((syll, idx) =>
    syll !== (correctSyllables[idx] || '') ? (romanizationSyllables[idx] || '') : ''
  );
}
