import Link from "next/link";
import { ChevronRightIcon } from "@/app/_components/icons";
import type { DeckSummary } from "@/lib/decks";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export function DeckCard({ deck }: { deck: DeckSummary }) {
  const hasDue = deck.dueCount > 0;

  return (
    <Link
      href={`/hoc/${deck.id}`}
      className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 press"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold">{deck.name}</span>
          {deck.level ? (
            <span className="bg-brand-soft text-brand shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
              {LEVEL_LABEL[deck.level] ?? deck.level}
            </span>
          ) : null}
        </span>

        {deck.description ? (
          <span className="text-muted mt-0.5 block truncate text-sm">
            {deck.description}
          </span>
        ) : null}

        <span className="text-muted mt-2 block text-sm">
          {deck.wordCount} từ
          {hasDue ? (
            <>
              {" · "}
              <span className="text-brand font-semibold">
                {deck.dueCount} đến hạn
              </span>
            </>
          ) : (
            " · đã ôn xong hôm nay"
          )}
        </span>
      </span>

      <ChevronRightIcon className="text-muted h-5 w-5 shrink-0" />
    </Link>
  );
}