import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/app/_components/page-header";
import { todayInAppZone } from "@/lib/leitner";
import { getWallet } from "@/lib/seeds";
import { SEED_RULES } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";
import { Shop } from "./shop";

export const metadata: Metadata = { title: "Cửa hàng" };

/**
 * Cửa hàng Hạt 🌾: mua khung avatar, ảnh bìa, danh hiệu, đóng băng chuỗi.
 * Kho đồ (đã mua) và trang bị ở cùng trang.
 */
export default async function CuaHangPage() {
  const supabase = await createClient();
  const [wallet, { data: profile }] = await Promise.all([
    getWallet(),
    supabase.from("profiles").select("display_name, avatar_url").maybeSingle(),
  ]);

  return (
    <>
      <PageHeader title="Cửa hàng" subtitle="Đổi Hạt lấy khung, bìa, danh hiệu" mascot="an-mung" />

      <div className="space-y-6 px-5 pt-2 pb-4">
        {/* Ví */}
        <section className="shadow-brand/25 relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/85">Hạt của bạn</p>
              <p className="mt-0.5 text-4xl font-bold tabular-nums">
                🌾 {wallet.balance.toLocaleString("vi-VN")}
              </p>
              <p className="mt-1 text-sm text-white/85">
                ❄️ Đóng băng chuỗi đang giữ: <span className="font-bold">{wallet.freezes}</span>
              </p>
            </div>
            <Link
              href="/phan-thuong#kiem-hat"
              className="shrink-0 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur press"
            >
              Cách kiếm Hạt
            </Link>
          </div>
        </section>

        <Shop
          wallet={wallet}
          today={todayInAppZone()}
          avatarUrl={profile?.avatar_url ?? null}
          name={profile?.display_name ?? "Bạn"}
        />

        <section className="border-border bg-card rounded-2xl border p-4">
          <h2 className="font-semibold">Kiếm Hạt bằng cách</h2>
          <ul className="text-muted mt-2 space-y-1 text-sm">
            {SEED_RULES.map((rule) => (
              <li key={rule.text}>
                {rule.emoji} {rule.text}
              </li>
            ))}
          </ul>
          <p className="text-muted mt-2 text-xs">Hạt được cộng tự động mỗi lần bạn mở app.</p>
        </section>

        {wallet.history.length > 0 ? (
          <section className="border-border bg-card rounded-2xl border p-4">
            {/* Gập lại: sổ Hạt dài hàng chục dòng, xổ hết làm trang loãng. */}
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
                <span className="text-muted transition-transform group-open:rotate-90" aria-hidden>
                  ▸
                </span>
                Gần đây
                <span className="text-muted ml-auto text-sm font-medium">
                  {wallet.history.length} lượt · xem
                </span>
              </summary>
              <ul className="mt-2 space-y-1.5 text-sm">
                {wallet.history.map((row, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-muted min-w-0 truncate">{row.reason}</span>
                    <span
                      className={`shrink-0 font-bold tabular-nums ${row.amount < 0 ? "text-red-500" : "text-emerald-600"}`}
                    >
                      {row.amount > 0 ? "+" : ""}
                      {row.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        ) : null}
      </div>
    </>
  );
}
