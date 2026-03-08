import os
import uuid
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from app.models.schemas import CardPage
from app.services.ai.base import BaseAIModel
from app.services.ai.claude import ClaudeModel
from app.services.ai.openai import OpenAIModel

CARD_WIDTH = 1080
CARD_HEIGHT = 1080
BG_COLOR = (245, 242, 235)
TEXT_COLOR = (30, 30, 30)
ACCENT_COLOR = (80, 60, 40)
FONT_SIZE_TITLE = 52
FONT_SIZE_BODY = 44
PADDING = 90


def _get_ai_model(model_name: str) -> BaseAIModel:
    if model_name == "openai":
        return OpenAIModel()
    return ClaudeModel()


def _wrap_text(text: str, max_chars: int = 18) -> list[str]:
    """텍스트를 최대 글자 수에 맞게 줄바꿈합니다."""
    lines = []
    while len(text) > max_chars:
        split_at = max_chars
        lines.append(text[:split_at])
        text = text[split_at:]
    if text:
        lines.append(text)
    return lines


def _render_card(text: str, page: int, total: int, title: str, output_path: str) -> None:
    img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 폰트 로드 (시스템 폰트 fallback)
    try:
        font_body = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", FONT_SIZE_BODY)
        font_title = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", FONT_SIZE_TITLE)
        font_small = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 28)
    except OSError:
        font_body = ImageFont.load_default()
        font_title = font_body
        font_small = font_body

    # 상단 책 제목
    draw.text((PADDING, PADDING), f"《{title}》", font=font_small, fill=ACCENT_COLOR)

    # 구분선
    draw.line([(PADDING, PADDING + 50), (CARD_WIDTH - PADDING, PADDING + 50)], fill=ACCENT_COLOR, width=2)

    # 본문 텍스트 (세로 중앙)
    wrapped = _wrap_text(text, max_chars=16)
    line_height = FONT_SIZE_BODY + 24
    total_text_height = len(wrapped) * line_height
    y_start = (CARD_HEIGHT - total_text_height) // 2

    for i, line in enumerate(wrapped):
        bbox = draw.textbbox((0, 0), line, font=font_body)
        text_w = bbox[2] - bbox[0]
        x = (CARD_WIDTH - text_w) // 2
        draw.text((x, y_start + i * line_height), line, font=font_body, fill=TEXT_COLOR)

    # 하단 페이지 번호
    page_text = f"{page} / {total}"
    bbox = draw.textbbox((0, 0), page_text, font=font_small)
    pw = bbox[2] - bbox[0]
    draw.text(((CARD_WIDTH - pw) // 2, CARD_HEIGHT - PADDING), page_text, font=font_small, fill=ACCENT_COLOR)

    img.save(output_path, "JPEG", quality=95)


async def generate_cards(title: str, summary: str, model_name: str = "claude") -> tuple[str, list[CardPage]]:
    """카드 이미지를 생성하고 CardPage 목록을 반환합니다."""
    ai = _get_ai_model(model_name)
    phrases = await ai.extract_key_phrases(title, summary)

    card_id = str(uuid.uuid4())
    cards_dir = Path(os.getenv("GENERATED_CARDS_DIR", "generated_cards")) / card_id
    cards_dir.mkdir(parents=True, exist_ok=True)

    pages: list[CardPage] = []
    total = len(phrases)

    for i, phrase in enumerate(phrases, start=1):
        filename = f"card_{i:02d}.jpg"
        output_path = str(cards_dir / filename)
        _render_card(phrase, page=i, total=total, title=title, output_path=output_path)
        pages.append(CardPage(
            page=i,
            image_url=f"/cards/{card_id}/{filename}",
            text=phrase,
        ))

    return card_id, pages
