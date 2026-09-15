/** Vài khối dùng chung cho khu quản trị: tiêu đề trang, ô số liệu, bảng. */

export function AdminTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-muted mt-1 text-sm">{subtitle}</p> : null}
    </div>
  );
}

export function Stat({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-muted mt-0.5 text-sm">{label}</p>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export const th = "text-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase";
export const td = "border-border border-t px-4 py-3 align-middle";

export function formatDate(iso: string | null, withTime = true) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}
