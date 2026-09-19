import type { Metadata } from "next";
import { Mascot } from "@/app/_components/mascot";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

/**
 * Tới được sau khi nhập đúng mã khôi phục (lúc đó đã có phiên đăng nhập;
 * người lạ bị middleware chặn). Người đang đăng nhập bình thường cũng dùng
 * được để đổi mật khẩu.
 */
export default function DoiMatKhauPage() {
  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Mascot variant="chao" size={112} priority />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Đặt mật khẩu mới</h1>
        <p className="text-muted mt-2 text-sm">
          Đặt xong là vào học luôn, không cần đăng nhập lại.
        </p>
      </div>

      <PasswordForm />
    </main>
  );
}
