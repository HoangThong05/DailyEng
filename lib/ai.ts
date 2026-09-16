import { todayInAppZone } from "@/lib/leitner";
import { createClient } from "@/lib/supabase/server";

/**
 * "Hỏi AI": gia sư tiếng Anh. Chạy được với một trong hai nhà cung cấp —
 * ưu tiên Claude nếu có khoá, không thì Gemini (gói miễn phí của Google).
 * Không có khoá nào thì tính năng tự ẩn, app chạy như không có.
 */

export type AiProvider = "claude" | "gemini";

export function aiProvider(): AiProvider | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

export function isAiEnabled() {
  return aiProvider() !== null;
}

export const CLAUDE_MODEL = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";
/**
 * Model Gemini sẽ thử lần lượt: đặt GEMINI_MODEL thì ưu tiên cái đó, sau đó
 * là các tên phổ biến — tên model của Google đổi theo thời gian, thử vài cái
 * cho chắc thay vì hỏng hẳn.
 */
export const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
].filter((name): name is string => !!name);

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 50);
/** Trả lời ngắn cho rẻ và đọc nhanh trên điện thoại. */
export const AI_MAX_OUTPUT_TOKENS = 700;
/** Gửi tối đa ngần này lượt gần nhất làm ngữ cảnh. */
export const AI_HISTORY_TURNS = 10;
export const AI_MAX_MESSAGE_CHARS = 2000;

export const AI_SYSTEM_PROMPT = `Bạn là "Vịt" — gia sư tiếng Anh của app DailyEng, nói chuyện bằng tiếng Việt, thân thiện và ngắn gọn.

Nhiệm vụ: giúp người học tiếng Anh (chủ yếu người Việt, trình độ cơ bản đến trung cấp, nhiều người ôn TOEIC).
- Giải thích nghĩa, cách dùng, phân biệt từ gần nghĩa, ngữ pháp, phát âm (dùng IPA), collocation, sắc thái trang trọng/thân mật.
- Cho 1–3 câu ví dụ ngắn, có dịch tiếng Việt.
- Khi người học viết tiếng Anh: sửa lỗi, giải thích ngắn vì sao, gợi ý cách nói tự nhiên hơn.
- Khi hỏi về câu mock test TOEIC: giải thích đáp án đúng và vì sao các đáp án khác sai.
- Nếu người học muốn luyện hội thoại tiếng Anh: trả lời bằng tiếng Anh đơn giản, mỗi lượt kèm một dòng gợi ý/sửa lỗi bằng tiếng Việt trong ngoặc.
- Hỏi về chính app DailyEng (XP, cấp độ, chuỗi ngày, ôn tập giãn cách, nhiệm vụ, huy hiệu) hoặc phương pháp học thì cũng trả lời.

Quy tắc:
- Trả lời gọn: thường dưới 150 từ, dùng gạch đầu dòng khi liệt kê. Không lan man, không mở đầu bằng lời chào dài.
- Chỉ trả lời chuyện học tiếng Anh và chuyện dùng app. Câu hỏi ngoài chủ đề (code, toán, đời sống, chính trị…) thì từ chối nhẹ nhàng một câu và gợi ý hỏi về tiếng Anh.
- Không bịa từ hay nghĩa. Không chắc thì nói không chắc.
- Không dùng markdown phức tạp (bảng, tiêu đề #); chỉ dùng gạch đầu dòng, **in đậm** cho từ khoá.`;

/** Số tin đã dùng hôm nay của người đang đăng nhập. */
export async function countAiToday(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("ai_chat_log")
    .select("id", { count: "exact", head: true })
    .eq("day", todayInAppZone());
  return count ?? 0;
}

export type AiQuota = { enabled: boolean; used: number; limit: number };

export async function getAiQuota(): Promise<AiQuota> {
  if (!isAiEnabled()) return { enabled: false, used: 0, limit: AI_DAILY_LIMIT };
  const used = await countAiToday();
  return { enabled: true, used, limit: AI_DAILY_LIMIT };
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Số token đã dùng, để ghi nhật ký theo dõi chi phí. */
export type Usage = { input: number; output: number };

/**
 * Gọi Gemini (REST, không cần SDK) và stream từng đoạn chữ.
 * Gói miễn phí của Google AI Studio đủ cho app nhỏ; xem README về hạn mức.
 */
export async function* streamGemini(
  turns: ChatTurn[],
  onUsage: (usage: Usage) => void,
): AsyncGenerator<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
    contents: turns.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    generationConfig: { maxOutputTokens: AI_MAX_OUTPUT_TOKENS, temperature: 0.6 },
  });

  // Thử lần lượt các model; chỉ 404 (không có model đó) mới thử tiếp.
  let response: Response | null = null;
  let lastError = "";
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
    const attempt = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (attempt.ok && attempt.body) {
      response = attempt;
      break;
    }
    lastError = `${attempt.status} ${(await attempt.text().catch(() => "")).slice(0, 400)}`;
    console.error(`Gemini ${model}:`, lastError);
    if (attempt.status !== 404) break;
  }

  if (!response?.body) throw new Error(`Gemini ${lastError}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: Usage = { input: 0, output: 0 };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: các khối cách nhau bằng dòng trống, mỗi khối một dòng "data: {...}".
    let cut = buffer.indexOf("\n");
    while (cut !== -1) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 1);
      cut = buffer.indexOf("\n");
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        };
        if (chunk.usageMetadata) {
          usage = {
            input: chunk.usageMetadata.promptTokenCount ?? usage.input,
            output: chunk.usageMetadata.candidatesTokenCount ?? usage.output,
          };
        }
        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
          if (part.text) yield part.text;
        }
      } catch {
        // Khối chưa đủ / không phải JSON — bỏ qua.
      }
    }
  }
  onUsage(usage);
}
