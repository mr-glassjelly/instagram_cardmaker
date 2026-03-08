from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from app.api.routes import cards, instagram

load_dotenv()

app = FastAPI(title="Instagram Card Maker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cards_dir = os.getenv("GENERATED_CARDS_DIR", "generated_cards")
os.makedirs(cards_dir, exist_ok=True)
app.mount("/cards", StaticFiles(directory=cards_dir), name="cards")

app.include_router(cards.router, prefix="/api/cards", tags=["cards"])
app.include_router(instagram.router, prefix="/api/instagram", tags=["instagram"])


@app.get("/health")
async def health():
    return {"status": "ok"}
