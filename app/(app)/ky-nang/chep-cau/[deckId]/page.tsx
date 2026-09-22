import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { getSentenceSession } from "@/lib/games";
import { SentenceSession } from "./sentence-session";

export async function generateMetadata({
  params,
}: PageProps<"/ky-nang/chep-cau/[deckId]">) {
  const { deckId } = await params;
  const session = await getSentenceSession(deckId);
  return {
    title: session ? `Nghe chép câu · ${session.deck.name}` : "Nghe chép câu",
  };
}

export default async function ChepCauDeckPage({
  params,
}: PageProps<"/ky-nang/chep-cau/[deckId]">) {
  const { deckId } = await params;
  const session = await getSentenceSession(deckId);
  if (!session) notFound();

  const { deck, items } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={items.length > 0 ? `${items.length} câu để nghe và chép` : undefined}
      />
      {items.length === 0 ? (
        <EmptyState
          mascot="buon"
          title="Bộ này chưa có câu ví dụ"
          description="Thêm câu ví dụ cho từ (tab Học → sửa bộ) để chơi trò này."
        />
      ) : (
        <div className="mx-auto w-full max-w-md md:max-w-2xl">
          <SentenceSession items={items} />
        </div>
      )}
    </>
  );
}
