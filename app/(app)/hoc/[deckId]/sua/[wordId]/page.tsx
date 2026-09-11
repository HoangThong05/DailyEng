import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/_components/page-header";
import { getOwnWord } from "@/lib/decks";
import { EditWordForm } from "./edit-word-form";

export const metadata: Metadata = { title: "Sửa từ" };

export default async function SuaTuPage({
  params,
}: PageProps<"/hoc/[deckId]/sua/[wordId]">) {
  const { deckId, wordId } = await params;
  const data = await getOwnWord(deckId, wordId);

  if (!data) notFound();

  const { deck, word } = data;

  return (
    <>
      <PageHeader
        title={word.term}
        subtitle={deck.name}
        trailing={
          <Link
            href={`/hoc/${deck.id}/sua`}
            className="text-brand shrink-0 text-sm font-semibold"
          >
            Xong
          </Link>
        }
      />
      <EditWordForm deckId={deck.id} word={word} />
    </>
  );
}
