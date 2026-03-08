# Instagram Card Maker

책 제목과 소문단별 요약을 입력하면 AI가 인스타그램 카드 이미지를 생성하여 자동으로 업로드하는 웹 애플리케이션입니다.

## 주요 기능

- 책 제목 · 저자 · 소문단(3~5개) 단계별 입력
- 소문단별 카드 이미지 생성 및 슬라이드 미리보기
- 인스타그램 캐러셀 자동 업로드

## 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** (인스타그램 컬러 팔레트 적용)
- TypeScript

### Backend
- **Python / FastAPI**
- **AI 모델**: Claude (Anthropic), GPT-4o (OpenAI) — `BaseAIModel` 추상 클래스로 교체 가능
- **이미지 렌더링**: Pillow
- **인스타그램 연동**: Instagram Graph API (단일 이미지 / 캐러셀 자동 분기)

## 프로젝트 구조

```
instagram_cardmaker/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── BookForm.tsx      # 단계별 입력 폼
│   │   │   └── CardPreview.tsx   # 카드 미리보기 & 업로드
│   │   └── lib/
│   │       ├── types.ts          # 공통 타입 (SubSection, BookInput)
│   │       └── api.ts            # 백엔드 API 클라이언트
│   ├── next.config.js            # /api/* → 백엔드 프록시
│   ├── tailwind.config.ts
│   └── package.json
├── backend/
│   ├── main.py                   # FastAPI 앱 + 정적 파일 서빙
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/routes/
│       │   ├── cards.py          # POST /generate, GET /{id}
│       │   └── instagram.py      # POST /post
│       ├── services/
│       │   ├── ai/
│       │   │   ├── base.py       # BaseAIModel 추상 클래스
│       │   │   ├── claude.py     # Claude Sonnet 구현체
│       │   │   └── openai.py     # GPT-4o 구현체
│       │   ├── card_generator.py # Pillow 이미지 렌더링
│       │   └── instagram.py      # Instagram Graph API 연동
│       └── models/schemas.py     # Pydantic 스키마
├── .gitignore
└── README.md
```

## 입력 데이터 구조

책 한 권을 **소문단 3~5개**로 나눠 입력합니다. 각 소문단은 카드 한 장에 대응됩니다.

| 필드 | 설명 |
|------|------|
| 책 제목 | 예: 팀장의 탄생 |
| 저자 | 예: 마이클 왓킨스 |
| 소문단 제목 | 예: 개발팀과 성공적으로 협업하려면, 애자일 전략 |
| 소문단 내용 | 핵심 내용 + tip 등 자유 형식 |

## 화면 흐름

```
[책 정보 입력]
  책 제목 + 저자
       ↓
[소문단 입력] × 3~5회
  소문단 제목 + 내용
  → "다음 소문단" 또는 "카드 만들기"
       ↓
[카드 미리보기]
  인스타그램 스타일 그라데이션 카드
  썸네일 그리드 + 슬라이드 도트 네비게이터
       ↓
[인스타그램 업로드]
  Instagram Graph API (캐러셀)
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Instagram Graph API 액세스 토큰

### 환경 변수 설정

```bash
cp backend/.env.example backend/.env
# .env 파일에 API 키 및 토큰 입력
```

```env
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...
BACKEND_PUBLIC_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### Frontend 실행

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Backend 실행

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET`  | `/health` | 헬스체크 |
| `POST` | `/api/cards/generate` | 카드 이미지 생성 |
| `GET`  | `/api/cards/{id}` | 생성된 카드 조회 |
| `POST` | `/api/instagram/post` | 인스타그램 업로드 |

생성된 카드 이미지는 `backend/generated_cards/{card_id}/` 에 저장되며, `/cards/{card_id}/card_NN.jpg` 경로로 정적 서빙됩니다.

## 개발 현황

| 항목 | 상태 |
|------|------|
| 프론트엔드 입력 폼 (단계별 소문단) | ✅ 완료 |
| 카드 미리보기 UI (Mock) | ✅ 완료 |
| 인스타그램 업로드 UI (Mock) | ✅ 완료 |
| 백엔드 API 기본 구조 | ✅ 완료 |
| AI 모델 연동 (Claude / GPT-4o) | 🔲 미구현 |
| Pillow 카드 이미지 렌더링 | 🔲 미구현 |
| Instagram Graph API 실제 연동 | 🔲 미구현 |
