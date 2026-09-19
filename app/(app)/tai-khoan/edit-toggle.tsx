"use client";

/**
 * Nút mở/đóng khung chỉnh sửa hồ sơ (một <details id="chinh-sua"> không có
 * tiêu đề riêng). Mở thì cuộn tới cho thấy form.
 */
export function EditToggle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const el = document.getElementById("chinh-sua");
        if (!(el instanceof HTMLDetailsElement)) return;
        el.open = !el.open;
        if (el.open) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </button>
  );
}
