"use client";

import { useEffect } from "react";
import { applyTheme, type ThemePreference } from "@/lib/theme";
import { setThemePreference, useThemePreference } from "@/lib/theme-store";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Theo máy" },
];

export function ThemeToggle() {
  const preference = useThemePreference();

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

  return (
    <div role="radiogroup" aria-label="Giao diện" className="pill-tabs w-full">
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setThemePreference(option.value)}
            className="pill-tab flex-1"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
