from fastapi import APIRouter, HTTPException
from app.models.schemas import PostToInstagramRequest, PostToInstagramResponse
from app.services.instagram import post_to_instagram

router = APIRouter()


@router.post("/post", response_model=PostToInstagramResponse)
async def post(request: PostToInstagramRequest):
    try:
        result = await post_to_instagram(
            card_id=request.card_id,
            caption=request.caption or "",
        )
        return PostToInstagramResponse(
            success=True,
            post_url=result.get("id"),
            message="인스타그램 업로드 완료",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
