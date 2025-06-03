"""TODO: 모델 프레임워크 돌아가도록 구현
"""

import logging
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
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

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def root():
    """기본 페이지"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Korean Speech Recognition</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .endpoint { background: white; padding: 10px; margin: 10px 0; border-radius: 4px; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .status { margin: 10px 0; padding: 10px; border-radius: 4px; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .warning { background: #fff3cd; color: #856404; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎤 Korean Speech Recognition API</h1>
            <p>실시간 한국어 음성 인식 서비스가 실행 중입니다.</p>
            
            <h3>API 엔드포인트:</h3>
            <div class="endpoint">WebSocket /ws - 실시간 음성 인식</div>
            <div class="endpoint">POST /transcribe - 파일 업로드 음성 인식</div>
            <div class="endpoint">GET /health - 헬스 체크</div>
            
            <h3>WebSocket 테스트:</h3>
            <button onclick="testWebSocket()">WebSocket 연결 테스트</button>
            <div id="status"></div>
            
            <script>
                function testWebSocket() {
                    const status = document.getElementById('status');
                    status.innerHTML = '<div class="status warning">연결 시도 중...</div>';
                    
                    try {
                        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        const wsUrl = `${protocol}//${window.location.host}/ws`;
                        console.log('WebSocket URL:', wsUrl);
                        
                        const ws = new WebSocket(wsUrl);
                        let messageReceived = false;
                        
                        ws.onopen = () => {
                            console.log('WebSocket 연결됨');
                            status.innerHTML = '<div class="status success">✅ WebSocket 연결 성공! 메시지 전송 중...</div>';
                            
                            // 텍스트 메시지 전송
                            ws.send('ping');
                        };
                        
                        ws.onmessage = (event) => {
                            messageReceived = true;
                            console.log('받은 메시지:', event.data);
                            try {
                                const data = JSON.parse(event.data);
                                status.innerHTML = '<div class="status success">✅ 서버 응답 수신 성공!</div>';
                                
                                // 3초 후 정상적으로 연결 종료
                                setTimeout(() => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.close(1000, 'Test completed successfully');
                                    }
                                }, 3000);
                            } catch (e) {
                                status.innerHTML = '<div class="status success">✅ 텍스트 메시지 수신: ' + event.data + '</div>';
                                setTimeout(() => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.close(1000, 'Test completed successfully');
                                    }
                                }, 3000);
                            }
                        };
                        
                        ws.onerror = (error) => {
                            console.error('WebSocket 오류:', error);
                            status.innerHTML = '<div class="status error">❌ WebSocket 연결 실패</div>';
                        };
                        
                        ws.onclose = (event) => {
                            console.log('WebSocket 연결 종료', event.code, event.reason);
                            
                            if (event.code === 1000) {
                                status.innerHTML = '<div class="status success">✅ WebSocket 테스트 완료 (정상 종료)</div>';
                            } else if (messageReceived) {
                                status.innerHTML = '<div class="status success">✅ 메시지 교환 성공 (코드: ' + event.code + ')</div>';
                            } else {
                                status.innerHTML = '<div class="status error">❌ WebSocket 연결이 예기치 않게 종료됨 (코드: ' + event.code + ')</div>';
                            }
                        };
                        
                        // 10초 후 타임아웃
                        setTimeout(() => {
                            if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
                                if (!messageReceived) {
                                    status.innerHTML = '<div class="status error">❌ 응답 타임아웃</div>';
                                    ws.close();
                                }
                            }
                        }, 10000);
                        
                    } catch (error) {
                        console.error('WebSocket 테스트 오류:', error);
                        status.innerHTML = '<div class="status error">❌ WebSocket 테스트 실패: ' + error.message + '</div>';
                    }
                }
            </script>
        </div>
    </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "model": "?",
        "language": "korean",
        "version": "1.0.0",
    }

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Korean Speech Recognition API 서버 시작됨")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)