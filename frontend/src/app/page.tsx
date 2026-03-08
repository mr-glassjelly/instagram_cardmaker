import BookForm from "@/components/BookForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shadow-sm"
            style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
          >
            📖
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-gray-900">Book Card Maker</h1>
            <p className="text-xs text-pink-500 font-medium">책 내용을 인스타그램 카드로 ✨</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BookForm />
      </div>
    </main>
  );
}
