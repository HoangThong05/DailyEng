import type { Metadata } from "next";
import { categoryOf } from "@/lib/deck-categories";
import type { DeckCategory } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, Stat, Table, td, th } from "../_components/ui";

export const metadata: Metadata = { title: "Quản trị · Nội dung" };

export default async function NoiDungAdminPage() {
  const supabase = await createClient();
  const { data: decks } = await supabase.rpc("admin_decks");
  const list = decks ?? [];
  const words = list.reduce((sum, d) => sum + d.words, 0);
  const empty = list.filter((d) => d.words === 0);

  return (
    <>
      <AdminTitle
        title="Nội dung"
        subtitle="Bộ từ có sẵn và mức sử dụng. Thêm/sửa nội dung qua scripts/generated + seed SQL."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={list.length} label="bộ từ công khai" />
        <Stat value={words.toLocaleString("vi-VN")} label="từ" />
        <Stat
          value={empty.length}
          label="bộ chưa có từ"
          hint={empty.length > 0 ? "Chưa chạy seed cho nhóm đó" : "Đủ cả"}
        />
      </div>

      <div className="mt-6">
        <Table>
          <thead>
            <tr>
              <th className={th}>Bộ</th>
              <th className={th}>Nhóm</th>
              <th className={`${th} text-right`}>Từ</th>
              <th className={`${th} text-right`}>Người đã học</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const category = categoryOf(d.category as DeckCategory);
              return (
                <tr key={d.id}>
                  <td className={td}>
                    <span className="block font-semibold">{d.name}</span>
                    <span className="text-muted block text-xs">{d.slug ?? d.id}</span>
                  </td>
                  <td className={td}>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${category?.soft ?? "bg-brand-soft text-brand"}`}
                    >
                      {category?.label ?? d.category}
                    </span>
                  </td>
                  <td className={`${td} text-right tabular-nums ${d.words === 0 ? "text-red-500" : ""}`}>
                    {d.words}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{d.learners}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </>
  );
}
