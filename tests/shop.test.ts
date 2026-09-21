import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isOnSale, SHOP_ITEMS } from "@/lib/shop";

describe("danh mục cửa hàng", () => {
  it("khoá không trùng", () => {
    const keys = SHOP_ITEMS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("khớp giá và loại với schema-23 (SQL là nơi kiểm giá khi mua)", () => {
    const sql = readFileSync("supabase/schema-23-cua-hang.sql", "utf8");
    for (const item of SHOP_ITEMS) {
      const limited = item.limitedUntil ? `date '${item.limitedUntil}'` : "null";
      const row = `('${item.key}', '${item.kind}', '${item.name}', ${item.price}, ${limited})`;
      expect(sql, `thiếu hoặc lệch: ${row}`).toContain(row);
    }
  });

  it("vật phẩm theo mùa hết hạn thì không bán", () => {
    const seasonal = SHOP_ITEMS.find((item) => item.limitedUntil)!;
    expect(isOnSale(seasonal, "2020-01-01")).toBe(true);
    expect(isOnSale(seasonal, "2099-01-01")).toBe(false);
    const evergreen = SHOP_ITEMS.find((item) => !item.limitedUntil)!;
    expect(isOnSale(evergreen, "2099-01-01")).toBe(true);
  });
});
