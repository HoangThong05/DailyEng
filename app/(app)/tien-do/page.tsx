import type { Metadata } from "next";
import { FlameIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { BOX_INTERVAL_DAYS } from "@/lib/leitner";
import { getDetailedStats, getStudyStats } from "@/lib/stats";
import { WeekChart } from "./week-chart";

export const metadata: Metadata = { title: "Tiến độ" };

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

export default async function TienDoPage() {
  const [{ streak, today, week, totals }, detail] = await Promise.all([
    getStudyStats(),
    getDetailedStats(),
  ]);
  const boxTotal = detail.boxes.reduce((sum, count) => sum + count, 0);

  return (
    <>
      <PageHeader title="Tiến độ" subtitle="Thống kê học tập" />

      <div className="grid gap-6 px-5 pt-2 md:grid-cols-2">
        <section
          aria-labelledby="chuoi-ngay"
          className="border-border bg-card flex items-center gap-4 rounded-2xl border p-5 md:col-span-2"
        >
          <span className="bg-brand-soft text-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
            <FlameIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h2 id="chuoi-ngay" className="text-2xl font-bold">
              {streak.current} ngày
            </h2>
            <p className="text-muted text-sm">
              {streak.current === 0
                ? "Học một từ hôm nay để bắt đầu chuỗi"
                : `Chuỗi hiện tại · dài nhất ${streak.longest} ngày`}
            </p>
          </div>
        </section>

        <section aria-labelledby="hom-nay" className="space-y-3">
          <h2 id="hom-nay" className="text-muted px-1 text-sm font-medium">
            Hôm nay
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatTile value={String(today.words)} label="từ đã ôn" />
            <StatTile value={String(today.reviews)} label="lượt ôn" />
            <StatTile
              value={
                today.reviews > 0
                  ? `${Math.round((today.correct / today.reviews) * 100)}%`
                  : "—"
              }
              label="nhớ được"
            />
          </div>
        </section>

        <section
          aria-labelledby="bay-ngay"
          className="border-border bg-card rounded-2xl border p-5"
        >
          <h2 id="bay-ngay" className="mb-4 font-semibold">
            7 ngày gần nhất
          </h2>
          <WeekChart week={week} />
        </section>

        <section aria-labelledby="tong-ket" className="space-y-3">
          <h2 id="tong-ket" className="text-muted px-1 text-sm font-medium">
            Tổng kết
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatTile value={String(totals.wordsSeen)} label="từ đã học" />
            <StatTile
              value={String(totals.wordsMastered)}
              label="từ đã thuộc"
            />
            <StatTile
              value={totals.accuracy === null ? "—" : `${totals.accuracy}%`}
              label="tỉ lệ nhớ"
            />
          </div>
        </section>

        {boxTotal > 0 ? (
          <section
            aria-labelledby="hop-on"
            className="border-border bg-card rounded-2xl border p-5"
          >
            <h2 id="hop-on" className="font-semibold">
              Từ đang ở đâu
            </h2>
            <p className="text-muted mt-0.5 text-sm">
              Nhớ đúng thì từ lên hộp cao hơn, lâu mới phải ôn lại.
            </p>
            <ul className="mt-4 space-y-2.5">
              {detail.boxes.map((count, index) => {
                const percent = Math.round((count / boxTotal) * 100);
                const last = index === detail.boxes.length - 1;
                return (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <span className="text-muted w-20 shrink-0 tabular-nums">
                      {last ? "Đã thuộc" : `${BOX_INTERVAL_DAYS[index]} ngày`}
                    </span>
                    <span className="bg-brand-soft h-2.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className={`block h-full rounded-full ${last ? "bg-brand" : "bg-brand/50"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right font-semibold tabular-nums">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {detail.decks.length > 0 ? (
          <section aria-labelledby="theo-bo" className="space-y-3">
            <h2 id="theo-bo" className="text-muted px-1 text-sm font-medium">
              Theo bộ thẻ
            </h2>
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {detail.decks.map((deck) => (
                <li
                  key={deck.deckId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {deck.name}
                    </span>
                    <span className="text-muted block text-sm">
                      {deck.wordsSeen}/{deck.wordsTotal} từ đã học ·{" "}
                      {deck.reviews} lượt
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-lg font-bold tabular-nums ${
                      deck.accuracy !== null && deck.accuracy < 60
                        ? "text-red-500"
                        : ""
                    }`}
                  >
                    {deck.accuracy === null ? "—" : `${deck.accuracy}%`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {detail.hardestWords.length > 0 ? (
          <section aria-labelledby="hay-sai" className="space-y-3 pb-4">
            <h2 id="hay-sai" className="text-muted px-1 text-sm font-medium">
              Từ hay sai nhất
            </h2>
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {detail.hardestWords.map((word) => (
                <li
                  key={word.wordId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {word.term}
                      <span className="text-muted font-normal">
                        {" "}
                        · {word.meaning}
                      </span>
                    </span>
                    <span className="text-muted block truncate text-sm">
                      {word.deckName}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-red-500 tabular-nums">
                      sai {word.wrong}/{word.reviews}
                    </span>
                    <span className="text-muted block text-xs">
                      hộp {word.box}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}