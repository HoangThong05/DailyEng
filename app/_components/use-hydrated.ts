"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Trả về false khi render trên server, true sau khi hydrate xong ở client.
 *
 * Dùng để hoãn những thứ chỉ biết được ở trình duyệt (đã cài app chưa, có hỗ
 * trợ micro không) mà không gây lệch nội dung giữa server và client.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}