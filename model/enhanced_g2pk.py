import re

from g2pk.g2pk import G2p as OriginalG2p


class EnhancedG2p(OriginalG2p):
    """Enhanced version of G2p with improved pattern matching"""
    
    def __init__(self):
        super().__init__()
        # 개별 단어 패턴 (직접 대체가 필요한 예외 케이스)
        self.word_patterns = {
            "밝기": "발끼",
        }

    def block_unnecessary_linking(self, text):
        """을/를 조사 뒤에 공백 + ㅇ으로 시작하는 단어가 오는 경우 연음을 방지"""
        # 을/를 + 공백 + ㅇ으로 시작하는 단어 패턴 찾기
        # 여기서는 g2pk 변환 전에 미리 처리해야 함
        # 특수 문자 삽입을 통해 연음 방지 (변환 후 제거)
        # 예: "책을 읽다" -> "책을␣읽다" (␣는 특수 공백 문자)
        pattern = r'([가-힣]+[을를])\s+([아-잏])'
        text = re.sub(pattern, r'\1␣\2', text)
        
        return text
        
    def restore_spacing(self, text):
        """특수 문자로 처리된 공백을 복원"""
        return text.replace('␣', ' ')
        
    def process_patterns(self, text):
        """패턴 사전을 사용해 발음 변환 처리"""
        # 단어 패턴 사전에서 치환
        for pattern, replacement in self.word_patterns.items():
            if pattern in text:
                text = text.replace(pattern, replacement)
                            
        return text
        
    def __call__(self, string, descriptive=False, verbose=False, group_vowels=False, to_syl=True):
        """기존 G2p를 호출하되, 특정 패턴을 처리"""
        
        # 1. 연음 방지 패턴 처리 (g2pk 변환 전)
        string = self.block_unnecessary_linking(string)
        
        # 2. g2pk 원본 처리
        result = super().__call__(string, descriptive, verbose, group_vowels, to_syl)
        
        # 3. 특수 공백 복원
        result = self.restore_spacing(result)
        
        # 4. 발음 패턴 처리 (g2pk 변환 후)
        result = self.process_patterns(result)

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
        
        "줄게",      # -> 줄께
        "할게",      # -> 할께
        "볼게요",    # -> 볼께요
        "만들게",    # -> 만들께
        
        # 다양한 문장 테스트
        "내일 학교에 갈게",  # -> 내일 학교에 갈께
        "이거 한번 먹을게",  # -> 이거 한번 먹을께
        "내가 알려줄게",     # -> 내가 알려줄께
        "이 책을 읽을게요",  # -> 이 책을 읽을께요
        "그건 내가 할게",     # -> 그건 내가 할께
        "가지를 읽을게요",
        "책 앞에 있어요"

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
