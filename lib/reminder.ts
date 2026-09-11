/**
 * Hằng số về giờ nhắc, tách riêng để client component import được
 * mà không kéo theo thư viện web-push (chỉ chạy được ở Node).
 */

/** Các mốc giờ (giờ VN) cho người dùng chọn. Cột reminder_hour nhận 0–23. */
export const REMINDER_HOURS = [7, 12, 20] as const;

export const DEFAULT_REMINDER_HOUR = 20;

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}
