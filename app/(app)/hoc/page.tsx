import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { DeckCard } from "./deck-card";

export const metadata: Metadata = { title: "Học từ vựng" };

const GRID = "stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3";

export default async function HocPage() {
  const decks = await listDecks();
  const publicDecks = decks.filter((deck) => !deck.isOwn);
  const ownDecks = decks.filter((deck) => deck.isOwn);
  const totalDue = decks.reduce((sum, deck) => sum + deck.dueCount, 0);

  return (
    <>
      <PageHeader
        title="Học từ vựng"
        subtitle={
          totalDue > 0
            ? `${totalDue} từ đến hạn ôn hôm nay`
            : "Hôm nay bạn đã ôn hết rồi"
        }
      />

      {decks.length === 0 ? (
        <EmptyState
          mascot="hoc"
          title="Chưa có bộ thẻ nào"
          description="Chạy file supabase/schema-02-flashcard.sql trong SQL Editor để nạp các bộ từ có sẵn."
        />
      ) : (
        <div className="space-y-8 px-5 pt-2 pb-4">
          {publicDecks.length > 0 ? (
            <section aria-labelledby="bo-co-san" className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 id="bo-co-san" className="font-semibold">
                  Bộ có sẵn
                </h2>
                <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
                  {publicDecks.length}
                </span>
              </div>
              <div className={GRID}>
                {publicDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="bo-cua-toi" className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 id="bo-cua-toi" className="font-semibold">
                Bộ của tôi
              </h2>
              <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
                {ownDecks.length}
              </span>
            </div>
            <div className={GRID}>
              {ownDecks.map((deck) => (
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
                <span className="text-xs">
                  Dán danh sách từ Excel, Sheets hay Quizlet
                </span>
              </Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
