# Instagram Card Maker

책 제목과 소문단별 요약을 입력하면 인스타그램 카드 이미지를 생성하여 자동으로 업로드하는 웹 애플리케이션입니다.

## 주요 기능

- 책 제목 · 저자 · 소문단(0~6개) 단계별 입력
- Google Books API로 책 표지 이미지 자동 검색
- 카드 비율 선택 (1:1 / 3:4 / 4:5)
- 표지 카드 + 소문단 카드(0~6장) 미리보기
- 배경색 직접 선택 (책 표지 평균 RGB 기반 11×7 색상 그리드, 전체 카드 동시 반영)
- Canvas API로 Instagram 권장 해상도 이미지 생성 및 전체 다운로드
- 인스타그램 자동 업로드 (예정)

## 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** (인스타그램 컬러 팔레트 적용)
- **Canvas API** — 브라우저 내 고해상도 카드 이미지 렌더링
- **Google Books API** — 책 표지 이미지 검색 (API 키 불필요)
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
│   │   │   ├── globals.css
│   │   │   └── img-proxy/
│   │   │       └── route.ts          # 외부 이미지 CORS 프록시
│   │   ├── components/
│   │   │   ├── BookForm.tsx          # 단계별 입력 폼
│   │   │   └── CoverCardPreview.tsx  # 표지+소문단 카드 미리보기 & 전체 다운로드
│   │   └── lib/
│   │       ├── types.ts              # 공통 타입 (SubSection, BookInput, AspectRatio)
│   │       └── api.ts                # 백엔드 API 클라이언트
│   ├── next.config.js                # /api/* → 백엔드 프록시
│   ├── tailwind.config.ts
│   └── package.json
├── backend/
│   ├── main.py                       # FastAPI 앱 + 정적 파일 서빙
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/routes/
│       │   ├── cards.py              # POST /generate, GET /{id}
│       │   └── instagram.py          # POST /post
│       ├── services/
│       │   ├── ai/
│       │   │   ├── base.py           # BaseAIModel 추상 클래스
│       │   │   ├── claude.py         # Claude Sonnet 구현체
│       │   │   └── openai.py         # GPT-4o 구현체
│       │   ├── card_generator.py     # Pillow 이미지 렌더링
│       │   └── instagram.py          # Instagram Graph API 연동
│       └── models/schemas.py         # Pydantic 스키마
├── .gitignore
└── README.md
```

## 입력 데이터 구조

| 필드 | 설명 |
|------|------|
| 책 제목 | 예: 팀장의 탄생 |
| 저자 | 예: 마이클 왓킨스 |
| 소문단 제목 | 예: 개발팀과 성공적으로 협업하려면, 애자일 전략 |
| 소문단 내용 | 핵심 내용 + tip 등 자유 형식 (소문단은 0~6개) |

## 화면 흐름

```
[책 정보 입력]
  책 제목 + 저자 + 책 표지 자동 검색 (Google Books API)
       ↓
[소문단 입력] × 0~6회
  소문단 제목 + 내용
  → "다음 소문단" 또는 "카드 만들기"
       ↓
[카드 미리보기]
  카드 비율 선택 (1:1 / 3:4 / 4:5)
  표지 카드: 이미지 정중앙 배치 (높이 = 카드의 5/7)
  소문단 카드: 제목(대) + 본문(소) 세로 중앙 배치
  배경색 선택 (책 표지 평균 RGB 기반 11×7 색상 그리드)
  → 색상 변경 시 전체 카드 실시간 반영
       ↓
[전체 다운로드]
  Canvas API → Instagram 권장 해상도 PNG
  표지(_00_표지) + 소문단(_01, _02 ...) 순차 저장
  (1:1 → 1080×1080 / 3:4 → 1080×1440 / 4:5 → 1080×1350)
       ↓
[인스타그램 업로드] (예정)
  Instagram Graph API (캐러셀)
```

## 카드 출력 해상도

| 비율 | 해상도 | 용도 |
|------|--------|------|
| 1:1 | 1080 × 1080 px | 정사각형 피드 |
| 3:4 | 1080 × 1440 px | 세로 피드 |
| 4:5 | 1080 × 1350 px | 인스타그램 권장 세로 |

## 시작하기

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Instagram Graph API 액세스 토큰 (업로드 기능 사용 시)

### Frontend 실행

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Backend 실행

```bash
cd backend
cp .env.example .env   # API 키 입력
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

### 환경 변수 (backend/.env)

```env
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...
BACKEND_PUBLIC_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET`  | `/health` | 헬스체크 |
| `POST` | `/api/cards/generate` | 카드 이미지 생성 |
| `GET`  | `/api/cards/{id}` | 생성된 카드 조회 |
| `POST` | `/api/instagram/post` | 인스타그램 업로드 |

## 개발 현황

| 항목 | 상태 |
|------|------|
| 프론트엔드 입력 폼 (단계별 소문단, 0~6개) | ✅ 완료 |
| Google Books API 책 표지 검색 | ✅ 완료 |
| 카드 비율 선택 (1:1 / 3:4 / 4:5) | ✅ 완료 |
| 표지 카드 미리보기 | ✅ 완료 |
| 소문단 카드 생성 및 미리보기 | ✅ 완료 |
| 배경색 선택 (책 표지 평균 RGB 기반 색상 그리드) | ✅ 완료 |
| 소문단 카드 오른쪽 하단 코너 그라데이션 | ✅ 완료 |
| 전체 카드 PNG 다운로드 (Canvas API) | ✅ 완료 |
| 백엔드 API 기본 구조 | ✅ 완료 |
| AI 모델 연동 (Claude / GPT-4o) | 🔲 미구현 |
| Pillow 카드 이미지 렌더링 | 🔲 미구현 |
| Instagram Graph API 실제 연동 | 🔲 미구현 |
