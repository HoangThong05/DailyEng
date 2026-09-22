import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { getSentenceSession } from "@/lib/games";
import { ShadowingSession } from "./shadowing-session";

export async function generateMetadata({
  params,
}: PageProps<"/ky-nang/shadowing/[deckId]">) {
  const { deckId } = await params;
  const session = await getSentenceSession(deckId);
  return { title: session ? `Shadowing · ${session.deck.name}` : "Shadowing" };
}

export default async function ShadowingDeckPage({
  params,
}: PageProps<"/ky-nang/shadowing/[deckId]">) {
  const { deckId } = await params;
  const session = await getSentenceSession(deckId);
  if (!session) notFound();

  const { deck, items } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={items.length > 0 ? `${items.length} câu để nói theo` : undefined}
      />
      {items.length === 0 ? (
        <EmptyState
          mascot="buon"
          title="Bộ này chưa có câu ví dụ"
          description="Thêm câu ví dụ cho từ (Cá nhân → Bộ của tôi → sửa) để luyện shadowing."
        />
      ) : (
        <div className="mx-auto w-full max-w-md md:max-w-2xl">
          <ShadowingSession items={items} />
        </div>
      )}
    </>
  );
}
