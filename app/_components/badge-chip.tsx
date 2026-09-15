import type { Badge } from "@/lib/badges";

const TIER_CLASS: Record<Badge["tier"], string> = {
  1: "bg-sky-500/15 ring-sky-400/50",
  2: "bg-violet-500/15 ring-violet-400/60",
  3: "bg-amber-400/20 ring-amber-400/70",
};

/** Huy hiệu tròn nhỏ: emoji trên nền theo độ hiếm; chưa đạt thì xám mờ. */
export function BadgeChip({
  badge,
  earned = true,
  size = 40,
  className = "",
}: {
  badge: Badge;
  earned?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      title={`${badge.title} — ${badge.description}`}
      aria-label={`${badge.title}${earned ? "" : " (chưa đạt)"}`}
      className={`flex shrink-0 items-center justify-center rounded-full ring-2 ${
        earned ? TIER_CLASS[badge.tier] : "bg-border/40 ring-border grayscale opacity-45"
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      <span aria-hidden>{badge.emoji}</span>
    </span>
  );
}
