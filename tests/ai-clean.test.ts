import { describe, expect, it } from "vitest";
import { AI_SYSTEM_PROMPT } from "@/lib/ai";

/**
 * Bản sao quy tắc dọn LaTeX trong app/_components/ai-chat.tsx (component đó là
 * "use client" nên không import thẳng vào test node được). Đổi bên kia thì đổi
 * cả đây.
 */
const LATEX: [RegExp, string][] = [
  [/\\(?:rightarrow|to|Rightarrow)\b/g, "→"],
  [/\\(?:leftarrow|gets|Leftarrow)\b/g, "←"],
  [/\\times\b/g, "×"],
  [/\\(?:text|mathrm|mathbf|textbf)\{([^}]*)\}/g, "$1"],
];

function clean(text: string) {
  let out = text;
  for (const [pattern, replacement] of LATEX) out = out.replace(pattern, replacement);
  out = out.replace(/\$\$?([^$]*)\$\$?/g, "$1");
  return out.replace(/[ \t]{2,}/g, " ");
}

describe("dọn LaTeX trong câu trả lời AI", () => {
  it("đổi mũi tên thành ký tự thường", () => {
    expect(clean("Chưa thân $\\rightarrow$ Dùng Hello.")).toBe("Chưa thân → Dùng Hello.");
  });

  it("bỏ dấu đô la bao quanh", () => {
    expect(clean("Công thức $a + b$ ở đây")).toBe("Công thức a + b ở đây");
  });

  it("gỡ \\text{}", () => {
    expect(clean("$\\text{invoice}$ nghĩa là hoá đơn")).toBe("invoice nghĩa là hoá đơn");
  });

  it("không đụng vào câu bình thường", () => {
    const text = "Hi Nam, long time no see! (Chào Nam, lâu rồi không gặp!)";
    expect(clean(text)).toBe(text);
  });
});

describe("system prompt", () => {
  it("có nhắc cấm LaTeX", () => {
    expect(AI_SYSTEM_PROMPT).toMatch(/LaTeX/);
  });
});
