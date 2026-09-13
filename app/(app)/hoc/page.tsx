import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { ScrollRow } from "@/app/_components/scroll-row";
import { DECK_CATEGORIES, type CategoryStyle } from "@/lib/deck-categories";
import { listDecks, type DeckSummary } from "@/lib/decks";
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
  const decks = await listDecks();
  const totalDue = decks.reduce((sum, deck) => sum + deck.dueCount, 0);

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
          totalDue > 0
            ? `${totalDue} từ đến hạn ôn hôm nay`
            : "Hôm nay bạn đã ôn hết rồi"
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
