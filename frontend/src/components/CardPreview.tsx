"use client";

import { useState, useEffect } from "react";
import type { BookInput, SubSection } from "@/lib/types";

// 인스타그램 감성의 카드 배경 (그라데이션 + 색상 쌍)
const CARD_STYLES = [
  { bg: "linear-gradient(135deg, #833AB4, #C13584)", text: "#fff", sub: "rgba(255,255,255,0.7)" },
  { bg: "linear-gradient(135deg, #E1306C, #F77737)", text: "#fff", sub: "rgba(255,255,255,0.7)" },
  { bg: "linear-gradient(135deg, #F77737, #FCAF45)", text: "#fff", sub: "rgba(255,255,255,0.7)" },
  { bg: "linear-gradient(135deg, #405DE6, #833AB4)", text: "#fff", sub: "rgba(255,255,255,0.7)" },
  { bg: "linear-gradient(135deg, #C13584, #E1306C, #F77737)", text: "#fff", sub: "rgba(255,255,255,0.7)" },
];

interface CardPreviewProps {
  book: BookInput;
  onReset: () => void;
}

type State = "generating" | "ready" | "posting" | "posted";

export default function CardPreview({ book, onReset }: CardPreviewProps) {
  const [state, setState] = useState<State>("generating");
  const [selectedCard, setSelectedCard] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setState("ready"), 1500);
    return () => clearTimeout(timer);
  }, []);

  function handlePost() {
    setState("posting");
    setTimeout(() => setState("posted"), 2000);
  }

  const cards = book.sections;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-pink-400">🖼️ 카드 미리보기</p>
          <h2 className="font-bold text-gray-900 mt-0.5">
            《{book.title}》{" "}
            <span className="font-normal text-gray-500">— {book.author}</span>
          </h2>
        </div>
        <button
          onClick={onReset}
          className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-100 transition-colors"
        >
          ✏️ 다시 입력
        </button>
      </div>

      {state === "generating" && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-purple-100 bg-white py-24 shadow-sm">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
            style={{ borderTopColor: "#E1306C", borderRightColor: "#833AB4" }}
          />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">✨ 카드를 생성하는 중...</p>
            <p className="text-xs text-gray-400 mt-1">AI가 핵심 내용을 정리하고 있어요</p>
          </div>
        </div>
      )}

      {(state === "ready" || state === "posting" || state === "posted") && (
        <>
          {/* 썸네일 목록 */}
          <div className="grid grid-cols-3 gap-2">
            {cards.map((card, i) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(i)}
                className={`aspect-square rounded-2xl overflow-hidden transition-all ${
                  selectedCard === i
                    ? "ring-2 ring-offset-2 ring-pink-500 shadow-lg scale-[1.02]"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.01]"
                }`}
              >
                <MockCard card={card} index={i} bookTitle={book.title} total={cards.length} />
              </button>
            ))}
          </div>

          {/* 큰 미리보기 */}
          <div className="overflow-hidden rounded-2xl shadow-xl aspect-square">
            <MockCard
              card={cards[selectedCard]}
              index={selectedCard}
              bookTitle={book.title}
              total={cards.length}
              large
            />
          </div>

          {/* 카드 선택 도트 */}
          <div className="flex justify-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedCard(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: selectedCard === i ? "20px" : "6px",
                  background:
                    selectedCard === i
                      ? "linear-gradient(90deg, #833AB4, #E1306C)"
                      : "#d1d5db",
                }}
              />
            ))}
          </div>

          {/* 업로드 버튼 */}
          {state === "posted" ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-5 text-center space-y-2">
              <p className="text-2xl">🎉</p>
              <p className="font-semibold text-green-700">인스타그램에 업로드되었습니다!</p>
              <button
                onClick={onReset}
                className="mt-1 text-sm text-green-600 underline underline-offset-2"
              >
                새로운 카드 만들기
              </button>
            </div>
          ) : (
            <button
              onClick={handlePost}
              disabled={state === "posting"}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
            >
              {state === "posting" ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                    style={{ borderTopColor: "rgba(255,255,255,0.9)" }}
                  />
                  인스타그램에 올리는 중...
                </span>
              ) : (
                "📸 인스타그램에 올리기"
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function MockCard({
  card,
  index,
  bookTitle,
  total,
  large = false,
}: {
  card: SubSection;
  index: number;
  bookTitle: string;
  total: number;
  large?: boolean;
}) {
  const style = CARD_STYLES[index % CARD_STYLES.length];

  return (
    <div
      className="relative flex h-full w-full flex-col justify-between"
      style={{ background: style.bg, padding: large ? "28px" : "10px" }}
    >
      {/* 장식 원 */}
      <div
        className="absolute top-0 right-0 rounded-full opacity-10"
        style={{
          width: large ? "180px" : "60px",
          height: large ? "180px" : "60px",
          background: "white",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 rounded-full opacity-10"
        style={{
          width: large ? "120px" : "40px",
          height: large ? "120px" : "40px",
          background: "white",
          transform: "translate(-30%, 30%)",
        }}
      />

      {/* 책 제목 */}
      <p
        className="font-medium relative z-10"
        style={{
          color: style.sub,
          fontSize: large ? "12px" : "6px",
          fontFamily: "serif",
        }}
      >
        📖 《{bookTitle}》
      </p>

      {/* 소문단 제목 */}
      <p
        className="font-bold leading-snug relative z-10"
        style={{
          color: style.text,
          fontSize: large ? "22px" : "9px",
          fontFamily: "serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      >
        {card.title}
      </p>

      {/* 페이지 */}
      <p
        className="relative z-10"
        style={{
          color: style.sub,
          fontSize: large ? "11px" : "6px",
        }}
      >
        {index + 1} / {total}
      </p>
    </div>
  );
}
