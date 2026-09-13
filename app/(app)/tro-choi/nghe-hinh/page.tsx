import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon } from "@/app/_components/icons";
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
            <Link
              key={deck.id}
              href={`/tro-choi/nghe-hinh/${deck.id}`}
              className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 press"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{deck.name}</span>
                <span className="text-muted mt-0.5 block text-sm">
                  {deck.pictured} từ có hình
                  {deck.dueCount > 0 ? ` · ${deck.dueCount} đến hạn` : ""}
                </span>
              </span>
              <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
