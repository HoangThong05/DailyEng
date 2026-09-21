import { shopItem } from "@/lib/shop";
import { Mascot } from "./mascot";

type Props = {
  url: string | null | undefined;
  name: string;
  size: number;
  className?: string;
  /** Khoá khung đã mua ở cửa hàng (profiles.frame); không có thì ảnh trần. */
  frame?: string | null;
};

/**
 * Ảnh đại diện tròn: ảnh người dùng tải lên, không có thì vịt tốt nghiệp.
 * Có khung thì bọc một vòng gradient (kiểu Discord), khung mùa có emoji góc.
 * Ảnh ngoài (Supabase Storage) nên dùng <img> thường, kích thước cố định.
 */
export function Avatar({ url, name, size, className = "", frame }: Props) {
  const picture = url ? (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, đã thu nhỏ sẵn
    <img
      src={url}
      alt={`Ảnh đại diện của ${name}`}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${frame ? "" : className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <Mascot variant="tot-nghiep" size={size} className={`shrink-0 rounded-full ${frame ? "" : className}`} />
  );

  const item = shopItem(frame);
  if (!item || item.kind !== "khung") return picture;

  // Viền dày theo cỡ ảnh: ~8% nhưng tối thiểu 2px.
  const ring = Math.max(2, Math.round(size * 0.08));
  return (
    <span
      className={`avatar-frame relative inline-flex shrink-0 rounded-full ${className}`}
      style={{ width: size + ring * 2, height: size + ring * 2, padding: ring }}
      data-frame={item.key}
    >
      <span
        aria-hidden
        className={`avatar-ring absolute inset-0 rounded-full bg-gradient-to-br ${item.gradient} ${
          item.animated ? "avatar-ring-spin" : ""
        }`}
      />
      <span className="bg-card relative block overflow-hidden rounded-full" style={{ width: size, height: size }}>
        {picture}
      </span>
      {item.decor && size >= 32 ? (
        <span
          aria-hidden
          className="absolute -right-1 -bottom-1 leading-none drop-shadow"
          style={{ fontSize: Math.max(12, Math.round(size * 0.32)) }}
        >
          {item.decor}
        </span>
      ) : null}
    </span>
  );
}
