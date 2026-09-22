"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type FriendResult = { ok: true; message: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refresh() {
  revalidatePath("/ban-be");
  revalidatePath("/xep-hang");
  revalidatePath("/nguoi-dung", "layout");
}

/** Gửi lời mời kết bạn. Người kia đã mời mình rồi thì đồng ý luôn. */
export async function sendFriendRequest(targetId: string): Promise<FriendResult> {
  if (!UUID.test(targetId)) return { ok: false, error: "Người dùng không hợp lệ." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  if (user.id === targetId) return { ok: false, error: "Không tự kết bạn với mình được." };

  const supabase = await createClient();

  // Họ mời trước → coi như bấm Đồng ý, khỏi để hai lời mời chéo nhau.
  const { error: acceptError } = await supabase.rpc("accept_friend", { target: targetId });
  if (!acceptError) {
    refresh();
    return { ok: true, message: "Hai bạn đã là bạn bè." };
  }

  const { error } = await supabase
    .from("friendships")
    .insert({ requester: user.id, addressee: targetId, status: "pending" });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Đã gửi lời mời rồi." };
    return { ok: false, error: "Không gửi được lời mời. Thử lại sau nhé." };
  }

  refresh();
  return { ok: true, message: "Đã gửi lời mời kết bạn." };
}

export async function acceptFriendRequest(targetId: string): Promise<FriendResult> {
  if (!UUID.test(targetId)) return { ok: false, error: "Người dùng không hợp lệ." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_friend", { target: targetId });
  if (error) return { ok: false, error: "Lời mời không còn nữa." };
  refresh();
  return { ok: true, message: "Đã thành bạn bè." };
}

/** Dùng chung cho: từ chối lời mời, huỷ lời mời đã gửi, huỷ kết bạn. */
export async function removeFriend(targetId: string): Promise<FriendResult> {
  if (!UUID.test(targetId)) return { ok: false, error: "Người dùng không hợp lệ." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();
  // RLS chỉ cho xoá dòng mình có mặt, nên lọc theo cả hai chiều là đủ.
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester.eq.${user.id},addressee.eq.${targetId}),and(requester.eq.${targetId},addressee.eq.${user.id})`,
    );
  if (error) return { ok: false, error: "Không thực hiện được. Thử lại sau nhé." };
  refresh();
  return { ok: true, message: "Đã cập nhật." };
}
