"use client";

import { useRef, useState } from "react";
import type { BookInput, AspectRatio } from "@/lib/types";

const RATIO_CSS: Record<AspectRatio, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "4:5": "4 / 5",
};

// Instagram 권장 출력 해상도
const CANVAS_SIZE: Record<AspectRatio, [number, number]> = {
  "1:1": [1080, 1080],
  "3:4": [1080, 1440],
  "4:5": [1080, 1350],
};

// CSS gradient 색상 (145deg: 좌상→우하)
const BG_STOPS = [
  { offset: 0, color: "#fdf6f0" },
  { offset: 0.5, color: "#fceef6" },
  { offset: 1, color: "#f0ecff" },
];

interface Props {
  book: BookInput;
  coverUrl: string | null;
  onBack: () => void;
}

export default function CoverCardPreview({ book, coverUrl, onBack }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [cw, ch] = CANVAS_SIZE[book.aspectRatio];
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d")!;

      // 배경 그라데이션 (145deg ≈ 좌상→우하 대각선)
      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      BG_STOPS.forEach(({ offset, color }) => grad.addColorStop(offset, color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // 책 표지 이미지 (높이 = 카드 높이의 5/7)
      if (coverUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = coverUrl;
        });

        const imgH = (ch * 5) / 7;
        const imgW = img.naturalWidth * (imgH / img.naturalHeight);
        const x = (cw - imgW) / 2;
        const y = (ch - imgH) / 2;

        // 그림자
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;

        // 모서리 둥글게
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + imgW - r, y);
        ctx.quadraticCurveTo(x + imgW, y, x + imgW, y + r);
        ctx.lineTo(x + imgW, y + imgH - r);
        ctx.quadraticCurveTo(x + imgW, y + imgH, x + imgW - r, y + imgH);
        ctx.lineTo(x + r, y + imgH);
        ctx.quadraticCurveTo(x, y + imgH, x, y + imgH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, x, y, imgW, imgH);
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${book.title}_표지.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setDownloading(false);
    }
  }

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

      {/* 카드 미리보기 */}
      <div
        ref={cardRef}
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
            crossOrigin="anonymous"
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

      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        {downloading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
              style={{ borderTopColor: "rgba(255,255,255,0.9)" }}
            />
            이미지 생성 중...
          </span>
        ) : (
          "⬇️ 표지 카드 다운로드"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        다음 단계에서 소문단 카드를 추가할 수 있어요.
      </p>
    </div>
  );
}
