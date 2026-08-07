import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { CardsIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { DeckCard } from "./deck-card";

export const metadata: Metadata = { title: "Học từ vựng" };

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
          icon={<CardsIcon className="h-8 w-8" />}
          title="Chưa có bộ thẻ nào"
          description="Chạy file supabase/schema-02-flashcard.sql trong SQL Editor để nạp các bộ từ có sẵn."
        />
      ) : (
        <div className="space-y-6 px-5 pt-2">
          {publicDecks.length > 0 ? (
            <section aria-labelledby="bo-co-san" className="space-y-3">
              <h2
                id="bo-co-san"
                className="text-muted px-1 text-sm font-medium"
              >
                Bộ có sẵn
              </h2>
              {publicDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </section>
          ) : null}

          <section aria-labelledby="bo-cua-toi" className="space-y-3">
            <h2 id="bo-cua-toi" className="text-muted px-1 text-sm font-medium">
              Bộ của tôi
            </h2>

            {ownDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}

            <Link
              href="/hoc/tao"
              className="border-border text-muted flex min-h-14 items-center justify-center rounded-2xl border border-dashed text-sm font-medium transition-transform duration-100 active:scale-[0.98]"
            >
              + Tạo bộ từ riêng
            </Link>
          </section>
        </div>
      )}
    </>
  );
}