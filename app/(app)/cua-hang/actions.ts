"use server";

import { revalidatePath } from "next/cache";
import { type ItemKind, shopItem } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

export type ShopResult = { ok: true; message: string } | { ok: false; error: string };

/** Mọi trang có vẽ avatar/bìa/danh hiệu/số dư. */
function revalidateAll() {
  revalidatePath("/", "layout");
}

/** Lỗi từ hàm SQL đã là tiếng Việt (raise exception '...'). */
function friendly(message: string) {
  return message.replace(/^.*?:\s*/, "").trim() || "Không thực hiện được. Thử lại nhé.";
}

export async function buyItem(key: string): Promise<ShopResult> {
  const item = shopItem(key);
  if (!item) return { ok: false, error: "Không có vật phẩm này." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_item", { p_key: key });
  if (error) return { ok: false, error: friendly(error.message) };

  revalidateAll();
  return { ok: true, message: `Đã mua ${item.name}.` };
}

/** Trang bị (key) hoặc tháo (null) một vật phẩm đã mua. */
export async function equipItem(kind: ItemKind, key: string | null): Promise<ShopResult> {
  if (key && shopItem(key)?.kind !== kind) return { ok: false, error: "Vật phẩm không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("equip_item", { p_kind: kind, p_key: key });
  if (error) return { ok: false, error: friendly(error.message) };

  revalidateAll();
  return { ok: true, message: key ? "Đã trang bị." : "Đã tháo." };
}
