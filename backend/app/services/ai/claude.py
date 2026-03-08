import os
import json
import anthropic
from .base import BaseAIModel


class ClaudeModel(BaseAIModel):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-sonnet-4-6"

    async def extract_key_phrases(self, title: str, summary: str) -> list[str]:
        prompt = f"""책 제목: {title}

책 요약:
{summary}

위 책의 핵심 문구를 인스타그램 카드용으로 5~7개 추출해 주세요.
각 문구는 한 장의 카드에 들어갈 짧고 임팩트 있는 문장이어야 합니다 (20자 내외).
JSON 배열 형식으로만 응답해 주세요. 예: ["문구1", "문구2", ...]"""

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        return json.loads(text)

    async def generate_caption(self, title: str, summary: str) -> str:
        prompt = f"""책 제목: {title}

책 요약:
{summary}

위 책을 소개하는 인스타그램 게시글 캡션을 작성해 주세요.
해시태그 5개를 포함하고, 총 150자 이내로 작성해 주세요."""

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
