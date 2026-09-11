/**
 * Hằng số về giờ nhắc, tách riêng để client component import được
 * mà không kéo theo thư viện web-push (chỉ chạy được ở Node).
 */

/** Giờ nhắc theo giờ VN. Đổi thì sửa cả lịch cron trong vercel.json. */
export const REMINDER_HOUR_LABEL = "20:00";
