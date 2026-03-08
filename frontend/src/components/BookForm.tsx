"use client";

import { useState } from "react";
import type { SubSection, BookInput } from "@/lib/types";
import CoverCardPreview from "./CoverCardPreview";

const MAX_SECTIONS = 6;

export default function BookForm() {
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [completedSections, setCompletedSections] = useState<SubSection[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentBody, setCurrentBody] = useState("");
  const [submitted, setSubmitted] = useState<BookInput | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:5">("1:1");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  const sectionNumber = completedSections.length + 1;
  const isBookInfoFilled = bookTitle.trim() !== "" && bookAuthor.trim() !== "";
  const isCurrentFilled = currentTitle.trim() !== "" && currentBody.trim() !== "";
  const isCurrentEmpty = currentTitle.trim() === "" && currentBody.trim() === "";
  const isCurrentPartial = !isCurrentFilled && !isCurrentEmpty;
  const canAddMore = sectionNumber < MAX_SECTIONS;
  const canFinish = isBookInfoFilled && !isCurrentPartial;

  function handleAddSection() {
    if (!isCurrentFilled) return;
    setCompletedSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: currentTitle.trim(), body: currentBody.trim() },
    ]);
    setCurrentTitle("");
    setCurrentBody("");
  }

  function handleRemoveSection(id: string) {
    setCompletedSections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleFinish() {
    if (!canFinish) return;
    const allSections: SubSection[] = isCurrentFilled
      ? [...completedSections, { id: crypto.randomUUID(), title: currentTitle.trim(), body: currentBody.trim() }]
      : [...completedSections];
    setSubmitted({ title: bookTitle.trim(), author: bookAuthor.trim(), sections: allSections, aspectRatio });
  }

  async function handleFetchCover() {
    if (!bookTitle.trim()) return;
    setCoverLoading(true);
    setCoverError(null);
    setCoverUrl(null);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}&maxResults=1`
      );
      const data = await res.json();
      const raw: string | undefined = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
      if (!raw) {
        setCoverError("표지 이미지를 찾을 수 없어요.");
      } else {
        setCoverUrl(raw.replace("http://", "https://").replace("zoom=1", "zoom=3"));
      }
    } catch {
      setCoverError("표지를 불러오는 중 오류가 발생했어요.");
    } finally {
      setCoverLoading(false);
    }
  }

  function handleBack() {
    setSubmitted(null);
  }

  if (submitted) {
    return <CoverCardPreview book={submitted} coverUrl={coverUrl} onBack={handleBack} />;
  }

  return (
    <div className="space-y-3">
      {/* 책 정보 */}
      <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
          📚 책 정보
        </p>
        <div className="flex gap-4">
          {/* 입력 필드 + 버튼 */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="book-title">
                책 제목
              </label>
              <input
                id="book-title"
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="예: 팀장의 탄생"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="book-author">
                저자
              </label>
              <input
                id="book-author"
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="예: 마이클 왓킨스"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleFetchCover}
                disabled={!bookTitle.trim() || coverLoading}
                className="w-full rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {coverLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent"
                      style={{ borderTopColor: "#833AB4" }}
                    />
                    가져오는 중...
                  </span>
                ) : (
                  "🔍 표지 가져오기"
                )}
              </button>
              {coverError && (
                <p className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">
                  ⚠️ {coverError}
                </p>
              )}
            </div>
          </div>

          {/* 표지 이미지 */}
          <div className="shrink-0 w-28">
            <p className="mb-1.5 text-sm font-medium text-gray-700">표지</p>
            <div className="w-28 h-40 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={`${bookTitle} 표지`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl opacity-30">📖</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 완료된 소문단 목록 */}
      {completedSections.map((section, i) => (
        <div
          key={section.id}
          className="flex items-start gap-3 rounded-2xl border border-pink-100 bg-white px-5 py-4 shadow-sm"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #833AB4, #E1306C)" }}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">✅ {section.title}</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{section.body}</p>
          </div>
          <button
            onClick={() => handleRemoveSection(section.id)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            삭제
          </button>
        </div>
      ))}

      {/* 현재 소문단 입력 */}
      <section className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
            >
              {sectionNumber}
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-400">
              ✏️ 소문단 입력
            </p>
          </div>
          <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-pink-500">
            {sectionNumber} / {MAX_SECTIONS}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="section-title">
            소문단 제목
          </label>
          <input
            id="section-title"
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="예: 개발팀과 성공적으로 협업하려면, 애자일 전략"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-pink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="section-body">
            소문단 내용
          </label>
          <textarea
            id="section-body"
            value={currentBody}
            onChange={(e) => setCurrentBody(e.target.value)}
            placeholder={
              "Agile(날렵함) : 부서 간 경계를 허물고 팀원에게 의사결정 권한을 부여해 속도를 빠르게 하는 조직 전략\n\ntip) 스프린트 플래닝. 애자일은 그냥 주어지지 않는다. 매주 무엇을 완료했는지, 무엇을 할 것인지 체크하며 확실한 목표를 부여하자."
            }
            rows={6}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-pink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all resize-none"
          />
        </div>

        {/* 안내 메시지 */}
        {!isBookInfoFilled && (
          <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-600">
            ⚠️ 책 제목과 저자를 먼저 입력해 주세요.
          </p>
        )}
        {isBookInfoFilled && isCurrentPartial && (
          <p className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">
            ⚠️ 소문단 {currentTitle.trim() === "" ? "제목" : "내용"}을 입력하거나, 입력한 내용을 지우고 완료해 주세요.
          </p>
        )}

        {/* 카드 비율 선택 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">📐 카드 비율</p>
          <div className="flex gap-2">
            {(["1:1", "3:4", "4:5"] as const).map((ratio) => {
              const [w, h] = ratio.split(":").map(Number);
              const isSelected = aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-pink-400 bg-pink-50 text-pink-600 shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
                  }`}
                >
                  {/* 비율 시각화 박스 */}
                  <span
                    className={`block rounded border-2 ${isSelected ? "border-pink-400 bg-pink-100" : "border-gray-300 bg-gray-200"}`}
                    style={{
                      width: `${(w / h) * 32}px`,
                      height: "32px",
                    }}
                  />
                  {ratio}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {canAddMore && (
            <button
              onClick={handleAddSection}
              disabled={!isBookInfoFilled || !isCurrentFilled}
              className="flex-1 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-medium text-pink-600 hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              ➕ 다음 소문단
            </button>
          )}
          <button
            onClick={handleFinish}
            disabled={!canFinish}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{
              background: canFinish
                ? "linear-gradient(135deg, #833AB4, #E1306C, #F77737)"
                : undefined,
              backgroundColor: canFinish ? undefined : "#d1d5db",
            }}
          >
            🎴 카드 만들기
          </button>
        </div>
      </section>
    </div>
  );
}
