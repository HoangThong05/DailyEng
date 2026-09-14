import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { QuizIcon } from "@/app/_components/icons";
import { DeckPickCard } from "@/app/_components/deck-pick-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage() {
  const decks = await listDecks();
  // Dưới 2 từ thì không dựng nổi câu hỏi trắc nghiệm.
  const playable = decks.filter((deck) => deck.wordCount >= 2);

  return (
    <>
      <PageHeader title="Quiz" subtitle="Chọn bộ để kiểm tra lại" mascot="hoc" />

      {playable.length === 0 ? (
        <EmptyState
          icon={<QuizIcon className="h-8 w-8" />}
          title="Chưa có bộ nào để làm quiz"
          description="Bộ thẻ cần ít nhất 2 từ mới dựng được câu hỏi trắc nghiệm."
        />
      ) : (
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {playable.map((deck) => (
            <DeckPickCard
              key={deck.id}
              deck={deck}
              href={`/quiz/${deck.id}`}
              action="Làm quiz"
            />
          ))}
        </div>
      )}
    </>
  );
}