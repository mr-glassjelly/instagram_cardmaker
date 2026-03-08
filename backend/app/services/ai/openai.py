import os
import json
from openai import AsyncOpenAI
from .base import BaseAIModel


class OpenAIModel(BaseAIModel):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o"

    async def extract_key_phrases(self, title: str, summary: str) -> list[str]:
        prompt = f"""책 제목: {title}

책 요약:
{summary}

위 책의 핵심 문구를 인스타그램 카드용으로 5~7개 추출해 주세요.
각 문구는 한 장의 카드에 들어갈 짧고 임팩트 있는 문장이어야 합니다 (20자 내외).
JSON 배열 형식으로만 응답해 주세요. 예: ["문구1", "문구2", ...]"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or "[]"
        data = json.loads(text)
        # json_object 모드에서는 배열을 감싸는 객체일 수 있음
        if isinstance(data, list):
            return data
        return next(iter(data.values()), [])

    async def generate_caption(self, title: str, summary: str) -> str:
        prompt = f"""책 제목: {title}

책 요약:
{summary}

위 책을 소개하는 인스타그램 게시글 캡션을 작성해 주세요.
해시태그 5개를 포함하고, 총 150자 이내로 작성해 주세요."""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256,
        )
        return (response.choices[0].message.content or "").strip()
