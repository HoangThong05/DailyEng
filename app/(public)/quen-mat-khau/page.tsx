import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";
import { LOGIN_PATH } from "@/lib/supabase/proxy";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function QuenMatKhauPage() {
  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Mascot variant="hoc" size={112} priority />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Quên mật khẩu</h1>
        <p className="text-muted mt-2 text-sm">
          Nhập email đã đăng ký, mình sẽ gửi mã 6 số để bạn đặt mật khẩu mới.
        </p>
      </div>

      <ForgotForm />

      <p className="text-muted mt-8 text-center text-sm">
        Nhớ ra rồi?{" "}
        <Link href={LOGIN_PATH} className="text-brand font-medium">
          Quay lại đăng nhập
        </Link>
      </p>
    </main>
  );
}
