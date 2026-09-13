"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

/*
 * Kho trạng thái giao diện dùng chung cho nút bật/tắt ở header và bộ chọn
 * ba mức ở trang Cá nhân: đổi ở chỗ này thì chỗ kia cập nhật theo ngay.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Đổi giao diện ở tab khác thì tab này cũng phải cập nhật theo.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

/** Giao diện đang hiển thị thật sự, đọc từ thẻ <html> do script khởi tạo đặt. */
function readEffectiveTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function setThemePreference(next: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Chế độ riêng tư có thể chặn ghi. Vẫn đổi giao diện cho phiên này.
  }
  applyTheme(next);
  emit();
}

/*
 * Server không đọc được localStorage nên render giá trị mặc định, client đọc
 * ra giá trị thật. useSyncExternalStore là cách chính thống để hai bên khác
 * nhau mà React không báo lệch hydrate.
 */
export function useThemePreference() {
  return useSyncExternalStore<ThemePreference>(
    subscribe,
    readThemePreference,
    () => "system",
  );
}

export function useEffectiveTheme() {
  return useSyncExternalStore<"light" | "dark">(
    subscribe,
    readEffectiveTheme,
    () => "light",
  );
}
