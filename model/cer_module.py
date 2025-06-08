import re

import numpy as np
import torch
import torchaudio
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

def preprocess_text(text, remove_spaces=False, remove_punctuation=False):
    """
    텍스트 전처리 함수
    
    Args:
        text (str): 전처리할 텍스트
        remove_spaces (bool): 공백 제거 여부
        remove_punctuation (bool): 문장부호 제거 여부
    
    Returns:
        str: 전처리된 텍스트
    """
    if remove_punctuation:
        # 한글, 영문, 숫자를 제외한 문장부호 등 제거
        text = re.sub(r'[^\w\s]', '', text)
    
    if remove_spaces:
        # 모든 공백 제거
        text = text.replace(' ', '')
    
    return text

def calculate_levenshtein(u, v):
    """
    두 문자열 간의 레벤슈타인 거리와 작업 세부 정보(대체, 삭제, 삽입)를 계산
    
    Args:
        u (list): 첫 번째 문자열(문자 리스트)
        v (list): 두 번째 문자열(문자 리스트)
    
    Returns:
        tuple: (편집 거리, (대체 수, 삭제 수, 삽입 수))
    """
    prev = None
    curr = [0] + list(range(1, len(v) + 1))
    # 작업: (대체, 삭제, 삽입)
    prev_ops = None
    curr_ops = [(0, 0, i) for i in range(len(v) + 1)]
    
    for x in range(1, len(u) + 1):
        prev, curr = curr, [x] + ([None] * len(v))
        prev_ops, curr_ops = curr_ops, [(0, x, 0)] + ([None] * len(v))
        
        for y in range(1, len(v) + 1):
            delcost = prev[y] + 1
            addcost = curr[y - 1] + 1
            subcost = prev[y - 1] + int(u[x - 1] != v[y - 1])
            
            curr[y] = min(subcost, delcost, addcost)
            
            if curr[y] == subcost:
                (n_s, n_d, n_i) = prev_ops[y - 1]
                curr_ops[y] = (n_s + int(u[x - 1] != v[y - 1]), n_d, n_i)
            elif curr[y] == delcost:
                (n_s, n_d, n_i) = prev_ops[y]
                curr_ops[y] = (n_s, n_d + 1, n_i)
            else:
                (n_s, n_d, n_i) = curr_ops[y - 1]
                curr_ops[y] = (n_s, n_d, n_i + 1)
                
    return curr[len(v)], curr_ops[len(v)]

def calculate_korean_cer(reference, hypothesis, remove_spaces=True, remove_punctuation=True):
    """
    한국어 문장의 CER(Character Error Rate)을 계산
    
    Args:
        reference (str): 정답 문장
        hypothesis (str): 예측 문장
        remove_spaces (bool): 공백 제거 여부
        remove_punctuation (bool): 문장부호 제거 여부
    
    Returns:
        dict: CER 값과 세부 정보 (대체, 삭제, 삽입 수)
    """
    # preprocessing
    ref = preprocess_text(reference, remove_spaces, remove_punctuation)
    hyp = preprocess_text(hypothesis, remove_spaces, remove_punctuation)

    ref_chars = list(ref)
    hyp_chars = list(hyp)
    
    _, (substitutions, deletions, insertions) = calculate_levenshtein(hyp_chars, ref_chars)

    hits = len(ref_chars) - (substitutions + deletions)
    incorrect = substitutions + deletions + insertions
    total = substitutions + deletions + hits + insertions

    cer = round(incorrect / total, 4) if total > 0 else 0
    
    result = {
        'cer': cer,
        'substitutions': substitutions,
        'deletions': deletions,
        'insertions': insertions
    }
    
    return result

def calculate_korean_crr(reference, hypothesis, remove_spaces=True, remove_punctuation=True):
    """
    한국어 문장의 CRR(정확도)을 계산
    CRR = 1 - CER
    
    Args:
        reference (str): 정답 문장
        hypothesis (str): 예측 문장
        remove_spaces (bool): 공백 제거 여부
        remove_punctuation (bool): 문장부호 제거 여부
    
    Returns:
        dict: CRR 값과 세부 정보 (대체, 삭제, 삽입 수)
    """
    cer_result = calculate_korean_cer(reference, hypothesis, remove_spaces, remove_punctuation)
    crr = round(1 - cer_result['cer'], 4) # 이 부분에서 소수점 몇 번째 자리까지 나타낼지 설정 가능

    result = {
        'crr': crr, # 정확도
        'substitutions': cer_result['substitutions'],
        'deletions': cer_result['deletions'],
        'insertions': cer_result['insertions']
    }

    return result

def transcribe_audio(file_path, model_name="daeunn/wav2vec2-korean-finetuned2"):
    # 모델 및 프로세서 로드
    processor = Wav2Vec2Processor.from_pretrained(model_name)
    model = Wav2Vec2ForCTC.from_pretrained(model_name)

    # 오디오 파일 로드 및 16kHz 리샘플링
    waveform, sample_rate = torchaudio.load(file_path)
    if sample_rate != 16000:
        waveform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)(waveform)
    input_values = processor(waveform.squeeze().numpy(), sampling_rate=16000, return_tensors="pt", padding=True)

    # 추론
    with torch.no_grad():
        logits = model(**input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.decode(predicted_ids[0])

    return transcription


if __name__ == "__main__":
    # reference = "안녕하세요, 반갑 습니다!"
    reference = "제가 스웨덴에서 왔고, 우리나라가 큰 나라이지만 인구가 좀 적어서 학생이라도 재밌게 할 수 있는게 많이 없고 카페나 술집이나 이런게 많이 없어서 그런 거 한국에 많이 있다고 들었고 그거 때문에 한국에 공부하러 왔어요."
    
    audio_path = "../data/stt_test.wav"
    hypothesis = transcribe_audio(audio_path)
    print("wav2vec2 변환:", hypothesis)
    # 기본 설정(공백, 문장부호 제거)으로 CER 계산
    cer_result = calculate_korean_cer(reference, hypothesis)
    print(f"CER (기본 설정): {cer_result['cer']}")
    print(f"세부 정보: 대체={cer_result['substitutions']}, 삭제={cer_result['deletions']}, 삽입={cer_result['insertions']}")
    
    # 문장부호는 유지하고 CER 계산
    cer_result2 = calculate_korean_cer(reference, hypothesis, remove_spaces=True, remove_punctuation=False)
    print(f"CER (문장부호 유지): {cer_result2['cer']}")
    
    # 공백과 문장부호 모두 유지하고 CER 계산
    cer_result3 = calculate_korean_cer(reference, hypothesis, remove_spaces=False, remove_punctuation=False)
    print(f"CER (공백, 문장부호 유지): {cer_result3['cer']}")
    
    # 정확도(CRR) 계산
    crr_result = calculate_korean_crr(reference, hypothesis)
    print(f"정확도(CRR): {crr_result['crr']}")
