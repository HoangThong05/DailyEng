import { coverClass, type parseCover } from "@/lib/profile";

type Props = {
  info: ReturnType<typeof parseCover>;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Ảnh bìa hồ sơ: ảnh tải lên, hoặc gradient (preset / mua ở cửa hàng). Bìa
 * cửa hàng có emoji hoạ tiết rải mờ để nhận ra ngay dù cùng tông màu.
 */
export function CoverArt({ info, className = "", children }: Props) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${coverClass(info)} ${className}`}>
      {info.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, kích thước đã cố định
        <img src={info.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {info.shop?.decor ? <CoverDecor decor={info.shop.decor} /> : null}
      {children}
    </div>
  );
}

/** Rải emoji hoạ tiết: to ở góc, nhỏ hơn ở giữa, mờ để chữ đè lên vẫn đọc được. */
export function CoverDecor({ decor }: { decor: string }) {
  const glyphs = [...decor];
  const spots = [
    { left: "6%", top: "14%", size: "2.6rem", rotate: -12 },
    { left: "78%", top: "8%", size: "3.2rem", rotate: 10 },
    { left: "48%", top: "46%", size: "1.8rem", rotate: 0 },
    { left: "22%", top: "62%", size: "2.2rem", rotate: 14 },
    { left: "88%", top: "58%", size: "2rem", rotate: -8 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
      {spots.map((spot, i) => (
        <span
          key={i}
          className="absolute leading-none opacity-70 drop-shadow"
          style={{ left: spot.left, top: spot.top, fontSize: spot.size, transform: `rotate(${spot.rotate}deg)` }}
        >
          {glyphs[i % glyphs.length]}
        </span>
      ))}
    </div>
  );
}
