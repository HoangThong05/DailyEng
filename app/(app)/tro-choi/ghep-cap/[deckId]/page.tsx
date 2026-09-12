import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/app/_components/empty-state";
import { GamepadIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { buildMatchTiles, getMatchSession, MATCH_MIN_WORDS } from "@/lib/games";
import { MatchSession } from "./match-session";

export async function generateMetadata({
  params,
}: PageProps<"/tro-choi/ghep-cap/[deckId]">) {
  const { deckId } = await params;
  const session = await getMatchSession(deckId);
  return { title: session ? `Ghép cặp · ${session.deck.name}` : "Ghép cặp" };
}

export default async function GhepCapDeckPage({
  params,
}: PageProps<"/tro-choi/ghep-cap/[deckId]">) {
  const { deckId } = await params;
  const session = await getMatchSession(deckId);

  if (!session) notFound();

  const { deck, pairs, wordCount } = session;

  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={
          pairs.length > 0
            ? `${pairs.length} cặp từ – nghĩa`
            : `${wordCount} từ trong bộ`
        }
      />

      {pairs.length < 2 ? (
        <>
          <EmptyState
            icon={<GamepadIcon className="h-8 w-8" />}
            title="Bộ này chưa đủ từ"
            description={`Cần ít nhất ${MATCH_MIN_WORDS} từ có nghĩa khác nhau để chơi.`}
          />
          <div className="px-5">
            <Link
              href="/tro-choi/ghep-cap"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
            >
              Chọn bộ khác
            </Link>
          </div>
        </>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <MatchSession
            deckId={deck.id}
            pairs={pairs}
            initialTiles={buildMatchTiles(pairs)}
          />
        </div>
      )}
    </>
  );
}
