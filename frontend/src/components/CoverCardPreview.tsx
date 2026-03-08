"use client";

import { useRef, useState, useEffect } from "react";
import type { BookInput, AspectRatio } from "@/lib/types";

const RATIO_CSS: Record<AspectRatio, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "4:5": "4 / 5",
};

const CANVAS_SIZE: Record<AspectRatio, [number, number]> = {
  "1:1": [1080, 1080],
  "3:4": [1080, 1440],
  "4:5": [1080, 1350],
};

const GRID_COLS = 11;
const GRID_ROWS = 7;
const HUE_RANGE = 60;   // 기준 색조에서 ±30°
const L_TOP = 88;       // 최대 밝기 (%)
const L_BOTTOM = 28;    // 최소 밝기 (%)

// ── 색상 변환 유틸 ──────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// ── 책 표지 평균 색상 ────────────────────────────────────────────────

async function getAverageHsl(imgSrc: string): Promise<[number, number, number]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = imgSrc;
  });
  const SIZE = 60;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  let r = 0, g = 0, b = 0;
  const count = SIZE * SIZE;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
  return rgbToHsl(r / count, g / count, b / count);
}

// ── 색상 그리드 생성 ─────────────────────────────────────────────────

function makeGrid(baseH: number, baseS: number): string[] {
  const s = Math.max(20, Math.min(70, baseS));
  const colors: string[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const l = L_TOP - (row * (L_TOP - L_BOTTOM)) / (GRID_ROWS - 1);
    for (let col = 0; col < GRID_COLS; col++) {
      const h = (baseH - HUE_RANGE / 2 + (col * HUE_RANGE) / (GRID_COLS - 1) + 360) % 360;
      colors.push(hslToHex(h, s, l));
    }
  }
  return colors;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────

interface Props {
  book: BookInput;
  coverUrl: string | null;
  onBack: () => void;
}

const DEFAULT_HSL: [number, number, number] = [300, 30, 70]; // 표지 없을 때 기본값

export default function CoverCardPreview({ book, coverUrl, onBack }: Props) {
  const [baseHsl, setBaseHsl] = useState<[number, number, number]>(DEFAULT_HSL);
  const [bgColor, setBgColor] = useState<string>(hslToHex(...DEFAULT_HSL));
  const [grid, setGrid] = useState<string[]>(() => makeGrid(...DEFAULT_HSL));
  const [downloading, setDownloading] = useState(false);

  // 책 표지 로드 후 평균 색상 계산
  useEffect(() => {
    if (!coverUrl) return;
    getAverageHsl(coverUrl)
      .then(([h, s, l]) => {
        setBaseHsl([h, s, l]);
        setGrid(makeGrid(h, s));
        setBgColor(hslToHex(h, s, l));
      })
      .catch(() => {/* 실패 시 기본값 유지 */});
  }, [coverUrl]);

  function handleSelectColor(hex: string) {
    setBgColor(hex);
  }

  // 그리드 중앙 셀(기준 색상)의 인덱스
  const centerIdx = Math.floor(GRID_ROWS / 2) * GRID_COLS + Math.floor(GRID_COLS / 2);

  async function handleDownload() {
    setDownloading(true);
    try {
      const [cw, ch] = CANVAS_SIZE[book.aspectRatio];
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d")!;

      // 배경 단색
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cw, ch);

      // 책 표지
      if (coverUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = coverUrl; });

        const imgH = (ch * 5) / 7;
        const imgW = img.naturalWidth * (imgH / img.naturalHeight);
        const x = (cw - imgW) / 2;
        const y = (ch - imgH) / 2;

        ctx.shadowColor = "rgba(0,0,0,0.28)";
        ctx.shadowBlur = 48;
        ctx.shadowOffsetY = 14;

        const r = 6;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + imgW - r, y); ctx.quadraticCurveTo(x + imgW, y, x + imgW, y + r);
        ctx.lineTo(x + imgW, y + imgH - r); ctx.quadraticCurveTo(x + imgW, y + imgH, x + imgW - r, y + imgH);
        ctx.lineTo(x + r, y + imgH); ctx.quadraticCurveTo(x, y + imgH, x, y + imgH - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
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
        className="relative w-full overflow-hidden rounded-2xl shadow-xl transition-colors duration-200"
        style={{ aspectRatio: RATIO_CSS[book.aspectRatio], background: bgColor }}
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
            <p className="text-xs text-white/70">표지 이미지를 불러오지 못했어요</p>
          </div>
        )}
      </div>

      {/* 배경색 선택 */}
      <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">🎨 배경 색상</p>
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border border-gray-200 shadow-sm" style={{ background: bgColor }} />
            <span className="font-mono text-xs text-gray-400">{bgColor.toUpperCase()}</span>
          </div>
        </div>

        {/* 색상 그리드 */}
        <div
          className="overflow-hidden rounded-xl border border-gray-100"
          style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
        >
          {grid.map((hex, i) => (
            <button
              key={i}
              onClick={() => handleSelectColor(hex)}
              title={hex}
              className="relative aspect-square transition-transform hover:scale-110 hover:z-10"
              style={{ background: hex }}
            >
              {/* 선택된 셀 표시 */}
              {hex.toLowerCase() === bgColor.toLowerCase() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white shadow" />
                </span>
              )}
              {/* 그리드 중앙 = 책 표지 평균색 표시 */}
              {i === centerIdx && hex.toLowerCase() !== bgColor.toLowerCase() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          가운데 점(·)이 책 표지의 평균 색상이에요. 클릭해서 배경색을 고르세요.
        </p>
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
