/**
 * 한국어 CER/CRR 계산 유틸리티 (Python cer_module.py 포팅)
 */

/**
 * 텍스트 전처리 함수
 */
function preprocessText(text: string, removeSpaces = false, removePunctuation = false): string {
  let processed = text;
  
  if (removePunctuation) {
    // 한글, 영문, 숫자를 제외한 문장부호 등 제거
    processed = processed.replace(/[^\w\s가-힣]/g, '');
  }
  
  if (removeSpaces) {
    // 모든 공백 제거
    processed = processed.replace(/\s/g, '');
  }
  
  return processed;
}

/**
 * 두 문자열 간의 레벤슈타인 거리와 작업 세부 정보(대체, 삭제, 삽입)를 계산
 */
function calculateLevenshtein(u: string[], v: string[]): [number, [number, number, number]] {
  let prev: number[] | null = null;
  let curr: number[] = [0, ...Array.from({ length: v.length }, (_, i) => i + 1)];
  
  // 작업: [대체, 삭제, 삽입]
  let prevOps: [number, number, number][] | null = null;
  let currOps: [number, number, number][] = Array.from({ length: v.length + 1 }, (_, i) => [0, 0, i]);
  
  for (let x = 1; x <= u.length; x++) {
    prev = curr;
    curr = [x, ...Array(v.length).fill(null)];
    prevOps = currOps;
    currOps = [[0, x, 0], ...Array(v.length).fill(null)];
    
    for (let y = 1; y <= v.length; y++) {
      const delCost = prev[y] + 1;
      const addCost = curr[y - 1] + 1;
      const subCost = prev[y - 1] + (u[x - 1] !== v[y - 1] ? 1 : 0);
      
      curr[y] = Math.min(subCost, delCost, addCost);
      
      if (curr[y] === subCost) {
        const [nS, nD, nI] = prevOps![y - 1];
        currOps[y] = [nS + (u[x - 1] !== v[y - 1] ? 1 : 0), nD, nI];
      } else if (curr[y] === delCost) {
        const [nS, nD, nI] = prevOps![y];
        currOps[y] = [nS, nD + 1, nI];
      } else {
        const [nS, nD, nI] = currOps[y - 1];
        currOps[y] = [nS, nD, nI + 1];
      }
    }
  }
  
  return [curr[v.length], currOps[v.length]];
}

/**
 * 한국어 문장의 CER(Character Error Rate)을 계산
 */
export function calculateKoreanCER(
  reference: string, 
  hypothesis: string, 
  removeSpaces = true, 
  removePunctuation = true
): {
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
} {
  console.log('🎯 CER 계산 시작:', { reference, hypothesis, removeSpaces, removePunctuation });
  
  // 전처리
  const ref = preprocessText(reference, removeSpaces, removePunctuation);
  const hyp = preprocessText(hypothesis, removeSpaces, removePunctuation);
  
  console.log('🧹 전처리 결과:', { ref, hyp });
  
  const refChars = Array.from(ref);
  const hypChars = Array.from(hyp);
  
  const [_, [substitutions, deletions, insertions]] = calculateLevenshtein(hypChars, refChars);
  
  const hits = refChars.length - (substitutions + deletions);
  const incorrect = substitutions + deletions + insertions;
  const total = substitutions + deletions + hits + insertions;
  
  const cer = total > 0 ? Math.round((incorrect / total) * 10000) / 10000 : 0;
  
  const result = {
    cer,
    substitutions,
    deletions,
    insertions
  };
  
  console.log('📊 CER 계산 결과:', result);
  return result;
}

/**
 * 한국어 문장의 CRR(정확도)을 계산
 * CRR = 1 - CER
 */
export function calculateKoreanCRR(
  reference: string, 
  hypothesis: string, 
  removeSpaces = true, 
  removePunctuation = true
): {
  crr: number;
  accuracy: number; // 백분율로 표시
  substitutions: number;
  deletions: number;
  insertions: number;
} {
  const cerResult = calculateKoreanCER(reference, hypothesis, removeSpaces, removePunctuation);
  const crr = Math.round((1 - cerResult.cer) * 10000) / 10000;
  const accuracy = Math.round(crr * 100); // 0-100 백분율
  
  const result = {
    crr,
    accuracy,
    substitutions: cerResult.substitutions,
    deletions: cerResult.deletions,
    insertions: cerResult.insertions
  };
  
  console.log('🎯 CRR 계산 결과:', result);
  return result;
}