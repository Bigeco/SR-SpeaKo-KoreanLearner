from fastapi import APIRouter, UploadFile, File
from faster_whisper import WhisperModel
import tempfile

router = APIRouter()

# 모델은 router 레벨에서도 1번만 로드
model = WhisperModel("small", compute_type="int8")

@router.post("/transcribe/")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp.flush()

        segments, _ = model.transcribe(tmp.name, language="ko")
        result = "".join([segment.text for segment in segments])

    return {"text": result}
