import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { PathSession } from "@/app/(app)/hoc/[deckId]/path-session";
import { isAiEnabled } from "@/lib/ai";
import { getHardSession } from "@/lib/decks";
import { buildStages } from "@/lib/study-path";

export const metadata: Metadata = { title: "Ôn từ khó" };

export default async function OnTuKhoPage() {
  const { cards, pool } = await getHardSession();
  const stages = buildStages(cards, pool);

  return (
    <>
      <PageHeader
        title="Ôn từ khó"
        subtitle={cards.length > 0 ? `${cards.length} từ hay sai nhất` : undefined}
        mascot="hoc"
      />
      {cards.length === 0 ? (
        <>
          <EmptyState
            mascot="an-mung"
            title="Không còn từ nào hay sai"
            description="Bạn đang nhớ rất tốt — quay lại học từ mới nhé."
          />
          <div className="px-5">
            <Link
              href="/hoc"
              className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
            >
              Học từ mới
            </Link>
          </div>
        </>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <PathSession deckName="Từ khó" stages={stages} pool={pool} aiEnabled={isAiEnabled()} />
        </div>
      )}
    </>
  );
}
