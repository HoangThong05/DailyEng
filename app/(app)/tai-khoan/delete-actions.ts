"use server";

import { redirect } from "next/navigation";
import { LANDING_PATH } from "@/lib/supabase/proxy";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type DeleteState = {
  error?: string;
};

/** Chữ người dùng phải gõ để xác nhận, tránh bấm nhầm. */
const DELETE_CONFIRM_WORD = "XOA";

/**
 * Xóa tài khoản của chính mình: dọn ảnh trong bucket trước (Storage không
 * cascade theo auth.users), rồi gọi hàm SQL xóa dòng auth.users — mọi bảng
 * dữ liệu học cascade theo. Xong thì đăng xuất và về trang giới thiệu.
 */
export async function deleteAccount(
  _prevState: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== DELETE_CONFIRM_WORD) {
    return { error: `Gõ đúng chữ ${DELETE_CONFIRM_WORD} để xác nhận.` };
  }

  const user = await getCurrentUser();
  if (!user) redirect(LANDING_PATH);

  const supabase = await createClient();

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return {
      error:
        error.message === "Tài khoản quản trị không tự xóa được"
          ? error.message
          : "Chưa xóa được. Thử lại sau hoặc liên hệ hỗ trợ.",
    };
  }

  await supabase.auth.signOut();
  redirect(LANDING_PATH);
}
