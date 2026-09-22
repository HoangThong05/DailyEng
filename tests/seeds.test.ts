import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLLECTIONS, FREEZE_MAX, SEED_RULES, SHOP_ITEMS, shopItem } from "@/lib/shop";
import { WEEKLY_DEFS, weeklyKey } from "@/lib/weekly";

const SQL = readFileSync("supabase/schema-23-cua-hang.sql", "utf8");

/**
 * Hạt là "tiền" trong app nên sai sót đắt hơn lỗi giao diện: giá phải khớp
 * giữa code và SQL (SQL mới là nơi trừ tiền), và mọi khoản cộng phải có khoá
 * ref duy nhất để mở app nhiều lần không cộng đôi.
 */
describe("kinh tế Hạt", () => {
  it("mọi khoản cộng trong claim_seeds đều chống cộng trùng", () => {
    // Chỉ xét phần thân claim_seeds; buy_item cũng ghi sổ nhưng là khoản trừ,
    // ref có mốc thời gian nên không dùng on conflict.
    const start = SQL.indexOf("function public.claim_seeds");
    const body = SQL.slice(start, SQL.indexOf("revoke all on function public.claim_seeds", start));
    const inserts = body.split("insert into public.seed_ledger").slice(1);
    expect(inserts.length).toBeGreaterThanOrEqual(6);
    for (const block of inserts) {
      // Mỗi lệnh cộng phải có ref duy nhất + bỏ qua khi trùng.
      expect(block.slice(0, 900)).toContain("on conflict (user_id, ref) do nothing");
    }
  });

  it("chỉ trừ Hạt qua buy_item, và luôn kiểm số dư trước", () => {
    const buy = SQL.slice(SQL.indexOf("function public.buy_item"));
    expect(buy).toContain("if balance < item.price then");
    // Khoá theo người để hai lần mua đồng thời không vượt số dư.
    expect(buy).toContain("pg_advisory_xact_lock");
    // Giá lấy từ bảng, không nhận từ client.
    expect(buy).toContain("from public.shop_items where key = p_key");
  });

  it("hàm đổi Hạt / kho đồ không mở cho vai trò ẩn danh", () => {
    for (const fn of ["claim_seeds()", "buy_item(text)", "equip_item(text, text)"]) {
      expect(SQL).toContain(`revoke all on function public.${fn} from public`);
      expect(SQL).toContain(`grant execute on function public.${fn} to authenticated`);
    }
  });

  it("mỗi bộ sưu tập theo mùa có vật phẩm và hạn bán khớp nhau", () => {
    for (const collection of COLLECTIONS) {
      const items = SHOP_ITEMS.filter((item) => item.collection === collection.key);
      expect(items.length, collection.key).toBeGreaterThan(0);
      for (const item of items) expect(item.limitedUntil, item.key).toBe(collection.until);
    }
  });

  it("thu nhập tối đa một ngày thường vẫn nhỏ hơn món rẻ nhất", () => {
    // 5 điểm danh + 10 nhiệm vụ + 5 mục tiêu + 6 khối lượng học = 26.
    const dailyMax = 5 + 10 + 5 + 6;
    const cheapest = Math.min(...SHOP_ITEMS.map((item) => item.price));
    expect(dailyMax).toBeLessThan(cheapest);
  });

  it("nhiệm vụ tuần sinh khoá theo tuần, khớp tiền tố SQL đọc", () => {
    const key = weeklyKey("hoc-5-ngay", "2026-09-21");
    expect(key).toBe("tuan-hoc-5-ngay-2026-09-21");
    expect(SQL).toContain("like 'tuan-%'");
    expect(SQL).toContain("like 'tuan-hoc-5-ngay-%'");
    // Hai nhiệm vụ tuần, khoá khác nhau.
    expect(new Set(WEEKLY_DEFS.map((d) => d.key)).size).toBe(WEEKLY_DEFS.length);
  });

  it("giới hạn Đóng băng chuỗi trong code khớp SQL", () => {
    expect(SQL).toContain(`>= ${FREEZE_MAX} then raise exception`);
    expect(shopItem("dong-bang")?.kind).toBe("dong-bang");
  });

  it("bảng cách kiếm Hạt có đủ các nguồn đang cộng trong SQL", () => {
    const text = SEED_RULES.map((rule) => rule.text).join(" ");
    for (const word of ["Điểm danh", "nhiệm vụ", "mục tiêu", "chuỗi", "huy hiệu", "lượt"]) {
      expect(text, word).toContain(word);
    }
  });
});
