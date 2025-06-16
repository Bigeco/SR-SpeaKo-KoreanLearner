from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# enhanced_g2pk.py 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'model'))
from enhanced_g2pk import EnhancedG2p

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# G2P 인스턴스 생성
g2p = EnhancedG2p()

class TextRequest(BaseModel):
    text: str

@app.post("/g2pk")
async def convert_to_g2pk(request: TextRequest):
    try:
        result = g2p(request.text)
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}