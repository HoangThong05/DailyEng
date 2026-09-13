import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon, SpeakerIcon } from "@/app/_components/icons";
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
            <Link
              key={deck.id}
              href={`/ky-nang/chep-cau/${deck.id}`}
              className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 press"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{deck.name}</span>
                <span className="text-muted mt-0.5 block text-sm">
                  {deck.wordCount} từ
                  {deck.dueCount > 0 ? ` · ${deck.dueCount} đến hạn` : ""}
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
