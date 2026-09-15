import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminTitle, formatDate } from "../_components/ui";
import { HandledToggle } from "./handled-toggle";

export const metadata: Metadata = { title: "Quản trị · Góp ý" };

export default async function GopYAdminPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("feedback")
    .select("id, email, message, page, handled, created_at")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);

  const list = rows ?? [];
  const pending = list.filter((row) => !row.handled).length;

  return (
    <>
      <AdminTitle
        title="Góp ý người dùng"
        subtitle={pending > 0 ? `${pending} chưa xử lý · ${list.length} tổng` : `Không còn góp ý chờ · ${list.length} tổng`}
      />

      {list.length === 0 ? (
        <p className="text-muted text-sm">Chưa có góp ý nào.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((row) => (
            <li
              key={row.id}
              className={`border-border bg-card rounded-2xl border p-4 ${row.handled ? "opacity-60" : ""}`}
            >
              <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  {formatDate(row.created_at)}
                  {row.page ? ` · ${row.page}` : ""}
                </span>
                {row.email ? (
                  <a href={`mailto:${row.email}`} className="text-brand font-semibold">
                    {row.email}
                  </a>
                ) : (
                  <span>ẩn danh</span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{row.message}</p>
              <div className="mt-3">
                <HandledToggle id={row.id} handled={row.handled} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
