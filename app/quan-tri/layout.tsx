import { notFound } from "next/navigation";
import { signOut } from "@/app/_actions/auth";
import { Mascot } from "@/app/_components/mascot";
import { ThemeButton } from "@/app/_components/theme-button";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./_components/admin-nav";

/**
 * Khu quản trị: khung riêng, không dùng tab bar của người học.
 * Chỉ admin (cờ is_admin, đặt bằng SQL) vào được; người khác thấy 404 để
 * không lộ là có trang này.
 */
export default async function QuanTriLayout({ children }: LayoutProps<"/quan-tri">) {
  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  // Hàm chưa có (chưa chạy schema-11) thì nói rõ, đừng 404 câm — chỉ admin
  // thật mới lần tới đây được nên không lộ gì thêm.
  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-lg font-bold">Khu quản trị chưa sẵn sàng</p>
        <p className="text-muted mt-2 text-sm">
          Supabase báo: <code>{error.message}</code>. Chạy{" "}
          <code>schema-11-admin.sql</code> và <code>schema-12-quan-tri.sql</code>{" "}
          trong SQL Editor rồi tải lại.
        </p>
      </div>
    );
  }
  if (!isAdmin) notFound();

  const { data: overview } = await supabase.rpc("admin_overview");
  const pending = overview?.[0]?.feedback_pending ?? 0;

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <aside className="border-border bg-card/70 flex shrink-0 flex-col border-b backdrop-blur-xl md:sticky md:top-0 md:h-[100dvh] md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Mascot variant="tot-nghiep" size={36} className="rounded-xl" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold">DailyEng</p>
            <p className="text-muted text-xs">Khu quản trị</p>
          </div>
        </div>
        <AdminNav pending={pending} />
        <div className="text-muted mt-auto flex items-center justify-between gap-2 px-5 py-4 text-xs">
          <form action={signOut}>
            <button type="submit" className="hover:text-fg font-semibold text-red-500">
              Đăng xuất
            </button>
          </form>
          <ThemeButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
