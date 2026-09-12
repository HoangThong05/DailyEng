import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { ChevronRightIcon, MicIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { listDecks } from "@/lib/decks";

export const metadata: Metadata = { title: "Luyện phát âm" };

export default async function PhatAmPage() {
  const decks = (await listDecks()).filter((deck) => deck.wordCount > 0);

  return (
    <>
      <PageHeader title="Luyện phát âm" subtitle="Nghe mẫu rồi nói theo" />

      {decks.length === 0 ? (
        <EmptyState
          icon={<MicIcon className="h-8 w-8" />}
          title="Chưa có bộ nào"
          description="Tạo hoặc chọn một bộ từ ở tab Học rồi quay lại đây."
        />
      ) : (
        <div className="grid gap-3 px-5 pt-2 md:grid-cols-2">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/phat-am/${deck.id}`}
              className="border-border bg-card flex items-center gap-3 rounded-2xl border p-4 transition-transform duration-100 active:scale-[0.98]"
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