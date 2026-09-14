import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { DeckPickCard } from "@/app/_components/deck-pick-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";
import { listPictureDecks } from "@/lib/games";
import { PICTURE_MIN_WORDS } from "@/lib/picture-game";

export const metadata: Metadata = { title: "Nghe chọn hình" };

export default async function NgheHinhPage() {
  const [decks, counts] = await Promise.all([listDecks(), listPictureDecks()]);
  const playable = decks
    .map((deck) => ({ ...deck, pictured: counts.get(deck.id) ?? 0 }))
    .filter((deck) => deck.pictured >= PICTURE_MIN_WORDS)
    .sort((a, b) => b.pictured - a.pictured);

  return (
    <>
      <PageHeader
        title="Nghe chọn hình"
        subtitle="Nghe từ, chạm đúng hình"
        mascot="nghe"
      />

      {playable.length === 0 ? (
        <EmptyState
          mascot="buon"
          title="Chưa có bộ nào đủ từ có hình"
          description="Trò này cần từ chỉ đồ vật, con vật, đồ ăn… có thể vẽ được. Bộ Giao tiếp và Cốt lõi hợp nhất."
        />
      ) : (
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {playable.map((deck) => (
            <DeckPickCard
              key={deck.id}
              deck={deck}
              href={`/tro-choi/nghe-hinh/${deck.id}`}
              action="Chơi"
              meta={`${deck.pictured} từ có hình`}
            />
          ))}
        </div>
      )}
    </>
  );
}
