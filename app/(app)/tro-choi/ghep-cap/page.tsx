import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { GamepadIcon } from "@/app/_components/icons";
import { DeckPickCard } from "@/app/_components/deck-pick-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { MATCH_MIN_WORDS } from "@/lib/games";

export const metadata: Metadata = { title: "Ghép cặp" };

export default async function GhepCapPage() {
  const decks = (await listDecks()).filter(
    (deck) => deck.wordCount >= MATCH_MIN_WORDS,
  );

  return (
    <>
      <PageHeader title="Ghép cặp" subtitle="Chọn bộ để chơi" />

      {decks.length === 0 ? (
        <EmptyState
          icon={<GamepadIcon className="h-8 w-8" />}
          title="Chưa có bộ nào đủ từ"
          description={`Bộ thẻ cần ít nhất ${MATCH_MIN_WORDS} từ để chơi ghép cặp.`}
        />
      ) : (
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <DeckPickCard
              key={deck.id}
              deck={deck}
              href={`/tro-choi/ghep-cap/${deck.id}`}
              action="Chơi"
            />
          ))}
        </div>
      )}
    </>
  );
}
