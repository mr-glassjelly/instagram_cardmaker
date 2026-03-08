import os
import httpx
from pathlib import Path


GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


async def post_to_instagram(card_id: str, caption: str = "") -> dict:
    """생성된 카드 이미지를 인스타그램에 업로드합니다."""
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    account_id = os.getenv("INSTAGRAM_ACCOUNT_ID")

    if not access_token or not account_id:
        raise ValueError("Instagram API 인증 정보가 설정되지 않았습니다.")

    cards_dir = Path(os.getenv("GENERATED_CARDS_DIR", "generated_cards")) / card_id
    image_files = sorted(cards_dir.glob("card_*.jpg"))

    if not image_files:
        raise FileNotFoundError(f"카드 이미지를 찾을 수 없습니다: {card_id}")

    base_url = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")

    async with httpx.AsyncClient() as client:
        if len(image_files) == 1:
            # 단일 이미지 게시
            image_url = f"{base_url}/cards/{card_id}/card_01.jpg"
            container = await _create_image_container(client, account_id, access_token, image_url, caption)
            return await _publish_container(client, account_id, access_token, container["id"])
        else:
            # 캐러셀 게시
            item_ids = []
            for img_file in image_files:
                image_url = f"{base_url}/cards/{card_id}/{img_file.name}"
                item = await _create_image_container(client, account_id, access_token, image_url, is_carousel_item=True)
                item_ids.append(item["id"])

            carousel = await _create_carousel_container(client, account_id, access_token, item_ids, caption)
            return await _publish_container(client, account_id, access_token, carousel["id"])


async def _create_image_container(
    client: httpx.AsyncClient,
    account_id: str,
    access_token: str,
    image_url: str,
    caption: str = "",
    is_carousel_item: bool = False,
) -> dict:
    params = {
        "image_url": image_url,
        "access_token": access_token,
    }
    if is_carousel_item:
        params["is_carousel_item"] = "true"
    else:
        params["caption"] = caption

    res = await client.post(f"{GRAPH_API_BASE}/{account_id}/media", params=params)
    res.raise_for_status()
    return res.json()


async def _create_carousel_container(
    client: httpx.AsyncClient,
    account_id: str,
    access_token: str,
    item_ids: list[str],
    caption: str,
) -> dict:
    res = await client.post(
        f"{GRAPH_API_BASE}/{account_id}/media",
        params={
            "media_type": "CAROUSEL",
            "children": ",".join(item_ids),
            "caption": caption,
            "access_token": access_token,
        },
    )
    res.raise_for_status()
    return res.json()


async def _publish_container(
    client: httpx.AsyncClient,
    account_id: str,
    access_token: str,
    container_id: str,
) -> dict:
    res = await client.post(
        f"{GRAPH_API_BASE}/{account_id}/media_publish",
        params={
            "creation_id": container_id,
            "access_token": access_token,
        },
    )
    res.raise_for_status()
    return res.json()
