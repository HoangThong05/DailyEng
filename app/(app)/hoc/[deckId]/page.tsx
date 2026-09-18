import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { CardsIcon, PencilIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getStudySession } from "@/lib/decks";
import { isAiEnabled } from "@/lib/ai";
import { buildStages } from "@/lib/study-path";
import { CardSession } from "./card-session";
import { PathSession } from "./path-session";
import { ModeTabs, readMode } from "@/app/_components/mode-tabs";

export async function generateMetadata({ params }: PageProps<"/hoc/[deckId]">) {
  const { deckId } = await params;
  const session = await getStudySession(deckId);
  return { title: session?.deck.name ?? "Học từ vựng" };
}

export default async function DeckPage({ params, searchParams }: PageProps<"/hoc/[deckId]">) {
  const [{ deckId }, { "che-do": modeParam }] = await Promise.all([params, searchParams]);
  const session = await getStudySession(deckId);
  // Bộ từ thường có từ mới → mặc định theo chặng (phải gõ mới nhớ).
  const mode = readMode(modeParam, "chang");

  // Không tìm thấy, hoặc RLS chặn vì đây là bộ riêng của người khác.
  if (!session) notFound();

  const { deck, cards, totalWords, pool } = session;
  // Trộn ở server một lần; client đi theo, không tự trộn lúc render.
  const stages = buildStages(cards, pool);

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={
          cards.length > 0
            ? `${cards.length} thẻ trong phiên này`
            : `${totalWords} từ trong bộ`
        }
        trailing={
          deck.isOwn ? (
            <Link
              href={`/hoc/${deck.id}/sua`}
              aria-label="Sửa bộ từ"
              className="border-border bg-card flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-transform duration-100 active:scale-90"
            >
              <PencilIcon className="h-5 w-5" />
            </Link>
          ) : undefined
        }
      />

      {cards.length === 0 ? (
        <>
          <EmptyState
            icon={<CardsIcon className="h-8 w-8" />}
            title={
              totalWords === 0 ? "Bộ này chưa có từ nào" : "Hôm nay ôn xong rồi"
            }
            description={
              totalWords === 0
                ? "Bấm nút bút ở góc trên để thêm từ vào bộ."
                : "Các từ trong bộ đều chưa tới hạn ôn. Quay lại vào những ngày tới nhé."
            }
          />
          <div className="px-5">
            <Link
              href="/hoc"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
            >
              Chọn bộ khác
            </Link>
          </div>
        </>
      ) : (
        <>
          <ModeTabs mode={mode} basePath={`/hoc/${deck.id}`} />
          <div className="mx-auto w-full max-w-md">
            {mode === "the" ? (
              <CardSession title={deck.name} words={cards} aiEnabled={isAiEnabled()} />
            ) : (
              <PathSession deckName={deck.name} stages={stages} pool={pool} aiEnabled={isAiEnabled()} />
            )}
          </div>
        </>
      )}
    </>
  );
}