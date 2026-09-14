import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/empty-state";
import { SpeakerIcon } from "@/app/_components/icons";
import { DeckPickCard } from "@/app/_components/deck-pick-card";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";

export const metadata: Metadata = { title: "Nghe chép câu" };

export default async function ChepCauPage() {
  const decks = (await listDecks()).filter((deck) => deck.wordCount > 0);

  return (
    <>
      <PageHeader
        title="Nghe chép câu"
        subtitle="Nghe cả câu ví dụ rồi gõ lại"
        mascot="nghe"
      />

      {decks.length === 0 ? (
        <EmptyState
          icon={<SpeakerIcon className="h-8 w-8" />}
          title="Chưa có bộ nào"
          description="Tạo hoặc chọn một bộ từ ở tab Học rồi quay lại đây."
        />
      ) : (
        <div className="stagger grid gap-3 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <DeckPickCard
              key={deck.id}
              deck={deck}
              href={`/ky-nang/chep-cau/${deck.id}`}
              action="Luyện"
            />
          ))}
        </div>
      )}
    </>
  );
}
