from fastapi import FastAPI
from app.router import router  # app/ 안에 있으면 경로 주의

app = FastAPI()
app.include_router(router)
