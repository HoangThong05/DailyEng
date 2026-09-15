import type { Metadata } from "next";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AdminTitle, Table, formatDate, td, th } from "../_components/ui";
import { AdminToggle } from "./admin-toggle";

export const metadata: Metadata = { title: "Quản trị · Người dùng" };

export default async function NguoiDungAdminPage() {
  const supabase = await createClient();
  const [me, { data: users }] = await Promise.all([
    getCurrentUser(),
    supabase.rpc("admin_users", { top_n: 200 }),
  ]);
  const list = users ?? [];

  return (
    <>
      <AdminTitle
        title="Người dùng"
        subtitle={`${list.length} tài khoản gần nhất · sắp xếp theo ngày đăng ký`}
      />

      <Table>
        <thead>
          <tr>
            <th className={th}>Người dùng</th>
            <th className={th}>Đăng ký</th>
            <th className={th}>Học gần nhất</th>
            <th className={`${th} text-right`}>Lượt ôn</th>
            <th className={`${th} text-right`}>XP</th>
            <th className={th}>Quyền</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id}>
              <td className={td}>
                <span className="block font-semibold">
                  {u.display_name ?? "—"}
                  {u.hide_rank ? (
                    <span className="text-muted ml-2 text-xs font-normal">(ẩn xếp hạng)</span>
                  ) : null}
                </span>
                <span className="text-muted block text-xs">{u.email}</span>
              </td>
              <td className={`${td} text-muted whitespace-nowrap`}>{formatDate(u.created_at, false)}</td>
              <td className={`${td} text-muted whitespace-nowrap`}>{u.last_day ?? "chưa học"}</td>
              <td className={`${td} text-right tabular-nums`}>{u.reviews.toLocaleString("vi-VN")}</td>
              <td className={`${td} text-right font-semibold tabular-nums`}>{u.xp.toLocaleString("vi-VN")}</td>
              <td className={td}>
                <AdminToggle userId={u.id} isAdmin={u.is_admin} isSelf={u.id === me?.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
