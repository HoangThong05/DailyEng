import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { CardsIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getReviewSession } from "@/lib/decks";
import { isAiEnabled } from "@/lib/ai";
import { buildStages } from "@/lib/study-path";
import { CardSession } from "../hoc/[deckId]/card-session";
import { PathSession } from "../hoc/[deckId]/path-session";
import { ModeTabs, readMode } from "@/app/_components/mode-tabs";

export const metadata: Metadata = { title: "Ôn tập hôm nay" };

/** Ôn từ đến hạn từ mọi bộ trong một phiên, không cần vào từng bộ. */
export default async function OnTapPage({ searchParams }: PageProps<"/on-tap">) {
  const [{ "che-do": modeParam }, { cards, totalDue, pool }] = await Promise.all([
    searchParams,
    getReviewSession(),
  ]);
  // Ôn từ đã quen thì thẻ lật nhanh hơn; ai thích gõ vẫn chuyển được.
  const mode = readMode(modeParam, "the");
  const stages = buildStages(cards, pool);

  return (
    <>
      <PageHeader
        title="Ôn tập hôm nay"
        subtitle={
          cards.length > 0
            ? `${cards.length} từ trong phiên này · ${totalDue} từ đến hạn`
            : "Từ đã học, tới ngày ôn lại"
        }
        mascot="hoc"
      />

      {cards.length === 0 ? (
        <>
          <EmptyState
            icon={<CardsIcon className="h-8 w-8" />}
            title="Hôm nay không có từ nào đến hạn"
            description="Học thêm từ mới ở tab Học, hoặc quay lại vào ngày mai nhé."
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
        <>
          <ModeTabs mode={mode} basePath="/on-tap" />
          <div className="mx-auto w-full max-w-md md:max-w-2xl">
            {mode === "the" ? (
              <CardSession title="Ôn tập hôm nay" words={cards} aiEnabled={isAiEnabled()} />
            ) : (
              <PathSession deckName="Ôn tập hôm nay" stages={stages} pool={pool} aiEnabled={isAiEnabled()} />
            )}
          </div>
        </>
      )}
    </>
  );
}
