"use client";

import type { BookInput, AspectRatio } from "@/lib/types";

const RATIO_CSS: Record<AspectRatio, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "4:5": "4 / 5",
};

interface Props {
  book: BookInput;
  coverUrl: string | null;
  onBack: () => void;
}

export default function CoverCardPreview({ book, coverUrl, onBack }: Props) {
  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-pink-400">🎴 표지 카드 미리보기</p>
          <h2 className="mt-0.5 font-bold text-gray-900">
            《{book.title}》{" "}
            <span className="font-normal text-gray-500">— {book.author}</span>
          </h2>
          <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-500">
            📐 {book.aspectRatio}
          </span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-100 transition-colors"
        >
          ← 입력으로 돌아가기
        </button>
      </div>

      {/* 카드 */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-xl"
        style={{
          aspectRatio: RATIO_CSS[book.aspectRatio],
          background: "linear-gradient(145deg, #fdf6f0 0%, #fceef6 50%, #f0ecff 100%)",
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.title} 표지`}
            style={{
              position: "absolute",
              height: `${(5 / 7) * 100}%`,
              width: "auto",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
              borderRadius: "4px",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span
              className="flex items-center justify-center rounded-xl bg-white/60 text-5xl shadow-sm"
              style={{ width: "80px", height: "110px" }}
            >
              📖
            </span>
            <p className="text-xs text-gray-400">표지 이미지를 불러오지 못했어요</p>
          </div>
        )}
      </div>

      {/* 안내 */}
      <p className="text-center text-xs text-gray-400">
        다음 단계에서 소문단 카드를 추가할 수 있어요.
      </p>
    </div>
  );
}
