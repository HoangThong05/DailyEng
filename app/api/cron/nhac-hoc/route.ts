import { NextResponse, type NextRequest } from "next/server";
import { addDays, hourInAppZone, todayInAppZone } from "@/lib/leitner";
import { isPushConfigured, sendPush, type PushPayload } from "@/lib/push";
import { computeStreak } from "@/lib/streak";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron nhắc học, pg_cron trên Supabase gọi mỗi giờ (xem schema-06-gio-nhac.sql).
 *
 * Gửi cho những thiết bị đã bật nhắc mà chủ nhân chọn đúng giờ này và hôm
 * nay chưa học từ nào. Không có ai đăng nhập ở đây nên phải dùng service role
 * để đọc dữ liệu của mọi người — vì thế route được khoá bằng CRON_SECRET.
 *
 * Thêm ?hour=20 để giả lập một giờ khác khi chạy thử bằng tay.
 */

/** Chỉ cần đủ dài để xác định chuỗi hiện tại, không cần cả lịch sử. */
const STREAK_LOOKBACK_DAYS = 60;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function buildPayload(streak: number): PushPayload {
  return {
    title: "DailyEng",
    body:
      streak > 0
        ? `Chuỗi ${streak} ngày đang chờ bạn. Ôn vài từ để giữ lửa nhé!`
        : "Hôm nay bạn chưa học từ nào. Dành 5 phút ôn vài từ nào!",
    url: "/",
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Chưa cấu hình VAPID" }, { status: 503 });
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 503 });
  }

  const today = todayInAppZone();
  // Chỉ nhận giờ giả lập khi có tham số thật; Number(null) = 0 từng làm
  // route tưởng lúc nào cũng là 0 giờ và không gửi cho ai.
  const raw = request.nextUrl.searchParams.get("hour");
  const override = raw === null ? NaN : Number(raw);
  const hour =
    Number.isInteger(override) && override >= 0 && override <= 23
      ? override
      : hourInAppZone();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("reminder_hour", hour);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  if (!profiles?.length) {
    return NextResponse.json({ hour, sent: 0, skipped: 0, removed: 0 });
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, user_id, p256dh, auth")
    .in(
      "user_id",
      profiles.map((profile) => profile.id),
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!subscriptions?.length) {
    return NextResponse.json({ hour, sent: 0, skipped: 0, removed: 0 });
  }

  const userIds = [...new Set(subscriptions.map((row) => row.user_id))];

  const since = addDays(today, -STREAK_LOOKBACK_DAYS);
  const [{ data: days }, { data: shields }] = await Promise.all([
    supabase.from("study_days").select("user_id, day").in("user_id", userIds).gte("day", since),
    // Ngày được Đóng băng chuỗi cứu cũng giữ chuỗi (schema-23).
    supabase.from("streak_shields").select("user_id, day").in("user_id", userIds).gte("day", since),
  ]);

  const daysByUser = new Map<string, string[]>();
  for (const row of [...(days ?? []), ...(shields ?? [])]) {
    const list = daysByUser.get(row.user_id) ?? [];
    list.push(row.day);
    daysByUser.set(row.user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  const gone: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const studyDays = daysByUser.get(subscription.user_id) ?? [];
      if (studyDays.includes(today)) {
        skipped += 1;
        return;
      }

      const { current } = computeStreak(studyDays, today);
      const result = await sendPush(subscription, buildPayload(current));

      if (result === "sent") sent += 1;
      else if (result === "gone") gone.push(subscription.endpoint);
    }),
  );

  // Trình duyệt đã huỷ subscription thì dọn luôn, lần sau khỏi gửi vô ích.
  if (gone.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  }

  return NextResponse.json({ hour, sent, skipped, removed: gone.length });
}
