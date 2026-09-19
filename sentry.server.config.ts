import * as Sentry from "@sentry/nextjs";

/**
 * Báo lỗi phía server (route handler, server action, render) lên Sentry.
 * Không có DSN thì init với dsn rỗng = tắt, app chạy như thường.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Chỉ cần lỗi; không theo dõi hiệu năng để khỏi tốn hạn mức miễn phí.
  tracesSampleRate: 0,
  sendDefaultPii: false,
});
