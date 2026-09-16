import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";

export const metadata: Metadata = { title: "Không tìm thấy trang" };

/** Trang 404 dùng chung cho cả khu công khai lẫn khu cần đăng nhập. */
export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <Mascot variant="buon" size={140} priority />
      <p className="text-brand mt-4 text-6xl font-extrabold tabular-nums">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Không tìm thấy trang này</h1>
      <p className="text-muted mt-2 max-w-sm text-sm leading-relaxed">
        Đường dẫn có thể đã đổi, hoặc bộ từ bạn tìm không còn nữa. Quay lại học tiếp nhé.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-brand flex min-h-12 items-center rounded-xl px-6 font-semibold text-white press"
        >
          Về trang chủ
        </Link>
        <Link
          href="/hoc"
          className="border-border bg-card flex min-h-12 items-center rounded-xl border px-6 font-semibold press"
        >
          Tới trang Học
        </Link>
      </div>

      <Link href="/gioi-thieu" className="text-muted hover:text-brand mt-6 text-sm font-medium">
        Xem trang giới thiệu →
      </Link>
    </main>
  );
}
