import type { Metadata } from "next";
import Link from "next/link";
import { Mascot, type MascotVariant } from "@/app/_components/mascot";
import { PageHeader } from "@/app/_components/page-header";
import {
  getMockHistory,
  MOCK_SECONDS,
  MOCK_SIZE,
  type MockKind,
  PART2_SECONDS,
  PART2_SIZE,
} from "@/lib/mock-test";

export const metadata: Metadata = { title: "Mock test TOEIC" };

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

const TESTS: {
  kind: MockKind;
  title: string;
  tag: string;
  href: string;
  size: number;
  seconds: number;
  description: string;
  mascot: MascotVariant;
  button: string;
}[] = [
  {
    kind: "toeic-part2",
    title: "Part 2 — Hỏi & đáp",
    tag: "Nghe",
    href: "/ky-nang/mock-test/part2",
    size: PART2_SIZE,
    seconds: PART2_SECONDS,
    description:
      "Nghe một câu hỏi và ba câu đáp A, B, C — không có chữ trên màn hình. Chọn câu đáp lại hợp nhất; nộp bài mới thấy lời thoại và giải thích.",
    mascot: "nghe",
    button: "bg-violet-600 hover:bg-violet-500",
  },
  {
    kind: "toeic-part5",
    title: "Part 5 — Điền vào chỗ trống",
    tag: "Đọc",
    href: "/ky-nang/mock-test/lam",
    size: MOCK_SIZE,
    seconds: MOCK_SECONDS,
    description:
      "Nửa đề là ngữ pháp và từ vựng chọn lọc, nửa còn lại sinh từ các bộ TOEIC của app. Nộp bài là có điểm và giải thích từng câu.",
    mascot: "tot-nghiep",
    button: "bg-brand hover:bg-blue-500",
  },
];

export default async function MockTestPage() {
  const histories = await Promise.all(TESTS.map((test) => getMockHistory(test.kind, 5)));

  return (
    <>
      <PageHeader title="Mock test TOEIC" subtitle="Làm thử từng part như đề thật" mascot="tot-nghiep" />

      <div className="stagger grid gap-5 px-5 pt-2 pb-4 lg:grid-cols-2 lg:items-start">
        {TESTS.map((test, i) => {
          const { recent, best, attempts } = histories[i];
          return (
            <section
              key={test.kind}
              aria-labelledby={test.kind}
              className="border-border bg-card space-y-4 rounded-3xl border p-4"
            >
              <div className="flex items-center gap-4">
                <Mascot variant={test.mascot} size={80} className="shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-[11px] font-bold uppercase">
                    {test.tag}
                  </span>
                  <h2 id={test.kind} className="mt-1 font-bold">
                    {test.title}
                  </h2>
                  <p className="text-muted text-sm">
                    {test.size} câu · {test.seconds / 60} phút
                  </p>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed">{test.description}</p>

              <Link
                href={test.href}
                className={`flex min-h-12 items-center justify-center rounded-2xl font-bold text-white press ${test.button}`}
              >
                Bắt đầu làm bài
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-soft/50 rounded-2xl p-3 text-center">
                  <p className="text-xl font-bold tabular-nums">
                    {best ? `${best.score}/${best.total}` : "—"}
                  </p>
                  <p className="text-muted text-xs">điểm cao nhất</p>
                </div>
                <div className="bg-brand-soft/50 rounded-2xl p-3 text-center">
                  <p className="text-xl font-bold tabular-nums">{attempts}</p>
                  <p className="text-muted text-xs">lần đã làm</p>
                </div>
              </div>

              {recent.length > 0 ? (
                <ul className="divide-border border-border divide-y rounded-2xl border">
                  {recent.map((row) => (
                    <li key={row.createdAt} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted">{formatDate(row.createdAt)}</span>
                      <span className="text-muted tabular-nums">{formatSeconds(row.seconds)}</span>
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
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
