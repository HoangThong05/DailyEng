export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "dailyeng:theme";

/**
 * Màu thanh trạng thái của trình duyệt / app đã cài.
 * Phải khớp với --bg và --dark-bg trong globals.css.
 */
export const THEME_COLORS = {
  light: "#f2f8f7",
  dark: "#08151a",
} as const;

/**
 * Script chạy đồng bộ trong <head>, trước khi trình duyệt vẽ khung hình đầu.
 *
 * Không thể làm việc này bằng useEffect: effect chạy sau khi đã vẽ, người dùng
 * sẽ thấy nháy từ sáng sang tối. Script inline chạy ngay lúc trình duyệt đọc
 * HTML, sớm hơn cả React.
 *
 * Nó quy đổi "system" ra giá trị thật rồi mới đặt, nên data-theme luôn là
 * "light" hoặc "dark" — CSS khỏi phải đoán.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var c=${JSON.stringify(
  THEME_COLORS,
)};var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=(p==="light"||p==="dark")?p:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m)}m.setAttribute("content",c[t])}catch(e){}})()`;

/** Đọc lựa chọn đã lưu. Trả về "system" nếu chưa chọn hoặc không đọc được. */
export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/**
 * Đặt màu thanh trạng thái.
 *
 * Thẻ này do JavaScript quản lý hoàn toàn — không khai trong `viewport` của
 * Next nữa. Lý do: thẻ khai sẵn phải gắn kèm `media="(prefers-color-scheme)"`
 * nên luôn chạy theo hệ điều hành, đè mất lựa chọn thủ công của người dùng.
 */
function applyThemeColor(effective: keyof typeof THEME_COLORS) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", THEME_COLORS[effective]);
}

/** Quy đổi lựa chọn ra giao diện thật rồi gắn lên thẻ <html>. */
export function applyTheme(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  const effective =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;

  document.documentElement.setAttribute("data-theme", effective);
  applyThemeColor(effective);
}