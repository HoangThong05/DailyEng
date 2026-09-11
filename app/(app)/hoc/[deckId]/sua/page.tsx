import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CloseIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getOwnDeckWithWords } from "@/lib/decks";
import { deleteWord } from "./actions";
import { AddWordsForm } from "./add-words-form";
import { DeleteDeckButton } from "./delete-deck-button";

export const metadata: Metadata = { title: "Sửa bộ từ" };

export default async function SuaBoTuPage({
  params,
}: PageProps<"/hoc/[deckId]/sua">) {
  const { deckId } = await params;
  const data = await getOwnDeckWithWords(deckId);

  // Bộ công khai hoặc bộ của người khác: coi như không có trang này.
  if (!data) notFound();

  const { deck, words } = data;

  return (
    <>
      <PageHeader title={deck.name} subtitle={`${words.length} từ trong bộ`} />

      <div className="space-y-8 px-5 pt-2 pb-4">
        <section aria-labelledby="them-tu">
          <h2 id="them-tu" className="text-muted mb-3 px-1 text-sm font-medium">
            Thêm từ
          </h2>
          <AddWordsForm deckId={deck.id} />
        </section>

        <section aria-labelledby="danh-sach">
          <h2
            id="danh-sach"
            className="text-muted mb-3 px-1 text-sm font-medium"
          >
            Từ trong bộ
          </h2>

          {words.length === 0 ? (
            <p className="text-muted px-1 text-sm">Bộ này chưa có từ nào.</p>
          ) : (
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {words.map((word) => (
                <li
                  key={word.id}
                  className="flex items-center gap-3 py-2 pr-1 pl-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {word.term}
                    </span>
                    <span className="text-muted block truncate text-sm">
                      {word.meaning_vi}
                    </span>
                  </span>
                  <form action={deleteWord.bind(null, deck.id, word.id)}>
                    <button
                      type="submit"
                      aria-label={`Xoá từ ${word.term}`}
                      className="text-muted flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-100 active:scale-90"
                    >
                      <CloseIcon className="h-5 w-5" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="xoa-bo">
          <h2 id="xoa-bo" className="text-muted mb-3 px-1 text-sm font-medium">
            Xoá bộ
          </h2>
          <DeleteDeckButton deckId={deck.id} deckName={deck.name} />
        </section>
      </div>
    </>
  );
}
