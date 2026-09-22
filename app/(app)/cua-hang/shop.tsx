"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/app/_components/avatar";
import { SceneArt } from "@/app/_components/cover-art";
import { ScrollRow } from "@/app/_components/scroll-row";
import { TitleChip } from "@/app/_components/title-chip";
import type { Wallet } from "@/lib/seeds";
import {
  COLLECTIONS,
  FREEZE_MAX,
  isOnSale,
  type ItemKind,
  KIND_LABEL,
  SHOP_ITEMS,
  type ShopItem,
} from "@/lib/shop";
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

function daysLeft(until: string, today: string) {
  return Math.max(0, Math.round((Date.parse(until) - Date.parse(today)) / 86_400_000));
}

/**
 * Xem trước như thật: một thẻ hồ sơ thu nhỏ (bìa + avatar + tên + danh
 * hiệu) với vật phẩm đang xem áp lên. Người mua thấy ngay nó lên hồ sơ mình
 * ra sao, không phải đoán.
 */
function ProfilePreview({
  item,
  avatarUrl,
  name,
  equipped,
}: {
  item: ShopItem;
  avatarUrl: string | null;
  name: string;
  equipped: Wallet["equipped"];
}) {
  const frame = item.kind === "khung" ? item.key : equipped.frame;
  const title = item.kind === "danh-hieu" ? item.key : equipped.title;
  const coverItem = item.kind === "bia" ? item : SHOP_ITEMS.find((i) => i.key === equipped.cover);
  return (
    <div className="relative h-40 overflow-hidden rounded-2xl bg-slate-900">
      <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden">
        {coverItem?.art ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh trong public/shop
          <img src={`/shop/${coverItem.key}.webp`} alt="" className="h-full w-full object-cover" />
        ) : coverItem?.scene ? (
          <SceneArt scene={coverItem.scene} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-teal-500 to-emerald-700" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-slate-900/95" />
      <div className="absolute bottom-3 left-4 flex items-end gap-3">
        <Avatar url={avatarUrl} name={name} size={52} frame={frame} className="drop-shadow-lg" />
        <div className="pb-1">
          <p className="text-sm font-bold text-white drop-shadow">{name}</p>
          <TitleChip title={title} className="mt-0.5" />
          <p className="mt-1 h-1.5 w-24 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

function FreezePreview({ item }: { item: ShopItem }) {
  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
      <SceneArt scene={{ sky: "linear-gradient(180deg,#0c4a6e,#082f49)", stars: 30, snow: true }} />
      <span className="relative text-6xl drop-shadow-[0_0_24px_rgba(125,211,252,.9)]">{item.decor}</span>
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
  const [collection, setCollection] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const owned = new Set(wallet.owned);
  const equipped = wallet.equipped;
  const live = COLLECTIONS.filter((c) => today <= c.until);

  const items = SHOP_ITEMS.filter((item) => {
    if (filter !== "all" && item.kind !== filter) return false;
    if (collection && item.collection !== collection) return false;
    if (tab === "kho-do") return owned.has(item.key) || (item.kind === "dong-bang" && wallet.freezes > 0);
    return isOnSale(item, today);
  }).sort((a, b) => Number(Boolean(b.limitedUntil)) - Number(Boolean(a.limitedUntil)));

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
    <div className="space-y-5">
      {/* Banner bộ sưu tập mùa đang mở */}
      {tab === "cua-hang" && live.length > 0 ? (
        <ScrollRow label="bộ sưu tập" className="pb-1">
          {live.map((c) => {
            const active = collection === c.key;
            const count = SHOP_ITEMS.filter((i) => i.collection === c.key).length;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={active}
                onClick={() => setCollection(active ? null : c.key)}
                className={`group relative h-44 w-[min(100%,30rem)] shrink-0 snap-start overflow-hidden rounded-3xl text-left text-white shadow-lg transition-transform hover:-translate-y-0.5 ${
                  active ? "ring-brand ring-4" : ""
                }`}
              >
                {c.art ? (
                  // eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh trong public/shop
                  <img src={`/shop/${c.art}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <SceneArt scene={c.scene} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-3 left-4 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur">
                  Còn {daysLeft(c.until, today)} ngày · {count} món
                </div>
                <div className="absolute right-4 bottom-3 left-4">
                  <p className="text-xl font-extrabold tracking-tight drop-shadow">{c.name}</p>
                  <p className="text-xs text-white/85">{c.tagline}</p>
                </div>
                <span className="absolute right-4 bottom-3 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow">
                  {active ? "Xem tất cả" : "Xem bộ →"}
                </span>
              </button>
            );
          })}
        </ScrollRow>
      ) : null}

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
              onClick={() => {
                setTab(key);
                setCollection(null);
              }}
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
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const has = owned.has(item.key);
            const busy = busyKey === item.key;
            const on = isEquipped(item);
            const affordable = wallet.balance >= item.price;
            const freezeFull = item.kind === "dong-bang" && wallet.freezes >= FREEZE_MAX;
            return (
              <li
                key={item.key}
                className="border-border bg-card group flex flex-col gap-3 rounded-3xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative">
                  {item.kind === "dong-bang" ? (
                    <FreezePreview item={item} />
                  ) : (
                    <ProfilePreview item={item} avatarUrl={avatarUrl} name={name} equipped={equipped} />
                  )}
                  <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur">
                    {KIND_LABEL[item.kind]}
                  </span>
                  {item.limitedUntil ? (
                    <span className="absolute top-2 right-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Giới hạn · {daysLeft(item.limitedUntil, today)} ngày
                    </span>
                  ) : null}
                  {on ? (
                    <span className="bg-brand absolute right-2 bottom-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      Đang dùng
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 px-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-muted mt-0.5 text-xs leading-relaxed">{item.description}</p>
                </div>
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <span className="font-bold tabular-nums">
                    🌾 {item.price.toLocaleString("vi-VN")}
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
                      {busy ? "…" : affordable ? "Mua" : `Thiếu ${(item.price - wallet.balance).toLocaleString("vi-VN")}`}
                    </button>
                  ) : on ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(item.key, () => equipItem(item.kind, null))}
                      className="border-brand text-brand min-h-9 rounded-xl border px-4 text-sm font-semibold press"
                    >
                      {busy ? "…" : "Tháo"}
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
