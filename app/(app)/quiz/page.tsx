import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon, QuizIcon } from "@/app/_components/icons";
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
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2">
          {playable.map((deck) => (
            <Link
              key={deck.id}
              href={`/quiz/${deck.id}`}
              className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 press"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{deck.name}</span>
                <span className="text-muted mt-0.5 block text-sm">
                  {deck.wordCount} từ
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