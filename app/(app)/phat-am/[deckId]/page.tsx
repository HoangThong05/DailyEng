import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { MicIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { getDeckWithWords } from "@/lib/decks";
import { PronunciationSession } from "./pronunciation-session";

export async function generateMetadata({
  params,
}: PageProps<"/phat-am/[deckId]">) {
  const { deckId } = await params;
  const data = await getDeckWithWords(deckId);
  return { title: data ? `Phát âm · ${data.deck.name}` : "Luyện phát âm" };
}

export default async function PhatAmDeckPage({
  params,
}: PageProps<"/phat-am/[deckId]">) {
  const { deckId } = await params;
  const data = await getDeckWithWords(deckId);

  // Không tìm thấy, hoặc RLS chặn vì đây là bộ riêng của người khác.
  if (!data) notFound();

  const { deck, words } = data;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={`${words.length} từ`}
        trailing={<Mascot variant="noi" size={56} className="shrink-0" />}
      />

      {words.length === 0 ? (
        <>
          <EmptyState
            icon={<MicIcon className="h-8 w-8" />}
            title="Bộ này chưa có từ nào"
            description="Thêm từ vào bộ rồi quay lại luyện phát âm."
          />
          <div className="px-5">
            <Link
              href="/phat-am"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
            >
              Chọn bộ khác
            </Link>
          </div>
        </>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <PronunciationSession deckName={deck.name} words={words} />
        </div>
      )}
    </>
  );
}