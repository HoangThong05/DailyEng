import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ANIMATED_FROM_PRICE, frameIsAnimated, isOnSale, SHOP_ITEMS } from "@/lib/shop";

describe("danh mục cửa hàng", () => {
  it("khoá không trùng", () => {
    const keys = SHOP_ITEMS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("khớp giá và loại với schema-23 (SQL là nơi kiểm giá khi mua)", () => {
    const sql = readFileSync("supabase/schema-23-cua-hang.sql", "utf8");
    // Vật phẩm chỉ-trao khai ở schema-25; tests/seeds.test.ts kiểm riêng.
    for (const item of SHOP_ITEMS.filter((i) => !i.awardOnly)) {
      const limited = item.limitedUntil ? `date '${item.limitedUntil}'` : "null";
      const row = `('${item.key}', '${item.kind}', '${item.name}', ${item.price}, ${limited})`;
      expect(sql, `thiếu hoặc lệch: ${row}`).toContain(row);
    }
  });

  it("vật phẩm chỉ-trao không có giá bán", () => {
    for (const item of SHOP_ITEMS.filter((i) => i.awardOnly)) {
      expect(item.price, item.key).toBe(0);
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

describe("hiệu ứng động của khung", () => {
  it("chỉ khung từ 1000 Hạt trở lên mới động", () => {
    for (const item of SHOP_ITEMS.filter((i) => i.kind === "khung")) {
      expect(frameIsAnimated(item), item.key).toBe(item.price >= ANIMATED_FROM_PRICE);
    }
  });

  it("mọi khung đắt tiền đều khai hiệu ứng, không cái nào đứng yên", () => {
    const pricey = SHOP_ITEMS.filter((i) => i.kind === "khung" && i.price >= ANIMATED_FROM_PRICE);
    expect(pricey.length).toBeGreaterThan(0);
    for (const item of pricey) expect(item.frame?.effect, item.key).toBeTruthy();
  });
});
