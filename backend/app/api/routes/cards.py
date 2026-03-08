from fastapi import APIRouter, HTTPException
from app.models.schemas import GenerateCardRequest, GenerateCardResponse
from app.services.card_generator import generate_cards

router = APIRouter()


@router.post("/generate", response_model=GenerateCardResponse)
async def generate(request: GenerateCardRequest):
    try:
        card_id, pages = await generate_cards(
            title=request.title,
            summary=request.summary,
            model_name=request.model,
        )
        return GenerateCardResponse(
            card_id=card_id,
            image_url=pages[0].image_url if pages else "",
            cards=pages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{card_id}")
async def get_card(card_id: str):
    from pathlib import Path
    import os
    cards_dir = Path(os.getenv("GENERATED_CARDS_DIR", "generated_cards")) / card_id
    if not cards_dir.exists():
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다.")
    files = sorted(cards_dir.glob("card_*.jpg"))
    return {"card_id": card_id, "count": len(files)}
