import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon, GamepadIcon } from "@/app/_components/icons";
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
        <div className="grid gap-3 px-5 pt-2 md:grid-cols-2">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/tro-choi/ghep-cap/${deck.id}`}
              className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 press"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{deck.name}</span>
                <span className="text-muted mt-0.5 block text-sm">
                  {deck.wordCount} từ
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
