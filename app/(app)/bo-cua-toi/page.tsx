import type { Metadata } from "next";
import Link from "next/link";
import { DeckCard } from "@/app/(app)/hoc/deck-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";

export const metadata: Metadata = { title: "Bộ của tôi" };

/** Bộ từ tự tạo của người dùng, tách khỏi tab Học (chỉ còn bộ có sẵn). */
export default async function BoCuaToiPage() {
  const decks = (await listDecks()).filter((deck) => deck.isOwn);

  return (
    <>
      <PageHeader
        title="Bộ của tôi"
        subtitle={decks.length > 0 ? `${decks.length} bộ tự tạo` : "Chưa có bộ nào"}
        mascot="hoc"
      />
      <div className="px-5 pt-2 pb-4">
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
          <Link
            href="/hoc/tao"
            className="border-border text-muted hover:border-brand hover:text-brand flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors press"
          >
            <span className="bg-brand-soft text-brand flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
              +
            </span>
            <span className="font-semibold">Tạo bộ từ riêng</span>
            <span className="text-xs">Dán danh sách từ Excel, Sheets hay Quizlet</span>
          </Link>
        </div>
      </div>
    </>
  );
}
