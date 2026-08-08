"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Theo máy" },
];

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

function getServerSnapshot(): ThemePreference {
  return "system";
}

export function ThemeToggle() {
  /*
   * Server không đọc được localStorage nên render "system", client đọc ra giá
   * trị thật. useSyncExternalStore là cách chính thống để hai bên khác nhau mà
   * React không báo lệch hydrate.
   */
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    getServerSnapshot,
  );

  useEffect(() => {
    // Ở dev, StrictMode remount xoá mất attribute do script inline đặt.
    // Gắn lại cho chắc; ở production đây là lệnh thừa vô hại.
    applyTheme(preference);

    if (preference !== "system") return;

    // Chọn "Theo máy" thì đổi theo ngay khi người dùng đổi cài đặt hệ điều hành.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  function choose(next: ThemePreference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Chế độ riêng tư có thể chặn ghi. Vẫn đổi giao diện cho phiên này.
    }
    applyTheme(next);
    emit();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Giao diện"
      className="bg-brand-soft flex rounded-xl p-1"
    >
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(option.value)}
            className={`min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors ${
              active ? "bg-card text-fg shadow-sm" : "text-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}