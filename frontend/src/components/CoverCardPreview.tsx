"use client";

import { useState, useEffect, useRef } from "react";
import type { BookInput, AspectRatio } from "@/lib/types";

// ── 상수 ──────────────────────────────────────────────────────────────

const RATIO_CSS: Record<AspectRatio, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "4:5": "4 / 5",
};

const CANVAS_W = 1080;
const CANVAS_H: Record<AspectRatio, number> = {
  "1:1": 1080,
  "3:4": 1440,
  "4:5": 1350,
};

const GRID_COLS = 11;
const GRID_ROWS = 7;
const HUE_RANGE = 60;
const L_TOP = 88;
const L_BOTTOM = 28;

// 1080px 기준 Canvas 텍스트 상수
// 제목: ~15자 ≈ 가로 꽉 참 (31*2=62px)
// 본문: ~25자 ≈ 가로 꽉 참 (19*2=38px)
const C_PAD = 72;
const C_TITLE_PX = 62;
const C_BODY_PX = 38;
const C_TITLE_LH = 88;
const C_BODY_LH = 58;
const C_GAP = 64;

const DEFAULT_HSL: [number, number, number] = [300, 30, 70];

// ── 색상 유틸 ──────────────────────────────────────────────────────────

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
  return `#${[f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// W3C 상대 휘도 기반 글씨색 결정 (임계값 0.5)
function getTextColor(bgHex: string): string {
  const [r, g, b] = hexToRgb(bgHex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

// ── 책 표지 평균 색상 ────────────────────────────────────────────────

async function getAverageHsl(imgSrc: string): Promise<[number, number, number]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = imgSrc; });
  const SIZE = 60;
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
  const n = SIZE * SIZE;
  return rgbToHsl(r / n, g / n, b / n);
}

// ── 색상 그리드 ──────────────────────────────────────────────────────

function makeGrid(baseH: number, baseS: number): string[] {
  const s = Math.max(20, Math.min(70, baseS));
  return Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const l = L_TOP - (row * (L_TOP - L_BOTTOM)) / (GRID_ROWS - 1);
    const h = (baseH - HUE_RANGE / 2 + (col * HUE_RANGE) / (GRID_COLS - 1) + 360) % 360;
    return hslToHex(h, s, l);
  });
}

// ── Canvas 텍스트 줄바꿈 ──────────────────────────────────────────────

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    if (!para.trim()) { lines.push(""); continue; }
    const words = para.split(" ");
    let cur = "";
    for (const word of words) {
      const candidate = cur ? cur + " " + word : word;
      if (ctx.measureText(candidate).width > maxWidth && cur) {
        lines.push(cur);
        // 단어 하나가 maxWidth를 초과하면 글자 단위로 분할
        if (ctx.measureText(word).width > maxWidth) {
          let charLine = "";
          for (const ch of word) {
            const t = charLine + ch;
            if (ctx.measureText(t).width > maxWidth && charLine) { lines.push(charLine); charLine = ch; }
            else charLine = t;
          }
          cur = charLine;
        } else {
          cur = word;
        }
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

// ── Canvas 렌더러 ─────────────────────────────────────────────────────

async function drawCoverCard(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  bgColor: string,
  coverUrl: string | null,
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);
  if (!coverUrl) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = coverUrl; });

  const imgH = (h * 5) / 7;
  const imgW = img.naturalWidth * (imgH / img.naturalHeight);
  const x = (w - imgW) / 2, y = (h - imgH) / 2;

  ctx.save();
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
  ctx.restore();
}

const FONT_FAMILY = "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

function drawContentCard(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  bgColor: string,
  title: string,
  body: string,
) {
  // 배경
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // 아래→위 gradient (높이의 22%, 짧은 변)
  const g1 = ctx.createLinearGradient(0, h, 0, h * (1 - 0.22));
  g1.addColorStop(0, "rgba(0,0,0,0.28)");
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);
  // 오른쪽→왼쪽 gradient (너비의 40%, 긴 변)
  const g2 = ctx.createLinearGradient(w, 0, w * (1 - 0.40), 0);
  g2.addColorStop(0, "rgba(0,0,0,0.28)");
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  const textColor = getTextColor(bgColor);
  const maxW = w - 2 * C_PAD;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.font = `600 ${C_TITLE_PX}px ${FONT_FAMILY}`;
  const titleLines = wrapText(ctx, title, maxW);

  ctx.font = `400 ${C_BODY_PX}px ${FONT_FAMILY}`;
  const bodyLines = body.trim() ? wrapText(ctx, body, maxW) : [];

  const titleBlockH = titleLines.length * C_TITLE_LH;
  const bodyBlockH = bodyLines.length > 0 ? C_GAP + bodyLines.length * C_BODY_LH : 0;
  let y = (h - titleBlockH - bodyBlockH) / 2;

  ctx.font = `600 ${C_TITLE_PX}px ${FONT_FAMILY}`;
  ctx.fillStyle = textColor;
  for (const line of titleLines) {
    ctx.fillText(line, C_PAD, y);
    y += C_TITLE_LH;
  }

  if (bodyLines.length > 0) {
    y += C_GAP;
    ctx.font = `400 ${C_BODY_PX}px ${FONT_FAMILY}`;
    for (const line of bodyLines) {
      if (line) ctx.fillText(line, C_PAD, y);
      y += C_BODY_LH;
    }
  }
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────

interface Props {
  book: BookInput;
  coverUrl: string | null;
  onBack: () => void;
}

export default function CoverCardPreview({ book, coverUrl, onBack }: Props) {
  const [bgColor, setBgColor] = useState(() => hslToHex(...DEFAULT_HSL));
  const [grid, setGrid] = useState(() => makeGrid(...DEFAULT_HSL));
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(600);

  useEffect(() => {
    if (!coverUrl) return;
    getAverageHsl(coverUrl)
      .then(([h, s, l]) => { setGrid(makeGrid(h, s)); setBgColor(hslToHex(h, s, l)); })
      .catch(() => {});
  }, [coverUrl]);

  useEffect(() => {
    if (containerRef.current) setCardWidth(containerRef.current.offsetWidth);
  }, []);

  const textColor = getTextColor(bgColor);
  const sc = cardWidth / CANVAS_W; // preview scale
  const sPad = Math.round(C_PAD * sc);
  const sTitlePx = Math.max(10, Math.round(C_TITLE_PX * sc));
  const sBodyPx = Math.max(8, Math.round(C_BODY_PX * sc));
  const sTitleLH = Math.round(C_TITLE_LH * sc);
  const sBodyLH = Math.round(C_BODY_LH * sc);
  const sGap = Math.round(C_GAP * sc);

  const centerIdx = Math.floor(GRID_ROWS / 2) * GRID_COLS + Math.floor(GRID_COLS / 2);
  const totalCards = 1 + book.sections.length;

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      const ch = CANVAS_H[book.aspectRatio];
      const tasks: Array<{ name: string; draw: (ctx: CanvasRenderingContext2D) => Promise<void> | void }> = [
        {
          name: `${book.title}_00_표지.png`,
          draw: (ctx) => drawCoverCard(ctx, CANVAS_W, ch, bgColor, coverUrl),
        },
        ...book.sections.map((s, i) => ({
          name: `${book.title}_${String(i + 1).padStart(2, "0")}.png`,
          draw: (ctx: CanvasRenderingContext2D) => drawContentCard(ctx, CANVAS_W, ch, bgColor, s.title, s.body),
        })),
      ];

      for (const { name, draw } of tasks) {
        const cv = document.createElement("canvas");
        cv.width = CANVAS_W; cv.height = ch;
        await draw(cv.getContext("2d")!);
        await new Promise<void>(resolve => {
          cv.toBlob(blob => {
            if (!blob) { resolve(); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = name; a.click();
            setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 100);
          }, "image/png");
        });
        await new Promise(r => setTimeout(r, 300));
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-pink-400">🎴 카드 미리보기</p>
          <h2 className="mt-0.5 font-bold text-gray-900">
            《{book.title}》{" "}
            <span className="font-normal text-gray-500">— {book.author}</span>
          </h2>
          <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-500">
            📐 {book.aspectRatio} · 총 {totalCards}장
          </span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-100 transition-colors"
        >
          ← 입력으로 돌아가기
        </button>
      </div>

      {/* 카드 목록 (ref로 너비 측정) */}
      <div ref={containerRef} className="space-y-3">
        {/* 표지 카드 */}
        <p className="text-xs font-medium text-gray-400">표지 카드</p>
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
              <span className="flex items-center justify-center rounded-xl bg-white/40 text-5xl" style={{ width: "80px", height: "110px" }}>📖</span>
              <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>표지 이미지 없음</p>
            </div>
          )}
        </div>

        {/* 소문단 카드 */}
        {book.sections.length > 0 && (
          <>
            <p className="pt-1 text-xs font-medium text-gray-400">소문단 카드 ({book.sections.length}장)</p>
            {book.sections.map((section, i) => (
              <div
                key={section.id}
                className="relative w-full overflow-hidden rounded-2xl shadow-md transition-colors duration-200"
                style={{ aspectRatio: RATIO_CSS[book.aspectRatio], background: bgColor }}
              >
                {/* 오른쪽 아래 코너 그라데이션 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 22%), linear-gradient(to left, rgba(0,0,0,0.28) 0%, transparent 40%)" }}
                />
                <div
                  className="absolute inset-0 flex flex-col justify-center"
                  style={{ padding: `${sPad}px` }}
                >
                  <p
                    style={{
                      fontSize: `${sTitlePx}px`,
                      lineHeight: `${sTitleLH}px`,
                      fontWeight: 600,
                      color: textColor,
                      wordBreak: "keep-all",
                      overflowWrap: "break-word",
                    }}
                  >
                    {section.title}
                  </p>
                  {section.body.trim() && (
                    <>
                      <div style={{ height: `${sGap}px` }} />
                      <p
                        style={{
                          fontSize: `${sBodyPx}px`,
                          lineHeight: `${sBodyLH}px`,
                          color: textColor,
                          whiteSpace: "pre-wrap",
                          wordBreak: "keep-all",
                      overflowWrap: "break-word",
                          opacity: 0.85,
                        }}
                      >
                        {section.body}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
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
        <div
          className="overflow-hidden rounded-xl border border-gray-100"
          style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
        >
          {grid.map((hex, i) => (
            <button
              key={i}
              onClick={() => setBgColor(hex)}
              title={hex}
              className="relative aspect-square transition-transform hover:scale-110 hover:z-10"
              style={{ background: hex }}
            >
              {hex.toLowerCase() === bgColor.toLowerCase() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white shadow" />
                </span>
              )}
              {i === centerIdx && hex.toLowerCase() !== bgColor.toLowerCase() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">가운데 점(·)이 책 표지의 평균 색상이에요. 색상 변경 시 모든 카드에 반영됩니다.</p>
      </div>

      {/* 전체 다운로드 */}
      <button
        onClick={handleDownloadAll}
        disabled={downloading}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        {downloading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "rgba(255,255,255,0.9)" }} />
            이미지 생성 중...
          </span>
        ) : (
          `⬇️ 전체 카드 다운로드 (${totalCards}장)`
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        다음 단계에서 인스타그램에 업로드할 수 있어요.
      </p>
    </div>
  );
}
