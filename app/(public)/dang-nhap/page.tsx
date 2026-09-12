import type { Metadata } from "next";
import { REDIRECT_PARAM } from "@/lib/supabase/proxy";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Đăng nhập" };

/** Thông báo ứng với tham số ?loi= mà các luồng đăng nhập đá về đây. */
const ERROR_MESSAGES: Record<string, string | undefined> = {
  "xac-nhan":
    "Link xác nhận không hợp lệ hoặc đã hết hạn. Đăng nhập lại để nhận mã mới.",
  google: "Đăng nhập bằng Google không thành công. Thử lại nhé.",
};

export default async function DangNhapPage({
  searchParams,
}: PageProps<"/dang-nhap">) {
  const params = await searchParams;
  const raw = params[REDIRECT_PARAM];
  const next = typeof raw === "string" ? raw : "/";
  const errorMessage = ERROR_MESSAGES[String(params.loi ?? "")];

  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-[1.125rem] bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-bold text-white"
        >
          D
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">DailyEng</h1>
        <p className="text-muted mt-1 text-sm">
          Đăng nhập để tiến độ học được lưu lại
        </p>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500"
        >
          {errorMessage}
        </p>
      ) : null}

      <AuthForm next={next} />
    </main>
  );
}
