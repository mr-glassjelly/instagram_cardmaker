from abc import ABC, abstractmethod


class BaseAIModel(ABC):
    """AI 모델 공통 인터페이스"""

    @abstractmethod
    async def extract_key_phrases(self, title: str, summary: str) -> list[str]:
        """책 요약에서 카드에 쓸 핵심 문구를 추출합니다."""
        ...

    @abstractmethod
    async def generate_caption(self, title: str, summary: str) -> str:
        """인스타그램 게시글 캡션을 생성합니다."""
        ...
