"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Lưới cuối cùng khi layout gốc cũng hỏng. Phải tự vẽ <html><body> vì
 * layout không còn. Gửi lỗi lên Sentry rồi cho người dùng thử lại.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f2f8f7",
          color: "#0f172a",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Có lỗi rồi</h1>
          <p style={{ color: "#64748b", marginBottom: 20 }}>
            Mình đã ghi nhận sự cố. Bấm thử lại, nếu vẫn lỗi thì tải lại trang.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#0f9488",
              color: "white",
              border: 0,
              borderRadius: 12,
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
