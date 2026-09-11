import webpush from "web-push";

/** Nội dung một thông báo; service worker đọc JSON này để hiện lên. */
export type PushPayload = {
  title: string;
  body: string;
  /** Đường dẫn mở khi bấm vào thông báo. */
  url: string;
};

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** Thiếu khoá VAPID thì tính năng nhắc học tắt, app vẫn chạy bình thường. */
export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Thiếu NEXT_PUBLIC_VAPID_PUBLIC_KEY hoặc VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    publicKey,
    privateKey,
  );
}

export type SendResult = "sent" | "gone" | "failed";

/**
 * Gửi một thông báo tới một thiết bị.
 * "gone" nghĩa là trình duyệt đã huỷ subscription (người dùng tắt quyền,
 * gỡ app...) — phía gọi nên xoá hàng đó khỏi database.
 */
export async function sendPush(
  subscription: PushSubscriptionRow,
  payload: PushPayload,
): Promise<SendResult> {
  configure();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6 },
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("Gửi push thất bại:", error);
    return "failed";
  }
}
