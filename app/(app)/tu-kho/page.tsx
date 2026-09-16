import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/empty-state";
import { PageHeader } from "@/app/_components/page-header";
import { SpeakWordButton } from "@/app/_components/speak-word-button";
import { BOX_INTERVAL_DAYS } from "@/lib/leitner";
import { getHardWords } from "@/lib/stats";

export const metadata: Metadata = { title: "Từ khó" };

/** Danh sách từ hay sai nhất kèm nút mở phiên ôn riêng. */
export default async function TuKhoPage() {
  const words = await getHardWords(50);

  return (
    <>
      <PageHeader
        title="Từ khó"
        subtitle={
          words.length > 0
            ? `${words.length} từ bạn hay sai nhất`
            : "Những từ bạn hay trả lời sai"
        }
        mascot="hoc"
      />

      {words.length === 0 ? (
        <>
          <EmptyState
            mascot="an-mung"
            title="Chưa có từ nào hay sai"
            description="Bạn đang nhớ rất tốt. Học thêm từ mới rồi quay lại xem nhé."
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
        <div className="stagger space-y-4 px-5 pt-2 pb-4">
          <Link
            href="/tu-kho/hoc"
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-red-500 text-lg font-bold text-white shadow-md shadow-red-500/30 press"
          >
            Ôn {Math.min(20, words.length)} từ khó nhất
          </Link>
          <p className="text-muted px-1 text-sm">
            Sắp theo số lần sai. Ôn ở đây không phụ thuộc lịch giãn cách, nhưng kết quả vẫn
            ghi vào hệ ôn tập như bình thường.
          </p>

          <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
            {words.map((word) => {
              const rate = Math.round((word.wrong / word.reviews) * 100);
              return (
                <li key={word.wordId} className="flex items-center gap-3 px-4 py-3">
                  <SpeakWordButton term={word.term} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {word.term}
                      <span className="text-muted font-normal"> · {word.meaning}</span>
                    </span>
                    <span className="text-muted block truncate text-xs">
                      {word.deckName} · hộp {word.box} ({BOX_INTERVAL_DAYS[word.box - 1]} ngày)
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-red-500 tabular-nums">
                      {word.wrong}/{word.reviews}
                    </span>
                    <span className="text-muted block text-xs tabular-nums">sai {rate}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
