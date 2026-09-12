import type { Metadata } from "next";
import { signOut } from "@/app/_actions/auth";
import { PageHeader } from "@/app/_components/page-header";
import { DEFAULT_REMINDER_HOUR } from "@/lib/reminder";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { ReminderToggle } from "./reminder-toggle";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = { title: "Cá nhân" };

export default async function TaiKhoanPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, daily_goal, reminder_hour")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <>
      <PageHeader title="Cá nhân" subtitle={user?.email ?? undefined} />

      <div className="grid gap-8 px-5 pt-2 pb-4 md:grid-cols-2">
        <section aria-labelledby="ho-so">
          <h2 id="ho-so" className="text-muted mb-3 px-1 text-sm font-medium">
            Hồ sơ
          </h2>
          <ProfileForm
            displayName={
              profile?.display_name ?? user?.email?.split("@")[0] ?? ""
            }
            dailyGoal={profile?.daily_goal ?? 10}
          />
        </section>

        <section aria-labelledby="nhac-hoc">
          <h2 id="nhac-hoc" className="text-muted mb-3 px-1 text-sm font-medium">
            Thông báo
          </h2>
          <ReminderToggle
            vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
            reminderHour={profile?.reminder_hour ?? DEFAULT_REMINDER_HOUR}
          />
        </section>

        <section aria-labelledby="giao-dien">
          <h2
            id="giao-dien"
            className="text-muted mb-3 px-1 text-sm font-medium"
          >
            Giao diện
          </h2>
          <ThemeToggle />
        </section>

        <section aria-labelledby="phien">
          <h2 id="phien" className="text-muted mb-3 px-1 text-sm font-medium">
            Phiên đăng nhập
          </h2>
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="text-muted text-xs">Email</p>
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
      </div>
    </>
  );
}