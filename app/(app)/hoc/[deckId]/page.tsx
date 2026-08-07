import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { CardsIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getStudySession } from "@/lib/decks";
import { FlashcardSession } from "./flashcard-session";

export async function generateMetadata({ params }: PageProps<"/hoc/[deckId]">) {
  const { deckId } = await params;
  const session = await getStudySession(deckId);
  return { title: session?.deck.name ?? "Học từ vựng" };
}

export default async function DeckPage({ params }: PageProps<"/hoc/[deckId]">) {
  const { deckId } = await params;
  const session = await getStudySession(deckId);

  // Không tìm thấy, hoặc RLS chặn vì đây là bộ riêng của người khác.
  if (!session) notFound();

  const { deck, cards, totalWords } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={
          cards.length > 0
            ? `${cards.length} thẻ trong phiên này`
            : `${totalWords} từ trong bộ`
        }
      />

      {cards.length === 0 ? (
        <>
          <EmptyState
            icon={<CardsIcon className="h-8 w-8" />}
            title={
              totalWords === 0 ? "Bộ này chưa có từ nào" : "Hôm nay ôn xong rồi"
            }
            description={
              totalWords === 0
                ? "Thêm từ vào bộ rồi quay lại học."
                : "Các từ trong bộ đều chưa tới hạn ôn. Quay lại vào những ngày tới nhé."
            }
          />
          <div className="px-5">
            <Link
              href="/hoc"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
            >
              Chọn bộ khác
            </Link>
          </div>
        </>
      ) : (
        <FlashcardSession deckName={deck.name} cards={cards} />
      )}
    </>
  );
}