"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/app/_components/avatar";
import { CoverDecor } from "@/app/_components/cover-art";
import { TitleChip } from "@/app/_components/title-chip";
import type { Wallet } from "@/lib/seeds";
import { FREEZE_MAX, isOnSale, type ItemKind, KIND_LABEL, SHOP_ITEMS, type ShopItem } from "@/lib/shop";
import { buyItem, equipItem } from "./actions";

type Tab = "cua-hang" | "kho-do";
type Filter = "all" | ItemKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "khung", label: "Khung" },
  { key: "bia", label: "Ảnh bìa" },
  { key: "danh-hieu", label: "Danh hiệu" },
  { key: "dong-bang", label: "Tiện ích" },
];

function daysLeft(limitedUntil: string, today: string) {
  const ms = Date.parse(limitedUntil) - Date.parse(today);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Xem trước vật phẩm: khung bọc avatar thật, bìa là dải gradient, danh hiệu là chip. */
function Preview({ item, avatarUrl, name }: { item: ShopItem; avatarUrl: string | null; name: string }) {
  if (item.kind === "khung") {
    return (
      <div className="bg-brand-soft/50 flex h-28 items-center justify-center rounded-2xl">
        <Avatar url={avatarUrl} name={name} size={64} frame={item.key} />
      </div>
    );
  }
  if (item.kind === "bia") {
    return (
      <div className={`relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient}`}>
        {item.decor ? <CoverDecor decor={item.decor} /> : null}
      </div>
    );
  }
  if (item.kind === "danh-hieu") {
    return (
      <div className="bg-brand-soft/50 flex h-28 flex-col items-center justify-center gap-1 rounded-2xl">
        <span className="text-sm font-bold">{name}</span>
        <TitleChip title={item.key} />
      </div>
    );
  }
  return (
    <div className={`flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br text-5xl ${item.gradient}`}>
      {item.decor}
    </div>
  );
}

export function Shop({
  wallet,
  today,
  avatarUrl,
  name,
}: {
  wallet: Wallet;
  today: string;
  avatarUrl: string | null;
  name: string;
}) {
  const [tab, setTab] = useState<Tab>("cua-hang");
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const owned = new Set(wallet.owned);
  const equipped = wallet.equipped;

  const items = SHOP_ITEMS.filter((item) => {
    if (filter !== "all" && item.kind !== filter) return false;
    if (tab === "kho-do") return owned.has(item.key) || (item.kind === "dong-bang" && wallet.freezes > 0);
    return isOnSale(item, today);
  });

  function run(key: string, action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setBusyKey(key);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setNotice(result.ok ? { text: result.message ?? "Xong." } : { text: result.error ?? "Lỗi.", error: true });
      setBusyKey(null);
    });
  }

  function isEquipped(item: ShopItem) {
    if (item.kind === "khung") return equipped.frame === item.key;
    if (item.kind === "bia") return equipped.cover === item.key;
    if (item.kind === "danh-hieu") return equipped.title === item.key;
    return false;
  }

  return (
    <div className="space-y-4">
      {/* Tab + lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="bg-brand-soft flex rounded-xl p-1">
          {(
            [
              ["cua-hang", "Cửa hàng"],
              ["kho-do", `Kho đồ · ${wallet.owned.length + (wallet.freezes > 0 ? 1 : 0)}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
                tab === key ? "bg-card text-fg shadow-sm" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
                filter === f.key ? "border-brand bg-brand text-white" : "border-border bg-card text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {notice ? (
        <p
          role={notice.error ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            notice.error ? "bg-red-500/10 text-red-500" : "bg-brand-soft text-brand"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-muted rounded-2xl border border-dashed p-8 text-center text-sm">
          {tab === "kho-do" ? "Chưa có gì trong kho. Sang tab Cửa hàng chọn thử nhé." : "Không có vật phẩm nào."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const has = owned.has(item.key);
            const busy = busyKey === item.key;
            const on = isEquipped(item);
            const affordable = wallet.balance >= item.price;
            const freezeFull = item.kind === "dong-bang" && wallet.freezes >= FREEZE_MAX;
            return (
              <li key={item.key} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-3">
                <div className="relative">
                  <Preview item={item} avatarUrl={avatarUrl} name={name} />
                  <span className="bg-card/90 text-muted absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                    {KIND_LABEL[item.kind]}
                  </span>
                  {item.limitedUntil ? (
                    <span className="absolute top-2 right-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      Còn {daysLeft(item.limitedUntil, today)} ngày
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-muted mt-0.5 text-xs">{item.description}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold tabular-nums">
                    🌾 {item.price}
                    {item.kind === "dong-bang" ? (
                      <span className="text-muted ml-1 text-xs font-medium">
                        · giữ {wallet.freezes}/{FREEZE_MAX}
                      </span>
                    ) : null}
                  </span>
                  {item.kind === "dong-bang" ? (
                    <button
                      type="button"
                      disabled={busy || !affordable || freezeFull}
                      onClick={() => run(item.key, () => buyItem(item.key))}
                      className="bg-brand min-h-9 rounded-xl px-4 text-sm font-semibold text-white press disabled:opacity-50"
                    >
                      {busy ? "…" : freezeFull ? "Đã đủ" : "Mua"}
                    </button>
                  ) : !has ? (
                    <button
                      type="button"
                      disabled={busy || !affordable}
                      onClick={() => run(item.key, () => buyItem(item.key))}
                      title={affordable ? undefined : `Còn thiếu ${item.price - wallet.balance} Hạt`}
                      className="bg-brand min-h-9 rounded-xl px-4 text-sm font-semibold text-white press disabled:opacity-50"
                    >
                      {busy ? "…" : affordable ? "Mua" : "Thiếu Hạt"}
                    </button>
                  ) : on ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(item.key, () => equipItem(item.kind, null))}
                      className="border-brand text-brand min-h-9 rounded-xl border px-4 text-sm font-semibold press"
                    >
                      {busy ? "…" : "Đang dùng · Tháo"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(item.key, () => equipItem(item.kind, item.key))}
                      className="border-border min-h-9 rounded-xl border px-4 text-sm font-semibold press"
                    >
                      {busy ? "…" : "Dùng"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
