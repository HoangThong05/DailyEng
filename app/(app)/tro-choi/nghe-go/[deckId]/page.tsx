import { notFound } from "next/navigation";
import { PageHeader } from "@/app/_components/page-header";
import { getDictationSession } from "@/lib/games";
import { DictationSession } from "./dictation-session";

export async function generateMetadata({
  params,
}: PageProps<"/tro-choi/nghe-go/[deckId]">) {
  const { deckId } = await params;
  const session = await getDictationSession(deckId);
  return { title: session ? `Nghe & gõ · ${session.deck.name}` : "Nghe & gõ" };
}

export default async function NgheGoDeckPage({
  params,
}: PageProps<"/tro-choi/nghe-go/[deckId]">) {
  const { deckId } = await params;
  const session = await getDictationSession(deckId);

  if (!session || session.words.length === 0) notFound();

  const { deck, words } = session;

  return (
    <>
      <PageHeader title={deck.name} subtitle={`${words.length} từ để nghe và gõ`} />
      <div className="mx-auto w-full max-w-md md:max-w-2xl">
        <DictationSession words={words} />
      </div>
    </>
  );
}
