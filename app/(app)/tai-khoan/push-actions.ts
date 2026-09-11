"use server";

import { sendPush } from "@/lib/push";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/** Dữ liệu trình duyệt trả về từ pushManager.subscribe(), đã toJSON(). */
export type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushActionResult = { ok: true } | { ok: false; error: string };

export async function savePushSubscription(
  input: SubscriptionInput,
): Promise<PushActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  if (!input?.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    return { ok: false, error: "Trình duyệt không trả về subscription hợp lệ." };
  }

  const supabase = await createClient();
  // Cùng thiết bị đăng ký lại (ví dụ đăng xuất rồi đăng nhập tài khoản khác)
  // thì endpoint không đổi — upsert để hàng chuyển sang người mới.
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: input.endpoint,
      user_id: user.id,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removePushSubscription(
  endpoint: string,
): Promise<PushActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Gửi ngay một thông báo tới chính thiết bị này, để người dùng thấy nó chạy. */
export async function sendTestPush(
  endpoint: string,
): Promise<PushActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (!subscription) {
    return { ok: false, error: "Thiết bị này chưa bật nhắc học." };
  }

  const result = await sendPush(subscription, {
    title: "DailyEng",
    body: "Thông báo thử — nhắc học đã bật thành công!",
    url: "/",
  });

  if (result !== "sent") {
    return { ok: false, error: "Không gửi được. Thử tắt rồi bật lại nhắc học." };
  }
  return { ok: true };
}
