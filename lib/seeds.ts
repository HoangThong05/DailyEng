import { createClient } from "@/lib/supabase/server";
import { shopItem } from "@/lib/shop";

/** Ví Hạt + kho đồ + đang trang bị gì của người đang đăng nhập. */
export type Wallet = {
  balance: number;
  freezes: number;
  /** Khoá vật phẩm đã mua (không gồm đóng băng). */
  owned: string[];
  equipped: { frame: string | null; title: string | null; cover: string | null };
  /** 20 dòng sổ cái gần nhất, mới trước. */
  history: { amount: number; reason: string; at: string }[];
};

const EMPTY: Wallet = {
  balance: 0,
  freezes: 0,
  owned: [],
  equipped: { frame: null, title: null, cover: null },
  history: [],
};

/**
 * Cộng Hạt mới xứng đáng (từ dữ liệu học) và tự dùng Đóng băng nếu hôm qua
 * bỏ lỡ. Gọi mỗi lần vào app (loadAppShell); rẻ vì toàn on-conflict-do-nothing.
 * Chưa chạy schema-23 thì lỗi được nuốt, app vẫn chạy.
 */
export async function settleSeeds() {
  const supabase = await createClient();
  const [{ error: claimError }, { error: freezeError }] = await Promise.all([
    supabase.rpc("claim_seeds"),
    supabase.rpc("use_streak_freeze"),
  ]);
  if (claimError) console.error("claim_seeds:", claimError.message);
  if (freezeError) console.error("use_streak_freeze:", freezeError.message);
}

export async function getWallet(): Promise<Wallet> {
  const supabase = await createClient();
  const [{ data: balance }, { data: freezes }, { data: inventory }, { data: profile }, { data: ledger }] =
    await Promise.all([
      supabase.rpc("seed_balance"),
      supabase.rpc("my_freezes"),
      supabase.from("inventory").select("item_key"),
      supabase.from("profiles").select("frame, title, cover").maybeSingle(),
      supabase
        .from("seed_ledger")
        .select("amount, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (typeof balance !== "number") return EMPTY;

  return {
    balance,
    freezes: freezes ?? 0,
    owned: (inventory ?? []).map((row) => row.item_key),
    equipped: {
      frame: shopItem(profile?.frame)?.key ?? null,
      title: shopItem(profile?.title)?.key ?? null,
      cover: shopItem(profile?.cover)?.key ?? null,
    },
    history: (ledger ?? []).map((row) => ({ amount: row.amount, reason: row.reason, at: row.created_at })),
  };
}

/** Chỉ số dư, cho chip ở góc trên. */
export async function getSeedBalance(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("seed_balance");
  return typeof data === "number" ? data : 0;
}
