"use client";

import { setThemePreference, useEffectiveTheme } from "@/lib/theme-store";
import { MoonIcon, SunIcon } from "./icons";

/** Nút tròn bật/tắt sáng–tối ở header, giống công tắc của các app học. */
export function ThemeButton({ className = "" }: { className?: string }) {
  const theme = useEffectiveTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
      onClick={() => setThemePreference(dark ? "light" : "dark")}
      className={`border-border bg-card text-muted hover:text-brand hover:border-brand/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm press ${className}`}
    >
      {/* key đổi → icon xoay vào một cái */}
      <span key={theme} className="theme-swap flex">
        {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </span>
    </button>
  );
}
