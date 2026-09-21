import { shopItem } from "@/lib/shop";

/** Danh hiệu mua ở cửa hàng, hiện dưới tên. Không có (hoặc khoá lạ) thì không vẽ gì. */
export function TitleChip({ title, className = "" }: { title: string | null | undefined; className?: string }) {
  const item = shopItem(title);
  if (!item || item.kind !== "danh-hieu") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[11px] font-bold text-white shadow-sm ${item.gradient} ${className}`}
    >
      {item.decor ? <span aria-hidden>{item.decor}</span> : null}
      {item.name}
    </span>
  );
}
