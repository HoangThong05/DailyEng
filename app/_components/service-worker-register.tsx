"use client";

import { useEffect } from "react";
import { warmUpVoices } from "@/lib/speech";

/**
 * Đăng ký service worker để app chạy được offline.
 * Chỉ bật ở production — ở dev, SW cache lại asset sẽ làm hot reload bị lệch,
 * nên ta gỡ hết SW cũ ra cho sạch.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Nạp sẵn danh sách giọng đọc để lần bấm loa đầu tiên đã đúng giọng.
    warmUpVoices();

    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => {
        console.error("Đăng ký service worker thất bại:", err);
      });
  }, []);

  return null;
}
