import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { getPictureSession } from "@/lib/games";
import { PictureSession } from "./picture-session";

export async function generateMetadata({
  params,
}: PageProps<"/tro-choi/nghe-hinh/[deckId]">) {
  const { deckId } = await params;
  const session = await getPictureSession(deckId);
  return {
    title: session ? `Nghe chọn hình · ${session.deck.name}` : "Nghe chọn hình",
  };
}

export default async function NgheHinhDeckPage({
  params,
}: PageProps<"/tro-choi/nghe-hinh/[deckId]">) {
  const { deckId } = await params;
  const session = await getPictureSession(deckId);
  if (!session) notFound();

  const { deck, questions } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={questions.length > 0 ? `${questions.length} từ để nghe và chọn` : undefined}
      />
      {questions.length === 0 ? (
        <EmptyState
          mascot="buon"
          title="Bộ này chưa đủ từ có hình"
          description="Cần ít nhất 4 từ chỉ đồ vật, con vật, đồ ăn… Thử bộ Giao tiếp hoặc Cốt lõi."
        />
      ) : (
        <div className="mx-auto w-full max-w-md">
          <PictureSession questions={questions} />
        </div>
      )}
    </>
  );
}
