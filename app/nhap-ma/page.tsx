import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/supabase/proxy";
import { CodeForm } from "./code-form";

export const metadata: Metadata = { title: "Nhập mã xác nhận" };

export default async function NhapMaPage({
  searchParams,
}: PageProps<"/nhap-ma">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.trim() : "";

  // Vào thẳng đường dẫn này mà không kèm email thì chẳng xác nhận cho ai được.
  if (!email) redirect(LOGIN_PATH);

  return (
    <main className="pt-safe pb-safe flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span
          aria-hidden
          className="bg-brand-soft text-brand mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        >
          ✉️
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Nhập mã xác nhận
        </h1>
        <p className="text-muted mt-2 text-sm">
          Mình vừa gửi mã 6 số tới
          <br />
          <span className="text-fg font-medium break-all">{email}</span>
        </p>
      </div>

      <CodeForm email={email} />

      <p className="text-muted mt-8 text-center text-sm">
        Sai email?{" "}
        <Link href={LOGIN_PATH} className="text-brand font-medium">
          Quay lại đăng ký
        </Link>
      </p>
    </main>
  );
}