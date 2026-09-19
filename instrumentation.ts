import * as Sentry from "@sentry/nextjs";

/** Next gọi khi server khởi động; nạp cấu hình Sentry đúng runtime. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Lỗi trong lúc render / server action / route handler. */
export const onRequestError = Sentry.captureRequestError;
