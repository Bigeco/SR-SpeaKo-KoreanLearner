/**
 * 띄어쓰기 교정을 통한 로마자 정렬 개선 유틸리티
 */

interface LevenshteinOperation {
  type: 'match' | 'substitute' | 'insert' | 'delete';
  sourceIndex: number;
  targetIndex: number;
  sourceChar?: string;
  targetChar?: string;
}

/**
 * 레벤슈타인 거리와 함께 편집 연산 정보를 반환
 */
function getDetailedLevenshtein(source: string, target: string): {
  distance: number;
  operations: LevenshteinOperation[];
} {
  const sourceChars = Array.from(source);
  const targetChars = Array.from(target);
  const m = sourceChars.length;
  const n = targetChars.length;

  // DP 테이블과 연산 추적 테이블
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  const ops: string[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(''));

  // 초기화
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    ops[i][0] = 'delete';
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
    ops[0][j] = 'insert';
  }

  // DP 테이블 채우기
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (sourceChars[i - 1] === targetChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        ops[i][j] = 'match';
      } else {
        const substitute = dp[i - 1][j - 1] + 1;
        const insert = dp[i][j - 1] + 1;
        const delete_ = dp[i - 1][j] + 1;

        if (substitute <= insert && substitute <= delete_) {
          dp[i][j] = substitute;
          ops[i][j] = 'substitute';
        } else if (insert <= delete_) {
          dp[i][j] = insert;
          ops[i][j] = 'insert';
        } else {
          dp[i][j] = delete_;
          ops[i][j] = 'delete';
        }
      }
    }
  }

  // 백트래킹으로 연산 순서 복원
  const operations: LevenshteinOperation[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    const op = ops[i][j];
    
    switch (op) {
      case 'match':
        operations.unshift({
          type: 'match',
          sourceIndex: i - 1,
          targetIndex: j - 1,
          sourceChar: sourceChars[i - 1],
          targetChar: targetChars[j - 1]
        });
        i--; j--;
        break;
      case 'substitute':
        operations.unshift({
          type: 'substitute',
          sourceIndex: i - 1,
          targetIndex: j - 1,
          sourceChar: sourceChars[i - 1],
          targetChar: targetChars[j - 1]
        });
        i--; j--;
        break;
      case 'insert':
        operations.unshift({
          type: 'insert',
          sourceIndex: i,
          targetIndex: j - 1,
          targetChar: targetChars[j - 1]
        });
        j--;
        break;
      case 'delete':
        operations.unshift({
          type: 'delete',
          sourceIndex: i - 1,
          targetIndex: j,
          sourceChar: sourceChars[i - 1]
        });
        i--;
        break;
    }
  }

  return {
    distance: dp[m][n],
    operations
  };
}

/**
 * 정답 문장의 띄어쓰기 패턴을 추출
 */
function extractSpacingPattern(text: string): { words: string[], lengths: number[] } {
  const words = text.split(' ').filter(word => word.length > 0);
  const lengths = words.map(word => word.length);
  return { words, lengths };
}

/**
 * 마스킹 토큰을 사용한 문자열 처리
 */
const MASK_TOKEN = '◇';

/**
 * 띄어쓰기 교정 메인 함수
 */
export function correctSpacing(sourceText: string, targetText: string): string {
  console.log('🔧 띄어쓰기 교정 시작:', { sourceText, targetText });

  // 공백 제거한 버전으로 레벤슈타인 분석
  const sourceNoSpace = sourceText.replace(/\s+/g, '');
  const targetNoSpace = targetText.replace(/\s+/g, '');

  const { operations } = getDetailedLevenshtein(sourceNoSpace, targetNoSpace);
  console.log('편집 연산들:', operations);

  // 정답 문장의 띄어쓰기 패턴 추출
  const { lengths } = extractSpacingPattern(targetText);
  console.log('정답 문장 길이 패턴:', lengths);

  // 1단계: 삭제된 문자들을 마스킹 토큰으로 대체
  let correctedChars = Array.from(sourceNoSpace);
  const insertedChars: { char: string, position: number }[] = [];

  let offset = 0;
  operations.forEach(op => {
    switch (op.type) {
      case 'delete':
        // 삭제된 위치에 마스킹 토큰 삽입
        correctedChars.splice(op.sourceIndex + offset, 0, MASK_TOKEN);
        offset++;
        break;
      case 'insert':
        // 삽입된 문자는 별도 저장하고 원본에서 제거
        insertedChars.push({
          char: op.targetChar!,
          position: op.targetIndex
        });
        // 원본에서는 해당 위치의 문자를 제거하지 않음 (이미 없으므로)
        break;
      case 'substitute':
        // 치환은 그대로 유지 (나중에 처리)
        break;
    }
  });

  console.log('마스킹 적용 후:', correctedChars.join(''));
  console.log('삽입된 문자들:', insertedChars);

  // 2단계: 정답 문장의 띄어쓰기 패턴에 맞게 재배열
  let correctedText = '';
  let charIndex = 0;

  for (let i = 0; i < lengths.length; i++) {
    const wordLength = lengths[i];
    let word = '';

    // 현재 단어 길이만큼 문자 추출
    for (let j = 0; j < wordLength && charIndex < correctedChars.length; j++) {
      const char = correctedChars[charIndex];
      if (char !== MASK_TOKEN) {
        word += char;
      }
      // 마스킹 토큰이면 건너뛰지만 인덱스는 증가
      charIndex++;
    }

    // 현재 단어 위치에 삽입된 문자들 추가
    const wordStartPos = correctedText.replace(/\s+/g, '').length;
    const wordEndPos = wordStartPos + word.length;

    insertedChars.forEach(({ char, position }) => {
      if (position >= wordStartPos && position <= wordEndPos) {
        // 가장 가까운 위치에 삽입
        const relativePos = position - wordStartPos;
        if (relativePos <= word.length / 2) {
          word = char + word; // 단어 앞에 삽입
        } else {
          word = word + char; // 단어 뒤에 삽입
        }
      }
    });

    correctedText += word;
    if (i < lengths.length - 1) {
      correctedText += ' '; // 마지막 단어가 아니면 공백 추가
    }
  }

  // 3단계: 남은 문자들 처리
  const remainingChars = correctedChars.slice(charIndex).filter(char => char !== MASK_TOKEN);
  if (remainingChars.length > 0) {
    correctedText += ' ' + remainingChars.join('');
  }

  // 4단계: 남은 삽입 문자들 처리 (아직 추가되지 않은 것들)
  const addedPositions = new Set<number>();
  insertedChars.forEach(({ char, position }) => {
    if (!addedPositions.has(position)) {
      // 가장 가까운 단어 경계에 추가
      const words = correctedText.split(' ');
      let bestWordIndex = 0;
      let minDistance = Infinity;

      let currentPos = 0;
      words.forEach((word, index) => {
        const wordStart = currentPos;
        const wordEnd = currentPos + word.length;
        const distance = Math.min(
          Math.abs(position - wordStart),
          Math.abs(position - wordEnd)
        );

        if (distance < minDistance) {
          minDistance = distance;
          bestWordIndex = index;
        }

        currentPos += word.length;
      });

      // 선택된 단어에 문자 추가
      words[bestWordIndex] += char;
      correctedText = words.join(' ');
      addedPositions.add(position);
    }
  });

  console.log('띄어쓰기 교정 완료:', correctedText);
  return correctedText;
}

/**
 * 개선된 로마자 정렬 함수
 */
export async function getImprovedRomanizationAlignments(
  userInput: string,
  correctInput: string,
  getRomanizationAlignments: (user: string, correct: string) => Promise<{ wrong: string[], correct: string[] }>
): Promise<{ wrong: string[], correct: string[] }> {
  console.log('개선된 로마자 정렬 시작');
  console.log('원본 입력:', { userInput, correctInput });

  // 띄어쓰기 교정 적용
  const correctedUserInput = correctSpacing(userInput, correctInput);
  console.log('교정된 사용자 입력:', correctedUserInput);

  // 교정된 텍스트로 로마자 정렬 수행
  const result = await getRomanizationAlignments(correctedUserInput, correctInput);
  
  console.log('로마자 정렬 결과:', result);
  return result;
}
