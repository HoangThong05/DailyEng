import { shopItem } from "@/lib/shop";

/**
 * Danh hiệu mua ở cửa hàng, hiện dưới tên. Không phải nhãn phẳng: nền
 * gradient, vệt sáng quét qua, viền phát sáng và hạt lấp lánh tuỳ hạng —
 * để 1.000–3.000 Hạt bỏ ra thấy đáng.
 */
export function TitleChip({ title, className = "" }: { title: string | null | undefined; className?: string }) {
  const item = shopItem(title);
  if (!item || item.kind !== "danh-hieu") return null;

  const art = item.title;
  const gradient = art?.gradient ?? item.gradient;
  const effects = art?.effects ?? [];
  const glow = art?.glow ?? "#ffffff";

  return (
    <span
      className={`title-chip relative inline-flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold text-white ${gradient} ${
        art?.ring ?? ""
      } ${effects.includes("pulse") ? "title-chip-pulse" : ""} ${className}`}
      style={{ ["--title-glow" as string]: glow }}
    >
      {/* Vệt sáng quét từ trái sang, như kim loại bắt đèn */}
      {effects.includes("shine") ? <span aria-hidden className="title-chip-shine" /> : null}
      {/* Hạt lấp lánh bay quanh chữ */}
      {effects.includes("sparkle")
        ? [0, 1, 2].map((i) => (
            <span key={i} aria-hidden className="title-chip-spark" data-i={i} />
          ))
        : null}
      {item.decor ? (
        <span aria-hidden className="relative drop-shadow">
          {item.decor}
        </span>
      ) : null}
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]">{item.name}</span>
    </span>
  );
}
