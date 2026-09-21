import { type FrameArt, shopItem } from "@/lib/shop";
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
 * Có khung thì bọc vòng SVG vẽ theo lib/shop.ts (kiểu Discord: vòng gradient
 * phát sáng + hoạ tiết bám quanh). Ảnh ngoài dùng <img> thường, cỡ cố định.
 */
export function Avatar({ url, name, size, className = "", frame }: Props) {
  const item = shopItem(frame);
  const art = item?.kind === "khung" ? item.frame : undefined;

  const picture = url ? (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên, đã thu nhỏ sẵn
    <img
      src={url}
      alt={`Ảnh đại diện của ${name}`}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${art ? "" : className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <Mascot variant="tot-nghiep" size={size} className={`shrink-0 rounded-full ${art ? "" : className}`} />
  );

  if (!art || !item) return picture;

  // Khung có ảnh vẽ: đè PNG trong suốt lên avatar. Ảnh to hơn avatar sao cho
  // lỗ trống ôm vừa avatar (mép avatar hơi chui dưới vành khung). Khung tràn
  // ra ngoài ô layout như hình trang trí của Discord, không đẩy hàng xóm.
  if (art.hole) {
    const scale = 1 / (art.hole + 0.14);
    const outer = Math.round(size * scale);
    const offset = (size - outer) / 2;
    return (
      <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} data-frame={item.key}>
        <span className="bg-card absolute inset-0 overflow-hidden rounded-full">{picture}</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh trong public/shop */}
        <img
          src={`/shop/${item.key}.webp`}
          alt=""
          aria-hidden
          width={outer}
          height={outer}
          className={`pointer-events-none absolute max-w-none ${art.effect === "spin" ? "avatar-ring-spin" : ""}`}
          style={{ width: outer, height: outer, left: offset, top: offset }}
        />
      </span>
    );
  }

  // Khung rộng hơn ảnh ~30% để hoạ tiết bám ngoài mép ảnh.
  const outer = Math.round(size * 1.3);
  const offset = (outer - size) / 2;
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: outer, height: outer }}
      data-frame={item.key}
    >
      <FrameRing art={art} size={outer} id={`${item.key}-${size}`} />
      <span
        className="bg-card absolute overflow-hidden rounded-full"
        style={{ width: size, height: size, left: offset, top: offset }}
      >
        {picture}
      </span>
      {art.charms && size >= 28 ? <Charms art={art} size={outer} /> : null}
    </span>
  );
}

/** Vòng gradient (+ hiệu ứng) vẽ bằng SVG, phủ đúng kích thước khung. */
function FrameRing({ art, size, id }: { art: FrameArt; size: number; id: string }) {
  const [c1, c2, c3] = art.colors;
  const stroke = Math.max(2.5, size * 0.06);
  const r = 50 - stroke / 2 - 4;
  const spin = art.effect === "spin";
  const flame = art.effect === "flame";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`absolute inset-0 ${spin ? "avatar-ring-spin" : ""}`}
      style={{ filter: `drop-shadow(0 0 ${Math.max(2, size * 0.05)}px ${c2}aa)` }}
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
        {spin ? (
          <linearGradient id={`s-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="20%" stopColor="#facc15" />
            <stop offset="40%" stopColor="#4ade80" />
            <stop offset="60%" stopColor="#22d3ee" />
            <stop offset="80%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        ) : null}
      </defs>
      {/* Vòng nền mờ rộng hơn để có cảm giác toả sáng */}
      <circle cx="50" cy="50" r={r + stroke * 0.9} fill="none" stroke={c2} strokeOpacity="0.22" strokeWidth={stroke * 1.4} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={`url(#${spin ? "s" : "g"}-${id})`}
        strokeWidth={stroke}
        strokeDasharray={flame ? `${stroke * 1.6} ${stroke * 0.5}` : undefined}
        strokeLinecap="round"
        className={flame ? "avatar-ring-flame" : ""}
      />
      {/* Viền trong mảnh sáng để tách ảnh khỏi vòng */}
      <circle cx="50" cy="50" r={r - stroke / 2 - 0.5} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
    </svg>
  );
}

/** Emoji bám quanh vòng theo góc, cỡ tỉ lệ với khung. */
function Charms({ art, size }: { art: FrameArt; size: number }) {
  const radius = size / 2 - size * 0.06;
  return (
    <>
      {art.charms!.map((charm, i) => {
        const rad = ((charm.angle - 90) * Math.PI) / 180;
        const x = size / 2 + radius * Math.cos(rad);
        const y = size / 2 + radius * Math.sin(rad);
        const px = Math.max(10, size * 0.2 * charm.size);
        return (
          <span
            key={i}
            aria-hidden
            className={`pointer-events-none absolute leading-none drop-shadow ${art.effect === "snow" ? "avatar-charm-bob" : ""}`}
            style={{
              left: x,
              top: y,
              fontSize: px,
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {charm.glyph}
          </span>
        );
      })}
    </>
  );
}
