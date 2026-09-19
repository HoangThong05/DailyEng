import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/app/_components/count-up";
import { PageHeader } from "@/app/_components/page-header";
import { BOX_INTERVAL_DAYS } from "@/lib/leitner";
import { getDetailedStats, getStudyStats } from "@/lib/stats";
import { WeekChart } from "../tai-khoan/week-chart";
import { Heatmap } from "./heatmap";

export const metadata: Metadata = { title: "Thống kê" };

function StatTile({
  value,
  suffix,
  label,
}: {
  /** null = chưa có dữ liệu, hiện gạch ngang. */
  value: number | null;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums">
        {value === null ? "—" : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="text-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-muted px-1 text-sm font-medium">
      {children}
    </h2>
  );
}

/** Thống kê chi tiết, tách khỏi Cá nhân để trang đó gọn. */
export default async function TienDoPage() {
  const [{ today, week, totals, history }, detail] = await Promise.all([
    getStudyStats(),
    getDetailedStats(),
  ]);
  const boxTotal = detail.boxes.reduce((sum, count) => sum + count, 0);

  return (
    <>
      <PageHeader title="Thống kê" subtitle="Hôm nay, 7 ngày và từng bộ" mascot="tot-nghiep" />
      <div className="stagger px-5 pt-2 pb-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <section aria-labelledby="hom-nay" className="space-y-3">
              <SectionTitle id="hom-nay">Hôm nay</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatTile value={today.words} label="từ đã ôn" />
                <StatTile value={today.reviews} label="lượt ôn" />
                <StatTile
                  value={
                    today.reviews > 0
                      ? Math.round((today.correct / today.reviews) * 100)
                      : null
                  }
                  suffix="%"
                  label="nhớ được"
                />
              </div>
            </section>

            <section aria-labelledby="tong-ket" className="space-y-3">
              <SectionTitle id="tong-ket">Tổng kết</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatTile value={totals.wordsSeen} label="từ đã học" />
                <StatTile
                  value={totals.wordsMastered}
                  label="từ đã thuộc"
                />
                <StatTile
                  value={totals.accuracy}
                  suffix="%"
                  label="tỉ lệ nhớ"
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

            <section
              aria-labelledby="ban-do"
              className="border-border bg-card rounded-2xl border p-5"
            >
              <h2 id="ban-do" className="mb-1 font-semibold">
                Nửa năm qua
              </h2>
              <p className="text-muted mb-4 text-sm">Mỗi ô một ngày, học càng nhiều càng đậm</p>
              <Heatmap history={history} />
            </section>
          </div>

          <div className="space-y-6">

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
                      <li
                        key={index}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-muted w-20 shrink-0 tabular-nums">
                          {last
                            ? "Đã thuộc"
                            : `${BOX_INTERVAL_DAYS[index]} ngày`}
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
                <SectionTitle id="theo-bo">Theo bộ thẻ</SectionTitle>
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
              <section aria-labelledby="hay-sai" className="space-y-3">
                <div className="flex items-baseline justify-between gap-2 pr-1">
                  <SectionTitle id="hay-sai">Từ hay sai nhất</SectionTitle>
                  <Link href="/tu-kho" className="text-brand shrink-0 text-sm font-semibold">
                    Ôn từ khó →
                  </Link>
                </div>
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
        </div>
      </div>
    </>
  );
}
