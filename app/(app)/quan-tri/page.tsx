import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/_components/page-header";
import { createClient } from "@/lib/supabase/server";
import { HandledToggle } from "./handled-toggle";

export const metadata: Metadata = { title: "Quản trị" };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

/** Trang quản trị: chỉ admin (cờ is_admin đặt bằng SQL) mới vào được. */
export default async function QuanTriPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  const { data: rows } = await supabase
    .from("feedback")
    .select("id, email, message, page, handled, created_at")
    .order("handled", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);

  const list = rows ?? [];
  const pending = list.filter((row) => !row.handled).length;

  return (
    <>
      <PageHeader
        title="Góp ý người dùng"
        subtitle={
          pending > 0 ? `${pending} góp ý chưa xử lý` : "Không còn góp ý nào chờ"
        }
        mascot="hoc"
      />

      <div className="px-5 pt-2 pb-4">
        {list.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">Chưa có góp ý nào.</p>
        ) : (
          <ul className="stagger space-y-3">
            {list.map((row) => (
              <li
                key={row.id}
                className={`border-border rounded-2xl border p-4 ${
                  row.handled ? "bg-card opacity-60" : "bg-card"
                }`}
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
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {row.message}
                </p>
                <div className="mt-3">
                  <HandledToggle id={row.id} handled={row.handled} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
