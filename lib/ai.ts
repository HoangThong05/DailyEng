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
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
].filter((name): name is string => !!name);

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 50);
/**
 * Trần theo phút: Gemini gói miễn phí chỉ cho ~15 lượt/phút cho CẢ app, bấm
 * liên tục là dính 429. Chặn sớm ở đây để báo lỗi tử tế thay vì lỗi của Google.
 */
export const AI_MINUTE_LIMIT = Number(process.env.AI_MINUTE_LIMIT ?? 6);
/**
 * Trần độ dài câu trả lời. Tiếng Việt tốn token hơn tiếng Anh nhiều, để thấp
 * quá thì câu trả lời đứt giữa chừng; 1500 đủ cho một lời giải thích đầy đủ.
 */
export const AI_MAX_OUTPUT_TOKENS = 1500;
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
- Trả lời gọn và LUÔN viết trọn ý: tối đa khoảng 180 từ, dùng gạch đầu dòng khi liệt kê. Không lan man, không mở đầu bằng lời chào dài. Thà bớt ví dụ còn hơn để câu cuối dở dang.
- Chỉ trả lời chuyện học tiếng Anh và chuyện dùng app. Câu hỏi ngoài chủ đề (code, toán, đời sống, chính trị…) thì từ chối nhẹ nhàng một câu và gợi ý hỏi về tiếng Anh.
- Không bịa từ hay nghĩa. Không chắc thì nói không chắc.
- Không dùng markdown phức tạp (bảng, tiêu đề #); chỉ dùng gạch đầu dòng, **in đậm** cho từ khoá.
- TUYỆT ĐỐI không dùng LaTeX hay công thức toán ($...$, \rightarrow, \text{}...). Cần mũi tên thì gõ thẳng ký tự → hoặc chữ "thành".`;

/** Số tin đã dùng hôm nay của người đang đăng nhập. */
export async function countAiToday(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("ai_chat_log")
    .select("id", { count: "exact", head: true })
    .eq("day", todayInAppZone());
  return count ?? 0;
}

/** Số tin trong 60 giây gần nhất của người đang đăng nhập. */
export async function countAiLastMinute(): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("ai_chat_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
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

/** Ném lỗi có thông điệp tiếng Việt (dùng trong generator). */
function yieldError(status: number, body: string): never {
  throw new Error(geminiErrorMessage(status, body));
}

/** Đổi mã lỗi của Google thành câu tiếng Việt người dùng hiểu được. */
function geminiErrorMessage(status: number, body: string) {
  if (status === 503 || status === 500 || status === 504) {
    return "Máy chủ AI đang quá tải hoặc phản hồi chậm, thử lại sau một chút nhé.";
  }
  if (status === 429) {
    return "Đã chạm hạn mức miễn phí trong phút này, đợi khoảng một phút rồi hỏi lại nhé.";
  }
  if (status === 403) {
    return "Khoá API chưa được phép gọi Gemini (cần bật Generative Language API cho project).";
  }
  if (status === 400) return "Khoá API không hợp lệ hoặc câu hỏi quá dài.";
  if (status === 404) {
    return "Model AI đang cấu hình không còn tồn tại — cần cập nhật tên model (GEMINI_MODEL).";
  }
  return `Lỗi ${status || "mạng"}${body ? `: ${body.slice(0, 220)}` : ""}`;
}

/**
 * Gọi Gemini (REST, không cần SDK) và stream từng đoạn chữ.
 * Gói miễn phí của Google AI Studio đủ cho app nhỏ; xem README về hạn mức.
 */
export async function* streamGemini(
  turns: ChatTurn[],
  onUsage: (usage: Usage) => void,
): AsyncGenerator<string> {
  const payload = {
    systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
    contents: turns.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    generationConfig: {
      maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
      temperature: 0.6,
      // Gemini 2.5+/3.x mặc định "suy nghĩ" vài giây trước khi trả lời — thừa
      // với câu hỏi từ vựng, chỉ làm chậm. Tắt để có chữ đầu tiên ngay.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  const withThinkingOff = JSON.stringify(payload);
  const withoutThinkingField = JSON.stringify({
    ...payload,
    generationConfig: { maxOutputTokens: AI_MAX_OUTPUT_TOKENS, temperature: 0.6 },
  });

  // Thử lần lượt các model. 404 (không có model), 429 (chạm hạn mức) và 503
  // (Google đang quá tải) thì chuyển sang model kế. Mỗi lần gọi chờ tối đa
  // CONNECT_MS để bắt đầu nhận dữ liệu; tổng thời gian thử không quá BUDGET_MS
  // — vượt là Vercel cắt hàm (504), thà báo lỗi sớm còn hơn.
  const RETRYABLE = [404, 429, 503, 500];
  const CONNECT_MS = 12_000;
  const BUDGET_MS = 30_000;
  const startedAt = Date.now();
  let response: Response | null = null;
  // Lỗi đáng báo nhất: quá tải / hạn mức nói lên tình trạng thật, còn 404 của
  // model dự phòng chỉ là chuyện nội bộ — không đem 404 ra báo nếu có lỗi khác.
  let bestStatus = 0;
  let bestBody = "";
  const remember = (status: number, body: string) => {
    const rank = (code: number) => (code === 429 ? 3 : code === 503 || code === 504 || code === 500 ? 2 : 1);
    if (bestStatus === 0 || rank(status) > rank(bestStatus)) {
      bestStatus = status;
      bestBody = body;
    }
  };

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
    // 503 trả về nhanh thì nghỉ một nhịp rồi thử lại chính model đó một lần.
    let body = withThinkingOff;
    for (let attemptNo = 0; attemptNo < 3 && !response; attemptNo++) {
      if (Date.now() - startedAt > BUDGET_MS) break;
      const t0 = Date.now();
      let attempt: Response;
      try {
        attempt = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(CONNECT_MS),
        });
      } catch (error) {
        remember(504, error instanceof Error ? error.message : "timeout");
        console.error(`Gemini ${model}: không phản hồi trong ${CONNECT_MS / 1000}s`);
        break; // treo thì không thử lại model này
      }
      if (attempt.ok && attempt.body) {
        console.log(`Gemini ${model}: bắt đầu trả lời sau ${Date.now() - t0}ms`);
        response = attempt;
        break;
      }
      const status = attempt.status;
      const text = (await attempt.text().catch(() => "")).slice(0, 300);
      console.error(`Gemini ${model} (lần ${attemptNo + 1}):`, status, text);
      // Model không nhận thinkingConfig → gửi lại bản không có trường đó.
      if (status === 400 && /thinking/i.test(text) && body === withThinkingOff) {
        body = withoutThinkingField;
        continue;
      }
      remember(status, text);
      if (!RETRYABLE.includes(status)) return yieldError(bestStatus, bestBody);
      if (status !== 503 || attemptNo >= 1) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (response) break;
  }

  if (!response?.body) throw new Error(geminiErrorMessage(bestStatus, bestBody));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: Usage = { input: 0, output: 0 };
  let truncated = false;

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
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        };
        if (chunk.candidates?.[0]?.finishReason === "MAX_TOKENS") truncated = true;
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
  if (truncated) {
    yield "\n\n*(Câu trả lời hơi dài nên bị cắt — hỏi tiếp để Vịt nói nốt nhé.)*";
  }
  onUsage(usage);
}
