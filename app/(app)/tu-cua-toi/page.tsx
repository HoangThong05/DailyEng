import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, CloseIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { listMyWords, type MyWordStatus } from "@/lib/my-words";
import { removeMyWord } from "./actions";
import { SaveWordForm } from "./save-word-form";

export const metadata: Metadata = { title: "Từ của tôi" };

const STATUS_LABEL: Record<MyWordStatus, string> = {
  moi: "Chưa học",
  "dang-hoc": "Đang học",
  "da-thuoc": "Đã thuộc",
};

const STATUS_CLASS: Record<MyWordStatus, string> = {
  moi: "bg-border/60 text-muted",
  "dang-hoc": "bg-brand-soft text-brand",
  "da-thuoc": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default async function TuCuaToiPage() {
  const { deckId, words } = await listMyWords();
  const dueCount = words.filter((word) => word.due).length;
  const newCount = words.filter((word) => word.status === "moi").length;

  return (
    <>
      <PageHeader
        title="Từ của tôi"
        subtitle="Gặp từ hay ở đâu, lưu vào đây rồi học như bộ thường"
        mascot="hoc"
      />

      <div className="space-y-6 px-5 pt-2 pb-4">
        <SaveWordForm />

        {deckId && words.length > 0 ? (
          <Link
            href={`/hoc/${deckId}`}
            className="bg-brand shadow-brand/25 flex min-h-14 items-center justify-between rounded-2xl px-5 font-semibold text-white shadow-lg press"
          >
            <span>
              {dueCount > 0
                ? `Ôn ${dueCount} từ đến hạn`
                : newCount > 0
                  ? `Học ${newCount} từ mới`
                  : "Ôn lại Từ của tôi"}
            </span>
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        ) : null}

        <section aria-labelledby="danh-sach" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 id="danh-sach" className="text-muted text-sm font-medium">
              Đã lưu
            </h2>
            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
              {words.length}
            </span>
            {deckId ? (
              <Link href={`/hoc/${deckId}/sua`} className="text-brand ml-auto text-sm font-medium">
                Dán nhiều từ
              </Link>
            ) : null}
          </div>

          {words.length === 0 || !deckId ? (
            <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
              <Mascot variant="ngu" size={80} />
              <p className="font-semibold">Chưa có từ nào</p>
              <p className="text-muted text-sm">
                Đọc báo, xem phim, hỏi AI thấy từ lạ — gõ vào ô trên là xong.
              </p>
            </div>
          ) : (
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {words.map((word) => (
                <li key={word.id} className="flex items-center gap-1 pr-1">
                  <Link
                    href={`/hoc/${deckId}/sua/${word.id}`}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{word.term}</span>
                        {word.phonetic ? (
                          <span className="text-muted hidden truncate text-xs sm:inline">
                            {word.phonetic}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted block truncate text-sm">{word.meaningVi}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[word.status]}`}
                    >
                      {word.due ? "Đến hạn" : STATUS_LABEL[word.status]}
                    </span>
                    <ChevronRightIcon className="text-muted h-4 w-4 shrink-0" />
                  </Link>
                  <form action={removeMyWord.bind(null, deckId, word.id)}>
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
      </div>
    </>
  );
}
