import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/app/_components/mascot";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

/**
 * Tới được sau khi nhập đúng mã khôi phục (lúc đó đã có phiên đăng nhập;
 * người lạ bị middleware chặn). Từ tab Cá nhân vào (?ve=tai-khoan) thì là
 * đổi mật khẩu bình thường, xong quay về đó.
 */
export default async function DoiMatKhauPage({
  searchParams,
}: PageProps<"/doi-mat-khau">) {
  const params = await searchParams;
  const fromAccount = params.ve === "tai-khoan";
  const next = fromAccount ? "/tai-khoan" : "/";

  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Mascot variant="chao" size={112} priority />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {fromAccount ? "Đổi mật khẩu" : "Đặt mật khẩu mới"}
        </h1>
        <p className="text-muted mt-2 text-sm">
          {fromAccount
            ? "Mật khẩu mới dùng cho lần đăng nhập sau."
            : "Đặt xong là vào học luôn, không cần đăng nhập lại."}
        </p>
      </div>

      <PasswordForm next={next} />

      {fromAccount ? (
        <p className="text-muted mt-8 text-center text-sm">
          <Link href="/tai-khoan" className="text-brand font-medium">
            Quay lại Cá nhân
          </Link>
        </p>
      ) : null}
    </main>
  );
}
