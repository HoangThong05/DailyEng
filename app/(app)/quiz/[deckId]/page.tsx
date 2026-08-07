import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { QuizIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getQuizSession } from "@/lib/quiz";
import { QuizSession } from "./quiz-session";

export async function generateMetadata({
  params,
}: PageProps<"/quiz/[deckId]">) {
  const { deckId } = await params;
  const session = await getQuizSession(deckId);
  return { title: session ? `Quiz · ${session.deck.name}` : "Quiz" };
}

export default async function QuizDeckPage({
  params,
}: PageProps<"/quiz/[deckId]">) {
  const { deckId } = await params;
  const session = await getQuizSession(deckId);

  // Không tìm thấy, hoặc RLS chặn vì đây là bộ riêng của người khác.
  if (!session) notFound();

  const { deck, questions, wordCount } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={
          questions.length > 0
            ? `${questions.length} câu trắc nghiệm`
            : `${wordCount} từ trong bộ`
        }
      />

      {questions.length === 0 ? (
        <>
          <EmptyState
            icon={<QuizIcon className="h-8 w-8" />}
            title="Bộ này chưa đủ từ"
            description="Cần ít nhất 2 từ mới dựng được câu hỏi có đáp án sai để chọn."
          />
          <div className="px-5">
            <Link
              href="/quiz"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
            >
              Chọn bộ khác
            </Link>
          </div>
        </>
      ) : (
        <QuizSession deckId={deckId} questions={questions} />
      )}
    </>
  );
}