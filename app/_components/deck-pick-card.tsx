import Link from "next/link";
import { categoryOf } from "@/lib/deck-categories";
import type { DeckSummary } from "@/lib/decks";
import { DeckCover } from "./deck-cover";
import { ChevronRightIcon } from "./icons";

type Props = {
  deck: DeckSummary;
  href: string;
  /** Dòng phụ, ví dụ "38 từ có hình". Mặc định: số từ trong bộ. */
  meta?: string;
  /** Chữ trên nút, ví dụ "Chơi". */
  action?: string;
};

/**
 * Thẻ chọn bộ dùng chung cho mọi trò chơi / bài luyện: bìa vẽ riêng của bộ,
 * nhãn nhóm màu, badge đến hạn, thanh tiến độ đã học và nút hành động.
 */
export function DeckPickCard({ deck, href, meta, action = "Chơi" }: Props) {
  const category = categoryOf(deck.category);
  const percent =
    deck.wordCount > 0
      ? Math.round((deck.learnedCount / deck.wordCount) * 100)
      : 0;

  return (
    <Link
      href={href}
      className="border-border bg-card group flex items-center gap-3 overflow-hidden rounded-2xl border p-3 press"
    >
      <div className="relative shrink-0">
        <DeckCover
          deck={deck}
          sizes="112px"
          className="h-20 w-28 rounded-xl"
        />
        {deck.dueCount > 0 ? (
          <span
            className={`absolute -top-1.5 -right-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md ${
              category?.solid ?? "bg-brand text-white"
            }`}
          >
            {deck.dueCount}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        {category ? (
          <span className={`text-[11px] font-bold tracking-wide uppercase ${category.text}`}>
            {category.label}
          </span>
        ) : deck.isOwn ? (
          <span className="text-brand text-[11px] font-bold tracking-wide uppercase">
            Bộ của tôi
          </span>
        ) : null}
        <span className="block truncate font-semibold">{deck.name}</span>
        <span className="text-muted mt-0.5 block text-sm">
          {meta ?? `${deck.wordCount} từ`}
          {deck.dueCount > 0 ? ` · ${deck.dueCount} đến hạn` : ""}
        </span>
        <div
          aria-hidden
          className={`mt-2 h-1 overflow-hidden rounded-full ${category?.track ?? "bg-brand-soft"}`}
        >
          <div
            className={`h-full rounded-full ${category?.solid ?? "bg-brand"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <span
        className={`hidden min-h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-bold sm:flex ${
          category?.soft ?? "bg-brand-soft text-brand"
        }`}
      >
        {action}
        <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
      <ChevronRightIcon className="text-muted h-5 w-5 shrink-0 sm:hidden" />
    </Link>
  );
}
