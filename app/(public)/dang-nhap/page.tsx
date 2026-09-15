import type { Metadata } from "next";
import Link from "next/link";
import { REDIRECT_PARAM } from "@/lib/supabase/proxy";
import { Mascot } from "@/app/_components/mascot";
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
        <Link href="/gioi-thieu" aria-label="Giới thiệu DailyEng">
          <Mascot variant="chao" size={112} priority className="rounded-3xl" />
        </Link>
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
