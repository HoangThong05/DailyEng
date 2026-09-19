import * as Sentry from "@sentry/nextjs";

/**
 * Báo lỗi phía trình duyệt lên Sentry. Không có DSN (chạy local, chưa cấu
 * hình) thì tắt hẳn, không gửi gì.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
  // Lỗi do tiện ích trình duyệt / mạng chập chờn, không phải của app.
  ignoreErrors: [
    "ResizeObserver loop",
    "Load failed",
    "Failed to fetch",
    "NetworkError",
    "AbortError",
    /extension/i,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
