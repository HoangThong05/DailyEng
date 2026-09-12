import { notFound } from "next/navigation";
import { PageHeader } from "@/app/_components/page-header";
import { getRainSession } from "@/lib/games";
import { RainSession } from "./rain-session";

export async function generateMetadata({
  params,
}: PageProps<"/tro-choi/mua-tu/[deckId]">) {
  const { deckId } = await params;
  const session = await getRainSession(deckId);
  return {
    title: session ? `Mưa từ vựng · ${session.deck.name}` : "Mưa từ vựng",
  };
}

export default async function MuaTuDeckPage({
  params,
}: PageProps<"/tro-choi/mua-tu/[deckId]">) {
  const { deckId } = await params;
  const session = await getRainSession(deckId);

  if (!session || session.words.length === 0) notFound();

  const { deck, words } = session;

  return (
    <>
      <PageHeader title={deck.name} subtitle={`${words.length} từ sắp rơi`} />
      {/* Không bó theo bề ngang điện thoại: sân rơi càng rộng càng dễ nhìn. */}
      <RainSession words={words} />
    </>
  );
}
