# cosyvoice_run_all_in_one.py

import os
import sys
import subprocess
import torchaudio
from modelscope import snapshot_download

# ---------- 1. Matcha-TTS 경로 설정 ----------
sys.path.append('third_party/Matcha-TTS')

# ---------- 2. CosyVoice 관련 모듈 import ----------
from cosyvoice.cli.cosyvoice import CosyVoice2
from cosyvoice.utils.file_utils import load_wav

# ---------- 3. 사전학습 모델 다운로드 ----------
print("모델 다운로드")
snapshot_download('iic/CosyVoice2-0.5B', local_dir='pretrained_models/CosyVoice2-0.5B')
snapshot_download('iic/CosyVoice-ttsfrd', local_dir='pretrained_models/CosyVoice-ttsfrd')

# ---------- 4. frontend 리소스 압축 해제 ----------
print("리소스 압축 해제")
resource_zip = 'pretrained_models/CosyVoice-ttsfrd/resource.zip'
extract_path = 'pretrained_models/CosyVoice-ttsfrd'
if os.path.exists(resource_zip):
    subprocess.run(['unzip', '-o', resource_zip, '-d', extract_path])
else:
    print(f"resource.zip이 존재하지 않음: {resource_zip}")

# ---------- 5. 의존성 설치 ----------
print("의존성 설치 중...")
dep_whl = os.path.join(extract_path, 'ttsfrd_dependency-0.1-py3-none-any.whl')
core_whl = os.path.join(extract_path, 'ttsfrd-0.4.2-cp310-cp310-linux_x86_64.whl')

if os.path.exists(dep_whl):
    subprocess.run(['pip', 'install', dep_whl])
else:
    print(f"{dep_whl} 파일이 존재하지 않음")

if os.path.exists(core_whl):
    subprocess.run(['pip', 'install', core_whl])
else:
    print(f"{core_whl} 파일이 존재하지 않음")

# ---------- 6. CosyVoice2 모델 로드 ----------
print("CosyVoice2 모델 로드")
cosyvoice = CosyVoice2(
    'pretrained_models/CosyVoice2-0.5B',
    load_jit=False,
    load_trt=False,
    fp16=False,
    use_flow_cache=False
)

# ---------- 7. 프롬프트 음성 불러오기 ----------
prompt_path = './asset/tts_test.wav'
if not os.path.exists(prompt_path):
    raise FileNotFoundError(f"프롬프트 파일이 없음: {prompt_path}")

prompt_speech_16k = load_wav(prompt_path, 16000)

# ---------- 8. inference 실행 ----------
print("음성 합성 시작")
results = cosyvoice.inference_zero_shot(
    '공룡이 밤양갱을 몰래 먹고 도망쳤어요.', #tts할 텍스트
    prompt_text='오느른 커피 안 마실 꺼야', #./asset/tts_test.wav 발음 문장
    prompt_speech_16k=prompt_speech_16k,
    text_frontend=True
)

# ---------- 9. 결과 저장 ----------
print("결과 저장")
for i, result in enumerate(results):
    output_path = f'korean_tts_{i}.wav'
    torchaudio.save(output_path, result['tts_speech'], cosyvoice.sample_rate)
    print(f"저장: {output_path}")

print("종료")
