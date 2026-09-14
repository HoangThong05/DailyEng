import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { MicIcon } from "@/app/_components/icons";
import { DeckPickCard } from "@/app/_components/deck-pick-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";

export const metadata: Metadata = { title: "Luyện phát âm" };

export default async function PhatAmPage() {
  const decks = (await listDecks()).filter((deck) => deck.wordCount > 0);

  return (
    <>
      <PageHeader
        title="Luyện phát âm"
        subtitle="Nghe mẫu rồi nói theo"
        mascot="noi"
      />

      {decks.length === 0 ? (
        <EmptyState
          icon={<MicIcon className="h-8 w-8" />}
          title="Chưa có bộ nào"
          description="Tạo hoặc chọn một bộ từ ở tab Học rồi quay lại đây."
        />
      ) : (
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <DeckPickCard
              key={deck.id}
              deck={deck}
              href={`/phat-am/${deck.id}`}
              action="Luyện"
            />
          ))}
        </div>
      )}
    </>
  );
}