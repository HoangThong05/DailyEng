"use server";

import { revalidatePath } from "next/cache";
import { BIO_MAX, COVER_PRESETS } from "@/lib/profile";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export type ProfileState = {
  error?: string;
  notice?: string;
};

/** Khớp với ràng buộc check (daily_goal between 1 and 200) trong schema.sql. */
const MIN_GOAL = 1;
const MAX_GOAL = 200;
const MAX_NAME_LENGTH = 40;

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const dailyGoal = Number(formData.get("daily_goal"));
  const bio = String(formData.get("bio") ?? "").trim();
  const cover = String(formData.get("cover") ?? "").trim();

  if (!displayName) return { error: "Tên hiển thị không được để trống." };
  if (displayName.length > MAX_NAME_LENGTH) {
    return { error: `Tên hiển thị tối đa ${MAX_NAME_LENGTH} ký tự.` };
  }
  if (
    !Number.isInteger(dailyGoal) ||
    dailyGoal < MIN_GOAL ||
    dailyGoal > MAX_GOAL
  ) {
    return { error: `Mục tiêu phải từ ${MIN_GOAL} đến ${MAX_GOAL} từ mỗi ngày.` };
  }

  if (bio.length > BIO_MAX) return { error: `Tiểu sử tối đa ${BIO_MAX} ký tự.` };

  const supabase = await createClient();
  const patch: {
    display_name: string;
    daily_goal: number;
    bio: string | null;
    cover?: string;
  } = { display_name: displayName, daily_goal: dailyGoal, bio: bio || null };
  // Ảnh bìa: chỉ nhận preset có sẵn; ảnh tải lên đi đường uploadProfileImage.
  if (cover in COVER_PRESETS) patch.cover = cover;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: error.message };

  // Home hiển thị cả tên lẫn mục tiêu nên phải làm mới theo.
  revalidatePath("/");
  revalidatePath("/tai-khoan");
  revalidatePath("/xep-hang");

  return { notice: "Đã lưu thay đổi." };
}

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Tải ảnh đại diện hoặc ảnh bìa lên bucket "avatars" (thư mục = id người
 * dùng, RLS chặn ghi chỗ khác). Client đã thu nhỏ sẵn nên file nhỏ.
 */
export async function uploadProfileImage(
  kind: "avatar" | "cover",
  formData: FormData,
): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Chưa chọn ảnh." };
  }
  if (file.size > 1_500_000) return { ok: false, error: "Ảnh quá lớn, thử ảnh khác." };
  if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) {
    return { ok: false, error: "Chỉ nhận ảnh JPG, PNG hoặc WebP." };
  }

  const supabase = await createClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${user.id}/${kind}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error) return { ok: false, error: `Không tải lên được: ${error.message}` };

  // Thêm ?v= để trình duyệt không dùng ảnh cũ trong cache sau khi đổi.
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const { error: saveError } = await supabase
    .from("profiles")
    .update(kind === "avatar" ? { avatar_url: url } : { cover: `url:${url}` })
    .eq("id", user.id);
  if (saveError) return { ok: false, error: `Không lưu được hồ sơ: ${saveError.message}` };

  revalidatePath("/", "layout");
  return { ok: true, url };
}

/** Bỏ ảnh tải lên: về vịt mặc định / bìa preset. */
export async function clearProfileImage(
  kind: "avatar" | "cover",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(kind === "avatar" ? { avatar_url: null } : { cover: "sky" })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  revalidatePath("/tai-khoan");
  revalidatePath("/xep-hang");
  return { ok: true };
}
/** Bật/tắt ẩn khỏi bảng xếp hạng. */
export async function setHideRank(
  hide: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Phiên đăng nhập đã hết hạn." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ hide_rank: hide })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/xep-hang");
  revalidatePath("/tai-khoan");
  return { ok: true };
}
