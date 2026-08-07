import type { Metadata } from "next";
import { signOut } from "@/app/_actions/auth";
import { FlameIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getStudyStats } from "@/lib/stats";
import { getCurrentUser } from "@/lib/supabase/server";
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
  const [user, stats] = await Promise.all([getCurrentUser(), getStudyStats()]);
  const { streak, today, week, totals } = stats;

  return (
    <>
      <PageHeader title="Tiến độ" subtitle="Thống kê học tập" />

      <div className="space-y-6 px-5 pt-2">
        <section
          aria-labelledby="chuoi-ngay"
          className="border-border bg-card flex items-center gap-4 rounded-2xl border p-5"
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
            <StatTile value={String(today.reviews)} label="lượt trả lời" />
            <StatTile
              value={
                today.reviews > 0
                  ? `${Math.round((today.correct / today.reviews) * 100)}%`
                  : "—"
              }
              label="đúng"
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
              label="đúng trung bình"
            />
          </div>
          <p className="text-muted px-1 text-xs">
            &quot;Đã thuộc&quot; là những từ đã lên hộp 5 — hộp cao nhất, ôn lại
            sau mỗi 14 ngày.
          </p>
        </section>

        <section aria-labelledby="tai-khoan" className="pb-2">
          <div className="border-border bg-card rounded-2xl border p-4">
            <h2 id="tai-khoan" className="text-muted text-xs font-medium">
              Đang đăng nhập
            </h2>
            <p className="mt-1 truncate font-medium">{user?.email ?? "—"}</p>

            <form action={signOut}>
              <button
                type="submit"
                className="border-border mt-4 min-h-11 w-full rounded-xl border text-sm font-semibold text-red-500 transition-transform duration-100 active:scale-[0.98]"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}