import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
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

/** Một hàng bộ từ cuộn ngang có snap; trên màn rộng vẫn cuộn để hàng không quá cao. */
function DeckRow({ decks }: { decks: DeckSummary[] }) {
  return (
    <div className="stagger -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
      {decks.map((deck) => (
        <div key={deck.id} className="w-[76%] shrink-0 snap-start sm:w-72">
          <DeckCard deck={deck} />
        </div>
      ))}
    </div>
  );
}

export default async function HocPage() {
  const decks = await listDecks();
  const ownDecks = decks.filter((deck) => deck.isOwn);
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

      {decks.length === 0 ? (
        <EmptyState
          mascot="hoc"
          title="Chưa có bộ thẻ nào"
          description="Chạy các file trong supabase/ (schema rồi seed) ở SQL Editor để nạp bộ từ có sẵn."
        />
      ) : (
        <div className="space-y-8 px-5 pt-2 pb-4">
          <section aria-labelledby="bo-cua-toi" className="space-y-3">
            <SectionTitle
              id="bo-cua-toi"
              title="Bộ của tôi"
              count={ownDecks.length}
            />
            <div className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
              <Link
                href="/hoc/tao"
                className="border-border text-muted hover:border-brand hover:text-brand flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors press"
              >
                <span className="bg-brand-soft text-brand flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold">
                  +
                </span>
                <span className="font-semibold">Tạo bộ từ riêng</span>
                <span className="text-xs">
                  Dán danh sách từ Excel, Sheets hay Quizlet
                </span>
              </Link>
            </div>
          </section>

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
              <DeckRow decks={group.decks} />
            </section>
          ))}

          {otherPublic.length > 0 ? (
            <section aria-labelledby="nhom-khac" className="space-y-3">
              <SectionTitle
                id="nhom-khac"
                title="Bộ khác"
                count={otherPublic.length}
              />
              <DeckRow decks={otherPublic} />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
