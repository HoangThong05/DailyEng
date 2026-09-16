import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Test cho phần lõi thuần logic (Leitner, XP, chấm câu, dựng chặng học).
 * Không chạm database hay React — chạy nhanh, không cần môi trường trình duyệt.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
