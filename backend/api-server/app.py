import asyncio
import json
import logging
import numpy as np
from faster_whisper import WhisperModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import HTMLResponse
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Korean Speech Recognition API",
    description="Real-time Korean speech recognition using Whisper",
    version="1.0.0"
)

class WhisperService:
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Whisper 모델 로드 (CPU 최적화)"""
        try:
            logger.info("Loading Whisper model...")
            # CPU에서 빠른 faster-whisper 사용
            self.model = WhisperModel(
                "tiny",  # tiny, base, small 중 선택
                device="cpu",
                compute_type="int8",  # CPU 최적화
                num_workers=1
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    
    async def transcribe_audio(self, audio_data: bytes) -> dict:
        """오디오 데이터를 텍스트로 변환"""
        try:
            # 바이트 데이터를 numpy 배열로 변환
            audio_np = np.frombuffer(audio_data, dtype=np.float32)
            
            # 오디오 길이 체크 (너무 짧으면 스킵)
            if len(audio_np) < 1600:  # 0.1초 미만
                return {"text": "", "confidence": 0.0}
            
            # 백그라운드에서 전사 실행
            result = await asyncio.get_event_loop().run_in_executor(
                None, self._transcribe, audio_np
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {"text": "", "error": str(e)}
    
    def _transcribe(self, audio_np: np.ndarray) -> dict:
        """실제 전사 작업 (별도 스레드에서 실행)"""
        try:
            if self.model and hasattr(self.model, 'transcribe'):
                # faster-whisper 사용
                segments, info = self.model.transcribe(
                    audio_np,
                    language="ko",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500)
                )
                
                text = " ".join([segment.text for segment in segments])
                confidence = info.language_probability if hasattr(info, 'language_probability') else 0.9
                
                return {
                    "text": text.strip(),
                    "confidence": confidence,
                    "language": "ko"
                }
            else:
                return {"text": "모델이 로드되지 않음", "error": "Model not loaded"}
                
        except Exception as e:
            logger.error(f"Model transcription error: {e}")
            return {"text": "", "error": str(e)}

# 전역 서비스 인스턴스
whisper_service = WhisperService()

@app.get("/", response_class=HTMLResponse)
async def root():
    """기본 페이지 - 서비스 상태 확인"""
    return """
    
    
    
        Korean Speech Recognition
        
    
    
        🎤 Korean Speech Recognition API
        실시간 한국어 음성 인식 서비스가 실행 중입니다.
        
        API 엔드포인트:
        
            WebSocket /ws - 실시간 음성 인식
            POST /transcribe - 파일 업로드 음성 인식
            GET /health - 헬스 체크
        
        
        WebSocket 테스트:
        
            // 간단한 WebSocket 연결 테스트
            function testWebSocket() {
                const ws = new WebSocket(`wss://${window.location.host}/ws`);
                ws.onopen = () => console.log('WebSocket 연결됨');
                ws.onmessage = (event) => console.log('받은 메시지:', event.data);
                ws.onerror = (error) => console.error('WebSocket 오류:', error);
            }
        
        WebSocket 연결 테스트
    
    
    """

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket을 통한 실시간 음성 인식"""
    await websocket.accept()
    logger.info("WebSocket 연결 수락됨")
    
    try:
        while True:
            # 클라이언트로부터 오디오 데이터 수신
            data = await websocket.receive_bytes()
            
            # 음성 인식 처리
            result = await whisper_service.transcribe_audio(data)
            
            # 결과를 JSON으로 전송
            await websocket.send_text(json.dumps(result, ensure_ascii=False))
            
    except WebSocketDisconnect:
        logger.info("WebSocket 연결 종료")
    except Exception as e:
        logger.error(f"WebSocket 오류: {e}")
        await websocket.close()

@app.post("/transcribe")
async def transcribe_file(file: UploadFile = File(...)):
    """파일 업로드를 통한 음성 인식"""
    try:
        # 파일 데이터 읽기
        audio_data = await file.read()
        
        # 음성 인식 처리
        result = await whisper_service.transcribe_audio(audio_data)
        
        return {
            "filename": file.filename,
            "transcription": result
        }
        
    except Exception as e:
        logger.error(f"파일 전사 오류: {e}")
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "model": "whisper-base-cpu",
        "language": "korean",
        "version": "1.0.0"
    }