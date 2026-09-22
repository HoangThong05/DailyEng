import { addDays, todayInAppZone } from "@/lib/leitner";

/**
 * Quy định mùa giải tuần, không chạm database nên client component dùng được.
 * Phần truy vấn nằm ở lib/season.ts (chỉ chạy ở server).
 */

/** Hạt thưởng theo hạng — phải khớp hàm season_prize trong schema-25. */
export const SEASON_PRIZES: { rank: string; seeds: number; extra?: string }[] = [
  { rank: "1", seeds: 300, extra: "Danh hiệu Quán quân (×3 và ×10 lên bậc)" },
  { rank: "2", seeds: 200 },
  { rank: "3", seeds: 150 },
  { rank: "4–10", seeds: 50 },
];

export function seasonPrize(rank: number) {
  if (rank === 1) return 300;
  if (rank === 2) return 200;
  if (rank === 3) return 150;
  if (rank <= 10) return 50;
  return 0;
}

/** Thứ Hai của tuần chứa `day` (YYYY-MM-DD, giờ VN). */
export function weekStart(day = todayInAppZone()) {
  const [y, m, d] = day.split("-").map(Number);
  const isoDow = ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1; // 1 = T2
  return addDays(day, -(isoDow - 1));
}

/** Mốc đóng mùa: 24:00 Chủ nhật giờ VN, dạng ISO để client đếm ngược. */
export function seasonEndsAt(monday: string) {
  return `${addDays(monday, 7)}T00:00:00+07:00`;
}

export function weekLabel(monday: string) {
  const fmt = (day: string) => {
    const [, m, d] = day.split("-");
    return `${Number(d)}/${Number(m)}`;
  };
  return `${fmt(monday)} – ${fmt(addDays(monday, 6))}`;
}
