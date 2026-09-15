import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, Stat } from "./_components/ui";

export const metadata: Metadata = { title: "Quản trị · Tổng quan" };

export default async function QuanTriPage() {
  const supabase = await createClient();
  const [{ data: overviewRows }, { data: daily }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_signups_daily", { days: 30 }),
  ]);
  const o = overviewRows?.[0];
  const series = daily ?? [];
  const maxActive = Math.max(1, ...series.map((d) => d.active));
  const maxSignup = Math.max(1, ...series.map((d) => d.signups));

  return (
    <>
      <AdminTitle title="Tổng quan" subtitle="Số liệu toàn hệ thống, tính theo giờ Việt Nam." />

      {!o ? (
        <p className="text-muted text-sm">
          Chưa lấy được số liệu — kiểm tra đã chạy <code>schema-12-quan-tri.sql</code> chưa.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={o.users_total} label="người dùng" hint={`+${o.users_new_7d} trong 7 ngày`} />
            <Stat value={o.users_active_7d} label="học trong 7 ngày" hint={`${o.users_active_today} học hôm nay`} />
            <Stat value={o.reviews_total.toLocaleString("vi-VN")} label="lượt ôn tổng" hint={`${o.reviews_7d.toLocaleString("vi-VN")} trong 7 ngày`} />
            <Stat value={o.mock_tests_total} label="lượt mock test" />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/quan-tri/gop-y" className="block">
              <Stat
                value={o.feedback_pending}
                label="góp ý chưa xử lý"
                hint={o.feedback_pending > 0 ? "Bấm để xem" : "Sạch"}
              />
            </Link>
            <Stat value={o.decks_public} label="bộ từ có sẵn" />
            <Stat value={o.words_public.toLocaleString("vi-VN")} label="từ trong kho" />
          </div>

          <section className="border-border bg-card mt-6 rounded-2xl border p-5">
            <h2 className="font-semibold">30 ngày gần nhất</h2>
            <p className="text-muted mt-0.5 text-xs">
              Cột xanh: người học trong ngày · chấm cam: đăng ký mới
            </p>
            <div className="mt-4 flex h-40 items-end gap-1">
              {series.map((d) => (
                <div
                  key={d.day}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  title={`${d.day}: ${d.active} học · ${d.signups} đăng ký`}
                >
                  {d.signups > 0 ? (
                    <span
                      className="mb-0.5 block h-2 w-2 rounded-full bg-orange-500"
                      style={{ opacity: 0.4 + (0.6 * d.signups) / maxSignup }}
                    />
                  ) : null}
                  <div
                    className="bg-brand w-full rounded-t"
                    style={{ height: `${Math.max(2, (d.active / maxActive) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="text-muted mt-2 flex justify-between text-[11px]">
              <span>{series[0]?.day ?? ""}</span>
              <span>{series[series.length - 1]?.day ?? ""}</span>
            </div>
          </section>
        </>
      )}
    </>
  );
}
