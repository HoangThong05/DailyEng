import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import { getMockHistory, MOCK_SECONDS, MOCK_SIZE } from "@/lib/mock-test";

export const metadata: Metadata = { title: "Mock test TOEIC Part 5" };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function MockTestPage() {
  const { recent, best, attempts } = await getMockHistory();

  return (
    <>
      <PageHeader
        title="Mock test Part 5"
        subtitle="Điền vào chỗ trống như đề thật"
        mascot="tot-nghiep"
      />

      <div className="space-y-5 px-5 pt-2 pb-4">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="tot-nghiep" size={88} className="shrink-0 rounded-2xl" />
          <div className="text-sm leading-relaxed">
            <p>
              <span className="font-semibold">{MOCK_SIZE} câu</span> ·{" "}
              <span className="font-semibold">{MOCK_SECONDS / 60} phút</span>
            </p>
            <p className="text-muted mt-1">
              Nửa đề là ngữ pháp và từ vựng chọn lọc, nửa còn lại sinh từ các bộ
              TOEIC của app. Nộp bài là có điểm và giải thích từng câu.
            </p>
          </div>
        </div>

        <Link
          href="/tro-choi/mock-test/lam"
          className="bg-brand flex min-h-14 items-center justify-center rounded-2xl text-lg font-bold text-white press"
        >
          Bắt đầu làm bài
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="border-border bg-card rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {best ? `${best.score}/${best.total}` : "—"}
            </p>
            <p className="text-muted text-xs">điểm cao nhất</p>
          </div>
          <div className="border-border bg-card rounded-2xl border p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{attempts}</p>
            <p className="text-muted text-xs">lần đã làm</p>
          </div>
        </div>

        {recent.length > 0 ? (
          <section aria-labelledby="lich-su" className="space-y-3">
            <h2 id="lich-su" className="text-muted px-1 text-sm font-medium">
              Gần đây
            </h2>
            <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
              {recent.map((row) => (
                <li
                  key={row.createdAt}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-muted">{formatDate(row.createdAt)}</span>
                  <span className="text-muted tabular-nums">
                    {formatSeconds(row.seconds)}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      row.score / row.total >= 0.7 ? "text-emerald-500" : ""
                    }`}
                  >
                    {row.score}/{row.total}
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
