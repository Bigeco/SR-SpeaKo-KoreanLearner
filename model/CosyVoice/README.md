```bash
# 1. 리포지토리 클론 및 이동
git clone https://github.com/yourusername/cosyvoice.git
cd cosyvoice

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 사전학습 모델 다운로드 (Python 코드 실행)
from modelscope import snapshot_download

# CosyVoice2 TTS 모델
snapshot_download('iic/CosyVoice2-0.5B', local_dir='pretrained_models/CosyVoice2-0.5B')

# CosyVoice 전처리기 (frontend)
snapshot_download('iic/CosyVoice-ttsfrd', local_dir='pretrained_models/CosyVoice-ttsfrd')

# 4. frontend 리소스 압축 해제
cd pretrained_models/CosyVoice-ttsfrd/
unzip resource.zip -d .

# 5. ttsfrd 의존성 설치
pip install ttsfrd_dependency-0.1-py3-none-any.whl
pip install ttsfrd-0.4.2-cp310-cp310-linux_x86_64.whl
