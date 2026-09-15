import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { ScrollRow } from "@/app/_components/scroll-row";
import { DECK_CATEGORIES, type CategoryStyle } from "@/lib/deck-categories";
import { countDueReviews, listDecks, type DeckSummary } from "@/lib/decks";
import { DeckCard } from "./deck-card";

export const metadata: Metadata = { title: "Học từ vựng" };

function SectionTitle({
  id,
  title,
  count,
  description,
  category,
}: {
  id: string;
  title: string;
  count: number;
  description?: string;
  /** Có nhóm thì tiêu đề mang màu nhóm: vạch màu bên trái + chip đếm. */
  category?: CategoryStyle;
}) {
  return (
    <div className="px-1">
      <div className="flex items-center gap-2">
        {category ? (
          <span
            aria-hidden
            className={`h-5 w-1.5 rounded-full bg-gradient-to-b ${category.gradient}`}
          />
        ) : null}
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
            category?.soft ?? "bg-brand-soft text-brand"
          }`}
        >
          {count}
        </span>
      </div>
      {description ? (
        <p className="text-muted mt-0.5 text-sm">{description}</p>
      ) : null}
    </div>
  );
}

/** Một hàng bộ từ cuộn ngang có snap và nút mũi tên; trên màn rộng vẫn cuộn để hàng không quá cao. */
function DeckRow({ decks, label }: { decks: DeckSummary[]; label: string }) {
  return (
    <ScrollRow label={label} className="stagger -mx-5 px-5 pb-2 md:mx-0 md:px-0">
      {decks.map((deck) => (
        <div key={deck.id} className="w-[76%] shrink-0 snap-start sm:w-72">
          <DeckCard deck={deck} />
        </div>
      ))}
    </ScrollRow>
  );
}

export default async function HocPage() {
  const [decks, dueReviews] = await Promise.all([listDecks(), countDueReviews()]);

  // Nhóm có bộ mới hiện; bộ công khai không thuộc nhóm nào thì gom vào "Khác".
  const groups = DECK_CATEGORIES.map((category) => ({
    ...category,
    decks: decks.filter(
      (deck) => !deck.isOwn && deck.category === category.key,
    ),
  })).filter((group) => group.decks.length > 0);
  const otherPublic = decks.filter(
    (deck) => !deck.isOwn && !groups.some((g) => g.key === deck.category),
  );

  return (
    <>
      <PageHeader
        title="Học từ vựng"
        mascot="hoc"
        subtitle={
          dueReviews > 0
            ? `${dueReviews} từ đến hạn ôn hôm nay`
            : "Không có từ nào đến hạn ôn"
        }
      />

      {decks.filter((deck) => !deck.isOwn).length === 0 ? (
        <EmptyState
          mascot="hoc"
          title="Chưa có bộ thẻ nào"
          description="Chạy các file trong supabase/ (schema rồi seed) ở SQL Editor để nạp bộ từ có sẵn. Bộ tự tạo nằm ở tab Cá nhân."
        />
      ) : (
        <div className="space-y-8 px-5 pt-2 pb-4">
          {dueReviews > 0 ? (
            <Link
              href="/on-tap"
              className="group flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 p-3 pr-4 press dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-lg font-extrabold text-white tabular-nums shadow-md shadow-amber-500/30">
                {dueReviews}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Ôn tập hôm nay</span>
                <span className="text-muted block text-sm">Từ đã học tới hạn, gom từ mọi bộ</span>
              </span>
              <span className="flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white">
                Ôn ngay
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : null}

          {groups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`nhom-${group.key}`}
              className="space-y-3"
            >
              <SectionTitle
                id={`nhom-${group.key}`}
                title={group.label}
                count={group.decks.length}
                description={group.description}
                category={group}
              />
              <DeckRow decks={group.decks} label={`bộ ${group.label}`} />
            </section>
          ))}

          {otherPublic.length > 0 ? (
            <section aria-labelledby="nhom-khac" className="space-y-3">
              <SectionTitle
                id="nhom-khac"
                title="Bộ khác"
                count={otherPublic.length}
              />
              <DeckRow decks={otherPublic} label="bộ khác" />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
