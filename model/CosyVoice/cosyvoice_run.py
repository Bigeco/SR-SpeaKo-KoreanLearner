import sys
import torchaudio

# Matcha-TTS 경로 추가
sys.path.append('third_party/Matcha-TTS')

# CosyVoice 관련 모듈 import
from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.file_utils import load_wav

# CosyVoice2 모델 로드
cosyvoice = CosyVoice2(
    'pretrained_models/CosyVoice2-0.5B',
    load_jit=False,
    load_trt=False,
    fp16=False,
    use_flow_cache=False
)

# 프롬프트 음성 로드 (16kHz wav 파일)
prompt_speech_16k = load_wav('./asset/tts_test.wav', 16000)

# inference 실행
results = cosyvoice.inference_zero_shot(
    '공룡이 밤양갱을 몰래 먹고 도망쳤어요.',       # TTS 대상 문장
    prompt_text='오느른 커피 안 마실 꺼야',         # 화자의 음성에서 발화한 문장
    prompt_speech_16k=prompt_speech_16k,
    text_frontend=True
)

# 결과 저장
for i, result in enumerate(results):
    torchaudio.save(f'korean_tts_{i}.wav', result['tts_speech'], cosyvoice.sample_rate)
