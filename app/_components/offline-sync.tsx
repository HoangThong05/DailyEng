"use client";

import { useEffect } from "react";
import { syncOfflineReviews } from "@/app/_actions/study";
import { clearQueue, packIsStale, readQueue, writePack } from "@/lib/offline-store";

/**
 * Chạy ngầm trong app khi có mạng:
 *  1. đẩy kết quả ôn offline (nếu có) lên server;
 *  2. tải gói từ mới nếu gói cũ quá 6 giờ;
 *  3. nhờ service worker cache lại trang /offline cùng JS của nó, để mất mạng
 *     vẫn mở được màn ôn.
 */
export function OfflineSync() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!navigator.onLine) return;

      const queue = readQueue();
      if (queue.length > 0) {
        try {
          const result = await syncOfflineReviews(queue.map(({ wordId, rating }) => ({ wordId, rating })));
          if (result.ok) clearQueue();
        } catch {
          // Mạng chập chờn: để lần sau.
        }
      }

      if (packIsStale()) {
        try {
          const res = await fetch("/api/offline-pack");
          if (res.ok) {
            const data = (await res.json()) as { words?: unknown };
            if (!cancelled && Array.isArray(data.words)) writePack(data.words);
          }
        } catch {
          // như trên
        }
      }

      navigator.serviceWorker?.controller?.postMessage({ type: "cache-offline" });
    }

    void run();
    window.addEventListener("online", run);
    return () => {
      cancelled = true;
      window.removeEventListener("online", run);
    };
  }, []);

  return null;
}
