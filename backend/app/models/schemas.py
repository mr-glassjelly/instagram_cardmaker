from pydantic import BaseModel
from typing import Optional


class GenerateCardRequest(BaseModel):
    title: str
    summary: str
    model: str = "claude"


class CardPage(BaseModel):
    page: int
    image_url: str
    text: str


class GenerateCardResponse(BaseModel):
    card_id: str
    image_url: str
    cards: list[CardPage]


class PostToInstagramRequest(BaseModel):
    card_id: str
    caption: Optional[str] = None


class PostToInstagramResponse(BaseModel):
    success: bool
    post_url: Optional[str] = None
    message: Optional[str] = None
