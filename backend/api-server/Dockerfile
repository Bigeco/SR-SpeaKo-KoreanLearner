FROM python:3.9-slim

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 캐시 디렉토리 생성 및 권한 설정
RUN mkdir -p /app/cache && chmod -R 777 /app/cache

# Hugging Face 모델 캐시 경로 설정
ENV HUGGINGFACE_HUB_CACHE=/app/cache

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# 포트 노출 (HuggingFace Spaces는 7860 포트 사용)
EXPOSE 7860

# 앱 실행
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]