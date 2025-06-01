from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Prompt(BaseModel):
    text: str

@router.post("/generate")
def generate_text(prompt: Prompt):
    return {"generated_text": f"당신이 입력한 문장: {prompt.text}"}