export const preprocessText = (text: string | undefined | null, removeSpaces = true, removePunctuation = true): string => {
  if (!text || typeof text !== 'string') return '';
  let result = text.trim();
  if (removePunctuation) {
    result = result.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g, '');
  }
  if (removeSpaces) {
    result = result.replace(/\s+/g, '');
  }
  return result;
};

export const calculateLevenshtein = (u: string[], v: string[]) => {
  if (!Array.isArray(u) || !Array.isArray(v)) {
    console.error('calculateLevenshtein: 입력이 배열이 아닙니다', { u, v });
    return { distance: 0, substitutions: 0, deletions: 0, insertions: 0 };
  }
  if (u.length === 0 && v.length === 0) {
    return { distance: 0, substitutions: 0, deletions: 0, insertions: 0 };
  }
  if (u.length === 0) {
    return { distance: v.length, substitutions: 0, deletions: 0, insertions: v.length };
  }
  if (v.length === 0) {
    return { distance: u.length, substitutions: 0, deletions: u.length, insertions: 0 };
  }
  const prev: number[] = Array(v.length + 1).fill(0).map((_, i) => i);
  let curr: number[] = new Array(v.length + 1);
  const prevOps: [number, number, number][] = Array(v.length + 1).fill(null).map((_, i) => [0, 0, i]);
  let currOps: [number, number, number][] = new Array(v.length + 1);

  for (let x = 1; x <= u.length; x++) {
    curr[0] = x;
    currOps[0] = [0, x, 0];
    for (let y = 1; y <= v.length; y++) {
      const delCost = prev[y] + 1;
      const insCost = curr[y - 1] + 1;
      const subCost = prev[y - 1] + (u[x - 1] !== v[y - 1] ? 1 : 0);

      if (subCost <= delCost && subCost <= insCost) {
        curr[y] = subCost;
        const [s, d, i] = prevOps[y - 1];
        currOps[y] = [s + (u[x - 1] !== v[y - 1] ? 1 : 0), d, i];
      } else if (delCost < insCost) {
        curr[y] = delCost;
        const [s, d, i] = prevOps[y];
        currOps[y] = [s, d + 1, i];
      } else {
        curr[y] = insCost;
        const [s, d, i] = currOps[y - 1];
        currOps[y] = [s, d, i + 1];
      }
    }
    for (let i = 0; i <= v.length; i++) {
      prev[i] = curr[i];
      prevOps[i] = [...currOps[i]];
    }
  }
  const [substitutions, deletions, insertions] = prevOps[v.length];
  return {
    distance: prev[v.length],
    substitutions,
    deletions,
    insertions,
  };
};



// 정확도 계산 함수
export const calculateAccuracyScore = (
  recognizedText: string | undefined | null,
  correctedText: string | undefined | null
): number => {
    console.log('정확도 계산 시작:', { recognizedText, correctedText });
    
    // 입력값 유효성 검사
    if (!recognizedText || !correctedText) {
      console.warn('정확도 계산: 입력 텍스트가 없습니다');
      return 0;
    }

    try {
      const hyp = preprocessText(recognizedText, true, true);
      const ref = preprocessText(correctedText, true, true);
      
      console.log('전처리 결과:', { hyp, ref });

      if (!hyp || !ref) {
        console.warn('정확도 계산: 전처리 후 텍스트가 비어있습니다');
        return 0;
      }

      const hypChars = Array.from(hyp);
      const refChars = Array.from(ref);
      
      console.log('문자 배열:', { hypChars, refChars });

      if (!Array.isArray(hypChars) || !Array.isArray(refChars)) {
        console.error('정확도 계산: Array.from() 실패');
        return 0;
      }

      const { substitutions, deletions, insertions } = calculateLevenshtein(hypChars, refChars);
      const hits = refChars.length - substitutions - deletions;
      const total = substitutions + deletions + insertions + hits;

      console.log('레벤슈타인 결과:', { substitutions, deletions, insertions, hits, total });

      if (total === 0) {
        return 100;
      }

      const cer = (substitutions + deletions + insertions) / total;
      const crr = 1 - cer;
      const accuracy = Math.max(0, Math.min(100, Math.round(crr * 100)));
      
      console.log('최종 정확도:', accuracy);
      return accuracy;
      
    } catch (error) {
      console.error('정확도 계산 중 오류:', error);
      return 0;
    }
  };