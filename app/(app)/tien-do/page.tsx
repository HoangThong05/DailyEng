import type { Metadata } from "next";
import { signOut } from "@/app/_actions/auth";
import { EmptyState } from "@/app/_components/empty-state";
import { ChartIcon } from "@/app/_components/icons";
import { PageHeader } from "@/app/_components/page-header";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tiến độ" };

export default async function TienDoPage() {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader title="Tiến độ" subtitle="Thống kê học tập" />

      <EmptyState
        icon={<ChartIcon className="h-8 w-8" />}
        title="Chưa có dữ liệu"
        description="Bắt đầu học vài từ, biểu đồ chuỗi ngày và số từ thuộc sẽ hiện ở đây."
      />

      <section aria-labelledby="tai-khoan" className="px-5 pb-6">
        <div className="border-border bg-card rounded-2xl border p-4">
          <h2 id="tai-khoan" className="text-muted text-xs font-medium">
            Đang đăng nhập
          </h2>
          <p className="mt-1 truncate font-medium">{user?.email ?? "—"}</p>

          <form action={signOut}>
            <button
              type="submit"
              className="border-border mt-4 min-h-11 w-full rounded-xl border text-sm font-semibold text-red-500 transition-transform duration-100 active:scale-[0.98]"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </section>
    </>
  );
}