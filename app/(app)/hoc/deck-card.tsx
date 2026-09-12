import Link from "next/link";
import { DeckCover } from "@/app/_components/deck-cover";
import { ChevronRightIcon } from "@/app/_components/icons";
import type { DeckSummary } from "@/lib/decks";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

/**
 * Thẻ bộ từ kiểu "ảnh bìa + tiến độ + nút". Cả thẻ là link vào phiên học;
 * nút Ôn ngay chỉ để nhìn cho rõ chỗ bấm.
 */
export function DeckCard({ deck }: { deck: DeckSummary }) {
  const hasDue = deck.dueCount > 0;
  const percent =
    deck.wordCount > 0
      ? Math.round((deck.learnedCount / deck.wordCount) * 100)
      : 0;

  return (
    <Link
      href={`/hoc/${deck.id}`}
      className="border-border bg-card group flex flex-col overflow-hidden rounded-2xl border press"
    >
      <div className="relative">
        <DeckCover
          deck={deck}
          sizes="(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw"
          className="aspect-[4/3]"
        />
        {hasDue ? (
          <span className="bg-brand absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
            {deck.dueCount} đến hạn
          </span>
        ) : deck.wordCount > 0 ? (
          <span className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            Đã ôn xong
          </span>
        ) : null}
        {deck.level ? (
          <span className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {LEVEL_LABEL[deck.level] ?? deck.level}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="truncate text-lg font-bold">{deck.name}</h3>
        {deck.description ? (
          <p className="text-muted line-clamp-1 text-sm">{deck.description}</p>
        ) : null}

        <div>
          <div className="text-muted flex justify-between text-xs tabular-nums">
            <span>
              Đã học {deck.learnedCount}/{deck.wordCount} từ
            </span>
            <span>{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={deck.learnedCount}
            aria-valuemin={0}
            aria-valuemax={deck.wordCount}
            aria-label={`Đã học ${deck.learnedCount} trên ${deck.wordCount} từ`}
            className="bg-brand-soft mt-1.5 h-1.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-brand h-full rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <span
          className={`mt-auto flex min-h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold transition-colors ${
            hasDue
              ? "bg-brand text-white"
              : "bg-brand-soft text-brand"
          }`}
        >
          {hasDue ? "Ôn ngay" : deck.wordCount === 0 ? "Thêm từ" : "Học lại"}
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
