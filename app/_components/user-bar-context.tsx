"use client";

import { createContext, use, useContext } from "react";
import type { AppShellData } from "@/lib/app-shell";

/**
 * Layout app tạo một promise dữ liệu khung (chưa await) và đưa xuống đây.
 * Mảnh nào cần thì gọi `useAppShell()` bên trong một <Suspense> — React treo
 * đúng mảnh đó cho tới khi dữ liệu về, phần còn lại của trang vẽ ngay.
 */
const AppShellContext = createContext<Promise<AppShellData> | null>(null);

export function AppShellProvider({
  promise,
  children,
}: {
  promise: Promise<AppShellData>;
  children: React.ReactNode;
}) {
  return <AppShellContext.Provider value={promise}>{children}</AppShellContext.Provider>;
}

/** Promise thô; null khi ở ngoài app (trang giới thiệu). */
export function useAppShellPromise() {
  return useContext(AppShellContext);
}

/** Dữ liệu khung app; phải gọi trong Suspense. Null khi ở ngoài app. */
export function useAppShell(): AppShellData | null {
  const promise = useContext(AppShellContext);
  // `use` được phép gọi có điều kiện, khác các hook thường.
  return promise ? use(promise) : null;
}
