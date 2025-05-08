import re

from g2pk2 import G2p as OriginalG2p


class EnhancedG2p(OriginalG2p):
    """Enhanced version of G2p with improved pattern matching"""
    
    def __init__(self):
        super().__init__()
        # 개별 단어 패턴 (직접 대체가 필요한 예외 케이스)
        self.word_patterns = {
            "밝기": "발끼",
        }
        
    def restore_spacing(self, text):
        """특수 문자로 처리된 공백을 복원"""
        return text.replace('␣', ' ')
        
    def process_patterns(self, text):
        """패턴 사전을 사용해 발음 변환 처리"""
        for pattern, replacement in self.word_patterns.items():
            if pattern in text:
                text = text.replace(pattern, replacement)
                            
        return text
    
    def process_verb_endings(self, text):
        """의도/약속을 나타내는 종결 어미 '-게'만 '-께'로 변환"""
        # 단독 '하게', '하게요' 패턴 직접 처리
        if text == '하게' or text == '하게요':
            return text
        
        # 복사본 생성
        result = text
        
        # 보호할 세그먼트 저장을 위한 딕셔너리
        protected_segments = {}
        marker_counter = 0

        # '에게', '내게' 조사 보호 (완전 대체)
        for protect_pattern in ['에게', '내게']:
            while protect_pattern in result:
                marker = f"__PROTECTED_{marker_counter}__"
                protected_segments[marker] = protect_pattern
                result = result.replace(protect_pattern, marker, 1)  # 한 번에 하나씩 대체
                marker_counter += 1

        # 일반적인 형용사 + '게' 패턴 보호
        adj_stems = ['가냘프', '가늘', '가파르', '거세', '거칠', '건조하', '검', '게으르', '고르', '고달프',
                      '고맙', '곱', '고프', '곧', '굳', '굵', '귀엽', '기쁘', '길', '깊', '깨끗하', 
                      '나쁘', '낮', '너그럽', '너르', '노랗', '높', '눅', '느리', '늦', '더럽', 
                      '더웁', '둥글', '드물', '딱하', '뛰어나', '뜨겁', '많', '멀', '멋지', '메마르', 
                      '메스껍', '못나', '못되', '못생기', '무겁', '무디', '무르', '무섭', '미끈하', ''
                      '미워하', '미치', '반갑', '보드랍', '보람차', '보잘것없', '부드럽', '부르', 
                      '붉', '비싸', '빠르', '뼈저리', '새롭', '서툴', '섣부르', '성가시', '세', 
                      '수다스럽', '수줍', '쉽', '슬프', '싫', '싸', '쌀쌀맞', '쏜살같', '쓰디쓰', 
                      '쓰리', '쓰', '아름답', '아쉽', '아프', '안쓰럽', '안타깝', '약삭빠르', 
                      '약', '얇', '얕', '어둡', '어렵', '어리', '언짢', '없', '열띠', '예쁘', 
                      '올바르', '외롭', '우습', '의심쩍', '이르', '익', '있', '작', '잘나', '잘빠지', 
                      '재미있', '적', '젊', '점잖', '조그맣', '좁', '좋', '주제넘', '줄기차', '즐겁', 
                      '지나치', '지혜롭', '질기', '짓궂', '짙', '케케묵', '크', '탐스럽', '턱없', 
                      '푸르', '흐리', '희망차', '희', '힘겹', '힘차','만들']
        
       # 형용사 어간 + '게' 패턴 보호 (완전 대체)
        for stem in adj_stems:
            pattern = stem + '게'
            while pattern in result:
                marker = f"__PROTECTED_{marker_counter}__"
                protected_segments[marker] = pattern
                result = result.replace(pattern, marker, 1)  # 한 번에 하나씩 대체
                marker_counter += 1

        
        # '하게'로 끝나는 모든 패턴 보호 (완전 대체)
        hage_pattern = re.compile(r'([가-힣]+)하게')
        for match in hage_pattern.finditer(result):
            full_match = match.group(0)
            marker = f"__PROTECTED_{marker_counter}__"
            protected_segments[marker] = full_match
            
            # 정확히 해당 위치의 문자열만 대체
            start = match.start()
            end = match.end()
            result = result[:start] + marker + result[end:]
            
            marker_counter += 1
            # 위치가 바뀌었으므로 패턴 다시 찾아야 함
            hage_pattern = re.compile(r'([가-힣]+)하게')
        
        # 용언 어간 받침 'ㄹ' + '게' 패턴 변환 (의도/약속 표현)
        result = re.sub(r'([갈-힐])\s*게(요)?', r'\1께\2', result)
        
        # 보호된 세그먼트 복원
        for marker, original in protected_segments.items():
            result = result.replace(marker, original)
        
        return result
    
    def fix_rhotacization(self, original_text, g2p_text):
        """
        종성 ㄹ + 띄어쓰기 + 초성 ㄴ 패턴에서 유음화가 발생한 경우를 원래대로 복원
        """
        # G2p 텍스트에서 유음화된 패턴 직접 찾기 (종성 ㄹ + 공백 + 초성 ㄹ)
        rhot_pattern = re.compile(r'([가-힣]*[갈-힐])\s+([라-맇][가-힣]*)')
        result = g2p_text
        
        # 모든 유음화된 패턴 찾기
        rhot_matches = list(rhot_pattern.finditer(result))
        
        for i, rhot_match in enumerate(rhot_matches):
            # 유음화된 패턴
            rhot_full = rhot_match.group(0)
            l_word = rhot_match.group(1)
            r_word = rhot_match.group(2)
        
            # 초성 ㄹ 음절을 초성 ㄴ 음절로 변환
            r_syllable = r_word[0]  # 첫 음절 (ㄹ 초성)
            
            char_code = ord(r_syllable) - ord('가')
            initial = char_code // 588
            medial = (char_code % 588) // 28
            final = char_code % 28
            
            # 초성이 'ㄹ'인지 확인 (초성 코드 5가 'ㄹ'에 해당)
            if initial == 5:
                # 'ㄴ'으로 바꾼 문자 계산 (초성 코드 2가 'ㄴ'에 해당)
                new_char_code = (2 * 588) + (medial * 28) + final
                new_char = chr(new_char_code + ord('가'))
                
                # 변환된 첫 글자를 가진 단어 생성
                n_word = new_char + r_word[1:]
                
                # 유음화 패턴 교정
                start = rhot_match.start(2)  # 두 번째 그룹의 시작 위치
                end = rhot_match.end(2)      # 두 번째 그룹의 끝 위치
                result = result[:start] + n_word + result[end:]
        
        return result
        
    def __call__(self, string, descriptive=False, verbose=False, group_vowels=False, to_syl=True):
        """기존 G2p를 호출하되, 특정 패턴을 처리"""
        
        # 1. 발음 패턴 처리 (g2pk 처리 전)
        result = self.process_patterns(string)
        
        # 2. 원본 문자열 저장 (나중에 유음화 처리에 사용)
        original_string = result
        
        # 3. g2pk 원본 처리
        result = super().__call__(result, descriptive, verbose, group_vowels, to_syl)
        
        # 4. 특수 공백 복원
        result = self.restore_spacing(result)
        
        # 5. 유음화 패턴 교정 (원본과 g2p 처리된 결과 비교)
        result = self.fix_rhotacization(original_string, result)
        
        # 6. 용언 + 게 패턴 처리
        result = self.process_verb_endings(result)

        return result


def convert_text(text, **kwargs):
    """Helper function to convert text using EnhancedG2p"""
    g2p = EnhancedG2p()
    return g2p(text, **kwargs)

'''
if __name__ == "__main__":
    # Create an instance of EnhancedG2p
    g2p = EnhancedG2p()
    
    # Test examples to show the enhancement
    test_examples = [
        # ㄺ + ㄱ 규칙 테스트
        "밝기",      # -> 발끼
        "짧게",
        "줄게 있어",      # -> 줄께
        "할게",      # -> 할께
        "볼게요",    # -> 볼께요
        "만들게",    # -> 만들께
        "높게",
        "길게",
        "선명하게",
        "할 게 없어",
        "곱게",
        "가냘프게",
        "고달프게",
        "서툴게",
        "굳게",
        "곧게",
        "주열이에게 알려줄게",
        
        # 다양한 문장 테스트
        "내일 학교에 갈게",  # -> 내일 학교에 갈께
        "이거 한번 먹을게",  # -> 이거 한번 먹을께
        "내가 알려줄게",     # -> 내가 알려줄께
        "이 책을 읽을게요",  # -> 이 책을 읽을께요
        "그건 내가 할게",     # -> 그건 내가 할께
        "가지를 읽을게요",
        "책 앞에 있어요",
        "그 곳으로 갈게요",
        "길게 자르세요",
        "포상은 열심히 한 아이에게만 주어지기 때문에 포상인 것입니다.",
        "비록 요즘은 전염병 때문에 출입국이 쉽지 않지만",
        "인간 들을 내게 바쳐라.",
        "열심히 할 나이에",
        "물 넣기",     
        "달 너머",     
        "술 남기지 마세요",  
        "글 내용이 좋아요",
        "감탄을 내게, 지원을 나비에게"

    ]
    
    print("Original vs Enhanced G2p comparison:")
    print("-" * 50)
    
    original_g2p = OriginalG2p()
    
    for example in test_examples:
        original_result = original_g2p(example)
        enhanced_result = g2p(example)
        
        print(f"Input: {example}")
        print(f"Original G2p: {original_result}")
        print(f"Enhanced G2p: {enhanced_result}")
        print("-" * 50)
'''
